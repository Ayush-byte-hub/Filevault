export type CategoryId =
  | 'games'
  | 'apps'
  | 'software'
  | 'documents'
  | 'videos'
  | 'music'
  | 'other';

export interface Category {
  id: CategoryId;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  count?: number;
}

export interface FileItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  category: CategoryId;
  fileType: string; // e.g. 'ZIP', 'EXE', 'DMG', 'APK', 'PDF', 'MP4', 'MP3'
  fileSize: string; // e.g. '48.2 MB'
  fileSizeBytes: number;
  version: string;
  uploadDate: string; // ISO string
  updatedDate: string; // ISO string
  downloadCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  thumbnailUrl: string;
  screenshots?: string[];
  fileUrl: string; // Storage URL (R2 bucket or CDN endpoint)
  checksum: string; // SHA-256
  md5Checksum?: string;
  tags: string[];
  compatibility?: string;
  license?: string;
  developer?: string;
  releaseNotes?: string;
  safetyVerified?: boolean;
}

export interface CloudflareR2Config {
  bucketName: string;
  publicEndpoint: string;
  customDomain: string;
  storageRegion: string;
  presignedEnabled: boolean;
  notes: string;
}

export type SortOption =
  | 'popular'
  | 'newest'
  | 'name-asc'
  | 'name-desc'
  | 'size-desc'
  | 'size-asc';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message?: string;
}
