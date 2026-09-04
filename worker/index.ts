/**
 * Cloudflare Worker for Filestora
 * Handles file uploads and downloads using the bound KV namespace: FILE_VAULT
 * Serves the React SPA via static assets binding: ASSETS
 */

export interface KVNamespaceListResult {
  keys: { name: string; expiration?: number; metadata?: Record<string, unknown> }[];
  list_complete: boolean;
  cursor?: string;
}

export interface KVNamespace {
  get(key: string, type?: 'text'): Promise<string | null>;
  get(key: string, type: 'json'): Promise<unknown | null>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string, type: 'stream'): Promise<ReadableStream | null>;
  getWithMetadata<M = Record<string, unknown>>(
    key: string,
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream'
  ): Promise<{ value: unknown; metadata: M | null }>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: {
      metadata?: Record<string, unknown>;
      expiration?: number;
      expirationTtl?: number;
    }
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<KVNamespaceListResult>;
}

export interface Env {
  FILE_VAULT: KVNamespace;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Key, X-Filename, X-File-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function errorResponse(message: string, status = 400, details?: unknown): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    status
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathname = url.pathname;

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Guard: Verify FILE_VAULT KV namespace binding
    const isApiRoute =
      pathname === '/upload' ||
      pathname === '/files' ||
      pathname.startsWith('/files/') ||
      pathname === '/api/health';

    if (isApiRoute && pathname !== '/api/health' && !env.FILE_VAULT) {
      return errorResponse(
        'FILE_VAULT KV namespace is not bound. Please bind a KV namespace with variable name FILE_VAULT in your Cloudflare dashboard or wrangler.jsonc.',
        500
      );
    }

    // Health check endpoint
    if (pathname === '/api/health' && method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'filestora-worker',
        timestamp: new Date().toISOString(),
        kvBound: !!env.FILE_VAULT,
      });
    }

    // =========================================================================
    // 1. POST /upload - Upload file to KV (await env.FILE_VAULT.put(key, data))
    // =========================================================================
    if (pathname === '/upload' && method === 'POST') {
      try {
        let key = url.searchParams.get('key') || request.headers.get('x-file-key') || '';
        let fileData: ArrayBuffer | null = null;
        let contentType = request.headers.get('content-type') || 'application/octet-stream';
        let originalFilename = request.headers.get('x-filename') || '';

        const isMultipart = contentType.includes('multipart/form-data');
        const isJson = contentType.includes('application/json');

        if (isMultipart) {
          const formData = await request.formData();
          const fileEntry = formData.get('file');
          const customKey = formData.get('key');

          if (typeof customKey === 'string' && customKey.trim()) {
            key = customKey.trim();
          }

          if (fileEntry instanceof File) {
            fileData = await fileEntry.arrayBuffer();
            contentType = fileEntry.type || 'application/octet-stream';
            originalFilename = fileEntry.name;
            if (!key) {
              key = originalFilename;
            }
          } else if (typeof fileEntry === 'string') {
            fileData = new TextEncoder().encode(fileEntry).buffer as ArrayBuffer;
          }
        } else if (isJson) {
          const bodyJson = (await request.json()) as Record<string, unknown>;
          if (typeof bodyJson.key === 'string') {
            key = bodyJson.key;
          }
          if (typeof bodyJson.contentType === 'string') {
            contentType = bodyJson.contentType;
          }
          if (typeof bodyJson.filename === 'string') {
            originalFilename = bodyJson.filename;
          }

          if (typeof bodyJson.data === 'string') {
            // Check if base64 encoded
            if (bodyJson.isBase64 || bodyJson.data.startsWith('data:')) {
              const base64Str = bodyJson.data.includes(',')
                ? bodyJson.data.split(',')[1]
                : bodyJson.data;
              const binaryString = atob(base64Str);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              fileData = bytes.buffer as ArrayBuffer;
            } else {
              fileData = new TextEncoder().encode(bodyJson.data).buffer as ArrayBuffer;
            }
          }
        } else {
          // Direct raw binary or text stream upload
          fileData = await request.arrayBuffer();
        }

        // Validate Key
        if (!key || !key.trim()) {
          const ext = contentType.includes('/') ? contentType.split('/')[1] : 'bin';
          key = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        }

        // Validate Data
        if (!fileData || fileData.byteLength === 0) {
          return errorResponse(
            'No file data provided. Send file as multipart/form-data, JSON { key, data }, or raw body.',
            400
          );
        }

        // KV value size limit check (Cloudflare KV limit is 25MB per value)
        const sizeBytes = fileData.byteLength;
        const maxKVBytes = 25 * 1024 * 1024; // 25 MB
        if (sizeBytes > maxKVBytes) {
          return errorResponse(
            `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds Cloudflare Workers KV limit of 25MB per value.`,
            413
          );
        }

        const metadata = {
          contentType,
          sizeBytes,
          filename: originalFilename || key,
          uploadedAt: new Date().toISOString(),
        };

        // Save file to KV
        await env.FILE_VAULT.put(key, fileData, { metadata });

        const origin = url.origin;
        return jsonResponse(
          {
            success: true,
            message: 'File uploaded successfully',
            file: {
              key,
              sizeBytes,
              contentType,
              filename: metadata.filename,
              uploadedAt: metadata.uploadedAt,
              downloadUrl: `${origin}/files/${encodeURIComponent(key)}`,
            },
          },
          201
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to upload file to KV: ${errorMsg}`, 500);
      }
    }

    // =========================================================================
    // 3. GET /files - List keys (await env.FILE_VAULT.list())
    // =========================================================================
    if (pathname === '/files' && method === 'GET') {
      try {
        const prefix = url.searchParams.get('prefix') || undefined;
        const limitParam = url.searchParams.get('limit');
        const cursor = url.searchParams.get('cursor') || undefined;

        let limit: number | undefined = undefined;
        if (limitParam) {
          const parsed = parseInt(limitParam, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
            limit = parsed;
          }
        }

        const result = await env.FILE_VAULT.list({
          prefix,
          limit,
          cursor,
        });

        const files = result.keys.map((item) => ({
          key: item.name,
          expiration: item.expiration,
          metadata: item.metadata || null,
          url: `${url.origin}/files/${encodeURIComponent(item.name)}`,
        }));

        return jsonResponse({
          success: true,
          count: files.length,
          files,
          list_complete: result.list_complete,
          cursor: result.cursor || null,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to list files from KV: ${errorMsg}`, 500);
      }
    }

    // =========================================================================
    // 2. GET /files/:key - Fetch and return file (await env.FILE_VAULT.get(key))
    // =========================================================================
    if (pathname.startsWith('/files/') && method === 'GET') {
      try {
        // Extract key from path (decode URI components to support encoded filenames)
        const rawKey = pathname.slice('/files/'.length);
        const key = decodeURIComponent(rawKey);

        if (!key) {
          return errorResponse('File key is required in URL path /files/:key', 400);
        }

        // Fetch file data and metadata from KV
        const { value, metadata } = await env.FILE_VAULT.getWithMetadata<{
          contentType?: string;
          filename?: string;
          sizeBytes?: number;
        }>(key, 'arrayBuffer');

        if (!value) {
          return errorResponse(`File with key "${key}" not found in FILE_VAULT KV.`, 404);
        }

        const fileBuffer = value as ArrayBuffer;
        const contentType = metadata?.contentType || guessContentType(key);
        const filename = metadata?.filename || key;
        const isDownload = url.searchParams.get('download') === 'true';

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.byteLength.toString(),
            'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(filename)}"`,
            'Cache-Control': 'public, max-age=3600',
            ...CORS_HEADERS,
          },
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to fetch file from KV: ${errorMsg}`, 500);
      }
    }

    // =========================================================================
    // Bonus: DELETE /files/:key - Delete file from KV
    // =========================================================================
    if (pathname.startsWith('/files/') && method === 'DELETE') {
      try {
        const rawKey = pathname.slice('/files/'.length);
        const key = decodeURIComponent(rawKey);

        if (!key) {
          return errorResponse('File key is required', 400);
        }

        await env.FILE_VAULT.delete(key);
        return jsonResponse({
          success: true,
          message: `File "${key}" deleted successfully from FILE_VAULT KV.`,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to delete file from KV: ${errorMsg}`, 500);
      }
    }

    // =========================================================================
    // Static Assets Fallback: Serve React SPA
    // =========================================================================
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Not Found', {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return 'text/html; charset=utf-8';
    case 'css':
      return 'text/css; charset=utf-8';
    case 'js':
      return 'application/javascript; charset=utf-8';
    case 'json':
      return 'application/json; charset=utf-8';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'zip':
      return 'application/zip';
    case 'tar':
      return 'application/x-tar';
    case 'gz':
      return 'application/gzip';
    case 'txt':
    case 'md':
      return 'text/plain; charset=utf-8';
    case 'mp3':
      return 'audio/mpeg';
    case 'mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}
