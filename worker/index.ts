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
      pathname === '/download' ||
      pathname === '/api/download' ||
      pathname === '/api/health' ||
      pathname === '/api/catalog' ||
      pathname.startsWith('/api/catalog/') ||
      pathname === '/api/files' ||
      pathname.startsWith('/api/files/');

    if (
      isApiRoute &&
      pathname !== '/api/health' &&
      pathname !== '/download' &&
      pathname !== '/api/download' &&
      !env.FILE_VAULT
    ) {
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
        catboxSupported: true,
      });
    }

    // =========================================================================
    // Catalog Endpoints (Syncs global files across all user devices via KV)
    // =========================================================================
    const CATALOG_KEY = '__filestora_catalog_v1';

    // 1. GET /api/catalog or GET /api/files - Get complete list of files stored in Cloudflare KV
    if ((pathname === '/api/catalog' || pathname === '/api/files') && method === 'GET') {
      try {
        const catalog = (await env.FILE_VAULT.get(CATALOG_KEY, 'json')) as any[] | null;
        return jsonResponse({
          success: true,
          files: Array.isArray(catalog) ? catalog : [],
          count: Array.isArray(catalog) ? catalog.length : 0,
          initialized: Array.isArray(catalog) && catalog.length > 0,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to fetch catalog from KV: ${errorMsg}`, 500);
      }
    }

    // 2. POST /api/catalog or /api/catalog/sync - Overwrite/sync entire catalog in KV
    if ((pathname === '/api/catalog' || pathname === '/api/catalog/sync') && method === 'POST') {
      try {
        const body = (await request.json().catch(() => null)) as { files?: any[] } | null;
        if (!body || !Array.isArray(body.files)) {
          return errorResponse('Invalid payload. Expected JSON body { files: FileItem[] }', 400);
        }

        await env.FILE_VAULT.put(CATALOG_KEY, JSON.stringify(body.files));
        return jsonResponse({
          success: true,
          message: 'Catalog synchronized successfully to Cloudflare KV',
          count: body.files.length,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to save catalog to KV: ${errorMsg}`, 500);
      }
    }

    // 3. POST /api/catalog/file or /api/files/save - Add or update a single file in the KV catalog
    if ((pathname === '/api/catalog/file' || pathname === '/api/files/save') && (method === 'POST' || method === 'PUT')) {
      try {
        const body = (await request.json().catch(() => null)) as { file?: any } | any | null;
        const file = body?.file || body;
        if (!file || !file.id || !file.slug) {
          return errorResponse('Invalid file payload. Must contain at least "id" and "slug"', 400);
        }

        let catalog = (await env.FILE_VAULT.get(CATALOG_KEY, 'json')) as any[] | null;
        if (!Array.isArray(catalog)) {
          catalog = [];
        }

        const existingIndex = catalog.findIndex((f) => f.id === file.id || f.slug === file.slug);
        if (existingIndex >= 0) {
          catalog[existingIndex] = { ...catalog[existingIndex], ...file };
        } else {
          catalog.unshift(file);
        }

        await env.FILE_VAULT.put(CATALOG_KEY, JSON.stringify(catalog));
        return jsonResponse({
          success: true,
          message: 'File saved to Cloudflare KV catalog',
          file,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to save file to KV: ${errorMsg}`, 500);
      }
    }

    // 4. GET /api/catalog/:slug - Retrieve single file details by slug or id from KV
    if (pathname.startsWith('/api/catalog/') && method === 'GET') {
      try {
        const rawParam = pathname.slice('/api/catalog/'.length);
        const slug = decodeURIComponent(rawParam).trim();

        if (!slug || slug === 'sync' || slug === 'file') {
          return errorResponse('Valid slug or ID is required', 400);
        }

        const catalog = (await env.FILE_VAULT.get(CATALOG_KEY, 'json')) as any[] | null;
        if (Array.isArray(catalog)) {
          const file = catalog.find((f) => f.slug === slug || f.id === slug);
          if (file) {
            return jsonResponse({ success: true, file });
          }
        }

        return errorResponse(`File with slug or ID "${slug}" not found in catalog.`, 404);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to fetch file from KV: ${errorMsg}`, 500);
      }
    }

    // 5. DELETE /api/catalog/file/:id - Remove a file from the KV catalog
    if (pathname.startsWith('/api/catalog/file/') && method === 'DELETE') {
      try {
        const rawId = pathname.slice('/api/catalog/file/'.length);
        const id = decodeURIComponent(rawId).trim();

        let catalog = (await env.FILE_VAULT.get(CATALOG_KEY, 'json')) as any[] | null;
        if (Array.isArray(catalog)) {
          catalog = catalog.filter((f) => f.id !== id && f.slug !== id);
          await env.FILE_VAULT.put(CATALOG_KEY, JSON.stringify(catalog));
        }

        return jsonResponse({
          success: true,
          message: `File "${id}" removed from Cloudflare KV catalog`,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to delete file from KV catalog: ${errorMsg}`, 500);
      }
    }

    // 6. POST /api/catalog/download/:id - Increment download counter in KV
    if (pathname.startsWith('/api/catalog/download/') && method === 'POST') {
      try {
        const rawId = pathname.slice('/api/catalog/download/'.length);
        const id = decodeURIComponent(rawId).trim();

        let catalog = (await env.FILE_VAULT.get(CATALOG_KEY, 'json')) as any[] | null;
        if (Array.isArray(catalog)) {
          const target = catalog.find((f) => f.id === id || f.slug === id);
          if (target) {
            target.downloadCount = (target.downloadCount || 0) + 1;
            await env.FILE_VAULT.put(CATALOG_KEY, JSON.stringify(catalog));
            return jsonResponse({ success: true, downloadCount: target.downloadCount });
          }
        }
        return jsonResponse({ success: true, downloadCount: 0 });
      } catch {
        return jsonResponse({ success: false });
      }
    }

    // =========================================================================
    // Catbox.moe / External File Download Proxy: GET /download or /api/download
    // =========================================================================
    if ((pathname === '/download' || pathname === '/api/download') && method === 'GET') {
      try {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          return errorResponse('Missing "url" query parameter. Example: /download?url=https://files.catbox.moe/abc123.zip&name=my-app.zip', 400);
        }

        let parsedTarget: URL;
        try {
          parsedTarget = new URL(targetUrl);
        } catch {
          return errorResponse('Invalid URL provided.', 400);
        }

        if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
          return errorResponse('Only HTTP and HTTPS URLs are supported.', 400);
        }

        const isDirectRedirect = url.searchParams.get('redirect') === 'true';
        if (isDirectRedirect) {
          return Response.redirect(parsedTarget.toString(), 302);
        }

        // Determine friendly download filename
        const customName = url.searchParams.get('name') || url.searchParams.get('filename');
        const urlFilename = parsedTarget.pathname.split('/').filter(Boolean).pop() || 'download';
        const finalFilename = customName ? customName.trim() : urlFilename;

        // Fetch the file from external host (e.g. files.catbox.moe)
        const fetchHeaders: Record<string, string> = {
          'User-Agent': 'Filestora-Worker/1.0',
          'Accept': '*/*',
        };

        if (parsedTarget.hostname.includes('catbox.moe')) {
          fetchHeaders['Referer'] = 'https://catbox.moe/';
        }

        // Forward Range header if browser requested resume/chunked download
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) {
          fetchHeaders['Range'] = rangeHeader;
        }

        const externalResponse = await fetch(parsedTarget.toString(), {
          headers: fetchHeaders,
          redirect: 'follow',
        });

        if (!externalResponse.ok && externalResponse.status !== 206) {
          // If proxy fetch failed, fallback to 302 redirect so user still gets file
          return Response.redirect(parsedTarget.toString(), 302);
        }

        const contentType = externalResponse.headers.get('content-type') || guessContentType(finalFilename);
        const contentLength = externalResponse.headers.get('content-length');
        const contentRange = externalResponse.headers.get('content-range');
        const dispositionMode = url.searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment';

        const responseHeaders: Record<string, string> = {
          'Content-Type': contentType,
          'Content-Disposition': `${dispositionMode}; filename="${encodeURIComponent(finalFilename)}"`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
          ...CORS_HEADERS,
        };

        if (contentLength) {
          responseHeaders['Content-Length'] = contentLength;
        }
        if (contentRange) {
          responseHeaders['Content-Range'] = contentRange;
        }

        return new Response(externalResponse.body, {
          status: externalResponse.status,
          headers: responseHeaders,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return errorResponse(`Failed to download external file: ${errorMsg}`, 500);
      }
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
        let externalUrl = url.searchParams.get('externalUrl') || url.searchParams.get('catboxUrl') || '';
        let customSizeBytes = 0;

        const isMultipart = contentType.includes('multipart/form-data');
        const isJson = contentType.includes('application/json');

        if (isMultipart) {
          const formData = await request.formData();
          const fileEntry = formData.get('file');
          const customKey = formData.get('key');
          const formExternal = formData.get('externalUrl') || formData.get('catboxUrl');

          if (typeof formExternal === 'string' && formExternal.trim()) {
            externalUrl = formExternal.trim();
          }

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
          if (typeof bodyJson.externalUrl === 'string') {
            externalUrl = bodyJson.externalUrl;
          } else if (typeof bodyJson.catboxUrl === 'string') {
            externalUrl = bodyJson.catboxUrl;
          }
          if (typeof bodyJson.sizeBytes === 'number') {
            customSizeBytes = bodyJson.sizeBytes;
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
          if (externalUrl) {
            const extPath = new URL(externalUrl).pathname.split('/').pop() || 'file';
            key = extPath;
          } else {
            const ext = contentType.includes('/') ? contentType.split('/')[1] : 'bin';
            key = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
          }
        }

        // Handle External URL (e.g. Catbox.moe) reference registration
        if (externalUrl) {
          const metadata = {
            contentType: contentType !== 'application/octet-stream' ? contentType : guessContentType(key),
            sizeBytes: customSizeBytes || 0,
            filename: originalFilename || key,
            uploadedAt: new Date().toISOString(),
            isExternal: true,
            externalUrl,
            source: externalUrl.includes('catbox.moe') ? 'catbox' : 'external',
          };

          // Store JSON pointer in KV
          const pointerData = JSON.stringify({ isExternal: true, url: externalUrl, filename: metadata.filename });
          await env.FILE_VAULT.put(key, pointerData, { metadata });

          const origin = url.origin;
          return jsonResponse(
            {
              success: true,
              message: 'External file link (Catbox.moe) registered successfully in KV',
              file: {
                key,
                sizeBytes: metadata.sizeBytes,
                contentType: metadata.contentType,
                filename: metadata.filename,
                uploadedAt: metadata.uploadedAt,
                downloadUrl: `${origin}/files/${encodeURIComponent(key)}`,
                externalUrl,
                source: metadata.source,
              },
            },
            201
          );
        }

        // Validate Data
        if (!fileData || fileData.byteLength === 0) {
          return errorResponse(
            'No file data or external URL provided. Send file as multipart/form-data, JSON { key, data }, raw body, or provide externalUrl (e.g. Catbox.moe).',
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
          isExternal?: boolean;
          externalUrl?: string;
        }>(key, 'arrayBuffer');

        if (!value) {
          return errorResponse(`File with key "${key}" not found in FILE_VAULT KV.`, 404);
        }

        const isDownload = url.searchParams.get('download') === 'true';

        // Check if this key points to an external file (e.g. Catbox.moe)
        if (metadata?.isExternal && metadata.externalUrl) {
          const extUrl = metadata.externalUrl;
          const filename = metadata.filename || key;

          const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Filestora-Worker/1.0',
            'Accept': '*/*',
          };
          if (extUrl.includes('catbox.moe')) {
            fetchHeaders['Referer'] = 'https://catbox.moe/';
          }
          const rangeHeader = request.headers.get('range');
          if (rangeHeader) {
            fetchHeaders['Range'] = rangeHeader;
          }

          const extResponse = await fetch(extUrl, {
            headers: fetchHeaders,
            redirect: 'follow',
          });

          if (!extResponse.ok && extResponse.status !== 206) {
            return Response.redirect(extUrl, 302);
          }

          const contentType = extResponse.headers.get('content-type') || metadata.contentType || guessContentType(filename);
          const contentLength = extResponse.headers.get('content-length');
          const contentRange = extResponse.headers.get('content-range');

          const respHeaders: Record<string, string> = {
            'Content-Type': contentType,
            'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(filename)}"`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400',
            ...CORS_HEADERS,
          };
          if (contentLength) respHeaders['Content-Length'] = contentLength;
          if (contentRange) respHeaders['Content-Range'] = contentRange;

          return new Response(extResponse.body, {
            status: extResponse.status,
            headers: respHeaders,
          });
        }

        const fileBuffer = value as ArrayBuffer;
        const contentType = metadata?.contentType || guessContentType(key);
        const filename = metadata?.filename || key;

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
