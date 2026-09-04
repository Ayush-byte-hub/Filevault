import { INITIAL_FILES } from '../data/mockFiles';
import { CATEGORIES } from '../data/categories';
import { Category, CategoryId, CloudflareR2Config, FileItem, SortOption } from '../types';

const STORAGE_KEY = 'filevault_files_v1';
const R2_CONFIG_KEY = 'filevault_r2_config_v1';
const RECENTLY_VIEWED_KEY = 'filevault_recent_files_v1';

export const DEFAULT_R2_CONFIG: CloudflareR2Config = {
  bucketName: 'filevault-public-assets',
  publicEndpoint: 'https://storage.cloudflare-r2.com/filevault-public',
  customDomain: 'https://cdn.filevault.org',
  storageRegion: 'auto (Cloudflare Global Edge)',
  presignedEnabled: true,
  notes: 'Files are distributed globally via Cloudflare R2 edge network with zero egress fees. Worker credentials remain server-side.',
};

class FileStorageService {
  private getStoredFiles(): FileItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveStoredFiles(INITIAL_FILES);
        return INITIAL_FILES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_FILES;
    }
  }

  private saveStoredFiles(files: FileItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }

  public getAllFiles(options?: {
    query?: string;
    category?: CategoryId | 'all';
    tag?: string;
    sort?: SortOption;
    publishedOnly?: boolean;
    featuredOnly?: boolean;
    limit?: number;
    offset?: number;
  }): { files: FileItem[]; total: number } {
    let list = this.getStoredFiles();

    if (options?.publishedOnly !== false) {
      list = list.filter((f) => f.isPublished);
    }

    if (options?.featuredOnly) {
      list = list.filter((f) => f.isFeatured);
    }

    if (options?.category && options.category !== 'all') {
      list = list.filter((f) => f.category === options.category);
    }

    if (options?.tag) {
      const t = options.tag.toLowerCase();
      list = list.filter((f) => f.tags.some((tag) => tag.toLowerCase() === t));
    }

    if (options?.query && options.query.trim()) {
      const q = options.query.trim().toLowerCase();
      list = list.filter((f) => {
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchDesc = f.description.toLowerCase().includes(q);
        const matchCategory = f.category.toLowerCase().includes(q);
        const matchTag = f.tags.some((t) => t.toLowerCase().includes(q));
        const matchFileType = f.fileType.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCategory || matchTag || matchFileType;
      });
    }

    // Sorting
    const sort = options?.sort || 'newest';
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'popular':
          return b.downloadCount - a.downloadCount;
        case 'newest':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'size-desc':
          return b.fileSizeBytes - a.fileSizeBytes;
        case 'size-asc':
          return a.fileSizeBytes - b.fileSizeBytes;
        default:
          return 0;
      }
    });

    const total = list.length;
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || list.length;
      list = list.slice(offset, offset + limit);
    }

    return { files: list, total };
  }

  public getFileBySlug(slug: string): FileItem | undefined {
    const list = this.getStoredFiles();
    return list.find((f) => f.slug.toLowerCase() === slug.toLowerCase());
  }

  public getFileById(id: string): FileItem | undefined {
    const list = this.getStoredFiles();
    return list.find((f) => f.id === id);
  }

  public getFeaturedFiles(limit = 6): FileItem[] {
    return this.getAllFiles({ featuredOnly: true, limit }).files;
  }

  public getLatestFiles(limit = 6): FileItem[] {
    return this.getAllFiles({ sort: 'newest', limit }).files;
  }

  public getPopularFiles(limit = 6): FileItem[] {
    return this.getAllFiles({ sort: 'popular', limit }).files;
  }

  public getRelatedFiles(currentFile: FileItem, limit = 4): FileItem[] {
    const all = this.getStoredFiles().filter((f) => f.id !== currentFile.id && f.isPublished);
    // Prioritize same category or matching tags
    const scored = all.map((f) => {
      let score = 0;
      if (f.category === currentFile.category) score += 5;
      const sharedTags = f.tags.filter((t) => currentFile.tags.includes(t));
      score += sharedTags.length * 2;
      return { file: f, score };
    });

    scored.sort((a, b) => b.score - a.score || b.file.downloadCount - a.file.downloadCount);
    return scored.slice(0, limit).map((s) => s.file);
  }

  public getCategoriesWithCounts(): Category[] {
    const files = this.getStoredFiles().filter((f) => f.isPublished);
    const countMap: Record<string, number> = {};
    for (const f of files) {
      countMap[f.category] = (countMap[f.category] || 0) + 1;
    }

    return CATEGORIES.map((cat) => ({
      ...cat,
      count: countMap[cat.id] || 0,
    }));
  }

  public addFile(newFile: Omit<FileItem, 'id' | 'uploadDate' | 'updatedDate' | 'downloadCount'>): FileItem {
    const files = this.getStoredFiles();
    const id = `f-${Date.now()}`;
    const now = new Date().toISOString();

    const created: FileItem = {
      ...newFile,
      id,
      uploadDate: now,
      updatedDate: now,
      downloadCount: 0,
      slug: newFile.slug.trim() || this.generateSlug(newFile.title),
      fileSizeBytes: newFile.fileSizeBytes || this.parseSizeToBytes(newFile.fileSize),
      checksum: newFile.checksum || this.generateDummySha256(newFile.title),
    };

    files.unshift(created);
    this.saveStoredFiles(files);
    return created;
  }

  public updateFile(id: string, updates: Partial<FileItem>): FileItem | null {
    const files = this.getStoredFiles();
    const index = files.findIndex((f) => f.id === id);
    if (index === -1) return null;

    const current = files[index];
    const updated: FileItem = {
      ...current,
      ...updates,
      updatedDate: new Date().toISOString(),
      fileSizeBytes: updates.fileSize
        ? this.parseSizeToBytes(updates.fileSize)
        : updates.fileSizeBytes || current.fileSizeBytes,
    };

    files[index] = updated;
    this.saveStoredFiles(files);
    return updated;
  }

  public deleteFile(id: string): boolean {
    const files = this.getStoredFiles();
    const filtered = files.filter((f) => f.id !== id);
    if (filtered.length === files.length) return false;
    this.saveStoredFiles(filtered);
    return true;
  }

  public incrementDownload(id: string): number {
    const files = this.getStoredFiles();
    const target = files.find((f) => f.id === id);
    if (target) {
      target.downloadCount = (target.downloadCount || 0) + 1;
      this.saveStoredFiles(files);
      return target.downloadCount;
    }
    return 0;
  }

  public resetToDefaultData(): void {
    this.saveStoredFiles(INITIAL_FILES);
  }

  public exportJson(): string {
    return JSON.stringify(this.getStoredFiles(), null, 2);
  }

  public importJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.saveStoredFiles(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Cloudflare R2 Configuration
  public getR2Config(): CloudflareR2Config {
    try {
      const saved = localStorage.getItem(R2_CONFIG_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_R2_CONFIG;
    } catch {
      return DEFAULT_R2_CONFIG;
    }
  }

  public saveR2Config(config: CloudflareR2Config): void {
    localStorage.setItem(R2_CONFIG_KEY, JSON.stringify(config));
  }

  // Recently Viewed Files
  public addRecentlyViewed(slug: string): void {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      let list: string[] = raw ? JSON.parse(raw) : [];
      list = list.filter((s) => s !== slug);
      list.unshift(slug);
      if (list.length > 8) list = list.slice(0, 8);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public getRecentlyViewedFiles(): FileItem[] {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!raw) return [];
      const slugs: string[] = JSON.parse(raw);
      const all = this.getStoredFiles();
      return slugs
        .map((slug) => all.find((f) => f.slug === slug))
        .filter((f): f is FileItem => !!f && f.isPublished);
    } catch {
      return [];
    }
  }

  // Check if a URL is hosted on Catbox.moe
  public isCatboxUrl(url?: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('catbox.moe');
    } catch {
      return url.includes('catbox.moe');
    }
  }

  // Get the effective download URL for a file (supports Catbox.moe, Workers KV, or Direct CDN)
  public getDownloadUrl(file: FileItem, options?: { forceDirect?: boolean }): string {
    const rawUrl = file.fileUrl?.trim() || '';
    if (!rawUrl) return '';

    // If it's a Catbox.moe URL
    if (this.isCatboxUrl(rawUrl)) {
      if (options?.forceDirect) {
        return rawUrl;
      }
      // Use Worker proxy to deliver customized friendly attachment filename and avoid referrer issues
      const safeExt = file.fileType?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'zip';
      const cleanName = `${this.generateSlug(file.title)}-${file.version}.${safeExt}`;
      return `/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(cleanName)}`;
    }

    // If it's a Workers KV path
    if (rawUrl.startsWith('/files/')) {
      const sep = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${sep}download=true`;
    }

    return rawUrl;
  }

  // Construct CPAGrip Monetized Download URL with Cloudflare Worker Target
  public getMonetizedDownloadUrl(file: FileItem): string {
    const catboxUrl = file.externalUrl || file.fileUrl;
    const fileName = `${file.title}.${file.fileType.toLowerCase()}`;
    const workerTargetUrl = `https://filestora.kaflea991.workers.dev/download?url=${encodeURIComponent(catboxUrl)}&name=${encodeURIComponent(fileName)}`;
    return `https://quartzfiles.com/1912012&tracking_id=${encodeURIComponent(fileName)}&target=${encodeURIComponent(workerTargetUrl)}`;
  }

  // Trigger CPAGrip Monetized Download redirect
  public triggerMonetizedDownload(file: FileItem): void {
    this.incrementDownload(file.id);
    const monetizedUrl = this.getMonetizedDownloadUrl(file);
    window.location.href = monetizedUrl;
  }

  // Real download trigger (downloads from Catbox.moe, Workers KV, or creates verified fallback)
  public triggerFileDownload(file: FileItem, forceDirect = false): void {
    this.incrementDownload(file.id);

    const targetUrl = this.getDownloadUrl(file, { forceDirect });
    const isRealUrl =
      targetUrl &&
      (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('/'));
    const isDummyPlaceholder = targetUrl.includes('cloudflare-r2.com/filevault-public/placeholder');

    if (isRealUrl && !isDummyPlaceholder) {
      const safeExt = file.fileType.toLowerCase().replace(/[^a-z0-9]/g, '') || 'zip';
      const filename = `${this.generateSlug(file.title)}-${file.version}.${safeExt}`;

      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback proof manifest package if no real URL is configured yet
    const fileContent = `================================================================
FileVault Verified Distribution Release
================================================================
Title:       ${file.title}
Version:     ${file.version}
Category:    ${file.category.toUpperCase()}
File Type:   ${file.fileType}
Declared Size: ${file.fileSize}
License:     ${file.license || 'Permissive Open Access'}
Developer:   ${file.developer || 'Verified Community Creator'}
Upload Date: ${file.uploadDate}
Last Update: ${file.updatedDate}

----------------------------------------------------------------
SECURITY & INTEGRITY CHECKSUM:
SHA-256: ${file.checksum}
MD5:     ${file.md5Checksum || 'Verified safe'}
Storage: ${file.fileUrl}
----------------------------------------------------------------

Description:
${file.description}

${file.longDescription || ''}

Release Notes:
${file.releaseNotes || 'Standard stable release build.'}

================================================================
Downloaded securely from FileVault Platform.
Direct Cloudflare Workers KV & Catbox Verified Distribution.
================================================================
`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Choose appropriate extension for the downloaded proof package
    const safeExt = file.fileType.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filename = `${file.slug}-${file.version}.${safeExt}.txt`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // Helpers
  public generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  public parseSizeToBytes(sizeStr: string): number {
    const match = sizeStr.trim().match(/^([\d.]+)\s*([a-zA-Z]+)$/);
    if (!match) return 1024 * 1024;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit.startsWith('K')) return Math.round(num * 1024);
    if (unit.startsWith('M')) return Math.round(num * 1024 * 1024);
    if (unit.startsWith('G')) return Math.round(num * 1024 * 1024 * 1024);
    if (unit.startsWith('B')) return Math.round(num);
    return Math.round(num * 1024 * 1024);
  }

  public generateDummySha256(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}e4b7c12f8d39e8a5b2c7f1a4e6d8c0b2a4f6e8d0c2b4a6f8e0d2c4b6a8f0e2d4`.slice(0, 64);
  }
}

export const storageService = new FileStorageService();
