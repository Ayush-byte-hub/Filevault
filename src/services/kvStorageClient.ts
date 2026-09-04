/**
 * Client-side SDK for interacting with Filestora Cloudflare Worker KV endpoints.
 * Calls /upload, /files, and /files/:key with full CORS support.
 */

export interface KVUploadedFile {
  key: string;
  sizeBytes: number;
  contentType: string;
  filename: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface KVFileItem {
  key: string;
  expiration?: number;
  metadata?: {
    contentType?: string;
    sizeBytes?: number;
    filename?: string;
    uploadedAt?: string;
  } | null;
  url: string;
}

export interface KVListResponse {
  success: boolean;
  count: number;
  files: KVFileItem[];
  list_complete: boolean;
  cursor: string | null;
}

export class KVStorageClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    // If empty string, uses current origin (ideal when worker serves frontend)
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * 1. Upload a file to Cloudflare Workers KV via POST /upload
   */
  public async uploadFile(file: File, customKey?: string): Promise<KVUploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (customKey) {
      formData.append('key', customKey);
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorJson.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.file;
  }

  /**
   * 2. Upload raw data (text, JSON, or Buffer) to KV via POST /upload
   */
  public async uploadRaw(key: string, data: string | ArrayBuffer, contentType = 'application/octet-stream'): Promise<KVUploadedFile> {
    const url = `${this.baseUrl}/upload?key=${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-Filename': key,
      },
      body: data,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorJson.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.file;
  }

  /**
   * 3. Get the direct fetch/download URL for a file via GET /files/:key
   */
  public getFileUrl(key: string, download = false): string {
    const query = download ? '?download=true' : '';
    return `${this.baseUrl}/files/${encodeURIComponent(key)}${query}`;
  }

  /**
   * Fetch the file blob directly from GET /files/:key
   */
  public async getFileBlob(key: string): Promise<Blob> {
    const response = await fetch(this.getFileUrl(key));
    if (!response.ok) {
      throw new Error(`Failed to fetch file "${key}" (Status ${response.status})`);
    }
    return await response.blob();
  }

  /**
   * 4. List keys stored in FILE_VAULT KV via GET /files
   */
  public async listFiles(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResponse> {
    const params = new URLSearchParams();
    if (options?.prefix) params.set('prefix', options.prefix);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.cursor) params.set('cursor', options.cursor);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${this.baseUrl}/files${qs}`);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ error: 'Failed to list files' }));
      throw new Error(errorJson.error || `Failed to list files with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Check if a given URL is from Catbox.moe
   */
  public isCatboxUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('catbox.moe');
    } catch {
      return url.includes('catbox.moe');
    }
  }

  /**
   * Generate an edge proxied download URL for Catbox or external file
   */
  public getProxiedDownloadUrl(targetUrl: string, friendlyFilename?: string, forceDirect = false): string {
    if (forceDirect) return targetUrl;
    const params = new URLSearchParams({ url: targetUrl });
    if (friendlyFilename) {
      params.set('name', friendlyFilename);
    }
    return `${this.baseUrl}/download?${params.toString()}`;
  }

  /**
   * Register an external URL (such as Catbox.moe) in Workers KV as a pointer
   */
  public async registerExternalFile(
    key: string,
    externalUrl: string,
    options?: { filename?: string; contentType?: string; sizeBytes?: number }
  ): Promise<KVUploadedFile> {
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        externalUrl,
        filename: options?.filename || key,
        contentType: options?.contentType || 'application/octet-stream',
        sizeBytes: options?.sizeBytes || 0,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(errorJson.error || `Failed to register external file (Status ${response.status})`);
    }

    const result = await response.json();
    return result.file;
  }

  /**
   * Delete a file from KV via DELETE /files/:key
   */
  public async deleteFile(key: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/files/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    return response.ok;
  }
}

export const kvClient = new KVStorageClient();
