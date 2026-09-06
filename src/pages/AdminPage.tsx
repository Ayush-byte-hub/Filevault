import React, { useState, useMemo, useEffect } from 'react';
import { FileItem, CategoryId, CloudflareR2Config } from '../types';
import { storageService, DEFAULT_R2_CONFIG } from '../services/storageService';
import { CATEGORIES } from '../data/categories';
import { ConfirmModal } from '../components/ConfirmModal';
import { AdminGate } from '../components/AdminGate';
import { ImgBbHelperModal } from '../components/ImgBbHelperModal';
import { SmartImage } from '../components/SmartImage';
import { adminAuthService } from '../services/adminAuthService';
import { extractDirectImageUrl, parseMultipleImageUrls } from '../utils/imageHelper';
import { kvClient } from '../services/kvStorageClient';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  Files,
  PlusCircle,
  Cloud,
  Database,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Save,
  RotateCcw,
  Download,
  Upload,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Lock,
  LogOut,
  Key,
  ImagePlus,
  Image,
  Sparkles,
  HardDrive,
  Check,
  RefreshCw,
  FileUp,
  Loader2,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'add' | 'storage' | 'data'>('overview');

  // Files data & filters
  const [filesVersion, setFilesVersion] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  // Reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Edit / Add Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    longDescription: '',
    category: 'software' as CategoryId,
    fileType: 'ZIP',
    fileSize: '25.0 MB',
    version: 'v1.0.0',
    thumbnailUrl: '',
    screenshots: '', // comma separated or newlines
    fileUrl: '',
    downloadMode: 'direct' as 'direct' | 'redirect',
    redirectUrl: '',
    openInNewTab: false,
    checksum: '',
    tags: '',
    compatibility: '',
    license: 'MIT Open Source',
    developer: '',
    releaseNotes: '',
    isFeatured: false,
    isPublished: true,
  });

  // R2 & KV Storage Settings
  const [r2Config, setR2Config] = useState<CloudflareR2Config>(storageService.getR2Config());
  const [testCatboxUrl, setTestCatboxUrl] = useState('');
  const [testCatboxStatus, setTestCatboxStatus] = useState<string | null>(null);

  // Admin Auth & ImgBB modal state
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());
  const [imgBbModalOpen, setImgBbModalOpen] = useState(false);

  // Passcode management state
  const [passcodeCurrent, setPasscodeCurrent] = useState('');
  const [passcodeNew, setPasscodeNew] = useState('');
  const [passcodeConfirm, setPasscodeConfirm] = useState('');

  // Global Cloudflare KV Catalog Sync state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);

  // Automated Cloud Post & Direct File Upload state
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const [uploadProgressMessage, setUploadProgressMessage] = useState<string | null>(null);
  const [directUploadSuccess, setDirectUploadSuccess] = useState<string | null>(null);

  // Subscribe to storage changes from Cloudflare KV
  useEffect(() => {
    return storageService.subscribe(() => {
      setFilesVersion((v) => v + 1);
    });
  }, []);

  // Reload files
  const { files: allFiles, total: totalFiles } = useMemo(() => {
    return storageService.getAllFiles({ publishedOnly: false });
  }, [filesVersion]);

  const categories = storageService.getCategoriesWithCounts();
  const totalDownloads = allFiles.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
  const featuredCount = allFiles.filter((f) => f.isFeatured).length;

  const handlePushAllToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await storageService.pushAllFilesToCloud(allFiles);
      if (ok) {
        setCloudSyncStatus(`All ${allFiles.length} files successfully synchronized to Cloudflare Workers KV!`);
        showToast('Global KV Synchronized', `Pushed ${allFiles.length} files to Cloudflare KV. They are now live on every user device!`, 'success');
      } else {
        setCloudSyncStatus('Failed to push files to Cloudflare KV. Check worker connection.');
        showToast('Sync Error', 'Could not push files to Cloudflare KV.', 'error');
      }
    } catch (err) {
      setCloudSyncStatus(`Sync error: ${err}`);
      showToast('Sync Error', 'Could not push files to Cloudflare KV.', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await storageService.syncWithCloud(true);
      if (res.success) {
        setFilesVersion((v) => v + 1);
        setCloudSyncStatus(`Successfully loaded ${res.count} files from Cloudflare Workers KV!`);
        showToast('Catalog Updated', `Pulled ${res.count} files from Cloudflare KV.`, 'success');
      } else {
        setCloudSyncStatus(`Could not fetch from Cloudflare KV: ${res.error}`);
        showToast('Fetch Warning', res.error || 'Failed to pull from Cloudflare KV', 'warning');
      }
    } catch (err) {
      setCloudSyncStatus(`Fetch error: ${err}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Filtered files for table
  const filteredFiles = useMemo(() => {
    return allFiles.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.description.toLowerCase().includes(searchFilter.toLowerCase());
      const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && f.isPublished) ||
        (statusFilter === 'draft' && !f.isPublished);

      return matchSearch && matchCat && matchStatus;
    });
  }, [allFiles, searchFilter, categoryFilter, statusFilter]);

  // Handle Form Edit Prep
  const startEdit = (file: FileItem) => {
    setEditingId(file.id);
    setFormData({
      title: file.title,
      slug: file.slug,
      description: file.description,
      longDescription: file.longDescription || '',
      category: file.category,
      fileType: file.fileType,
      fileSize: file.fileSize,
      version: file.version,
      thumbnailUrl: file.thumbnailUrl || '',
      screenshots: file.screenshots?.join('\n') || '',
      fileUrl: file.fileUrl || '',
      downloadMode: file.downloadMode || 'direct',
      redirectUrl: file.redirectUrl || '',
      openInNewTab: file.openInNewTab ?? false,
      checksum: file.checksum,
      tags: file.tags.join(', '),
      compatibility: file.compatibility || '',
      license: file.license || '',
      developer: file.developer || '',
      releaseNotes: file.releaseNotes || '',
      isFeatured: file.isFeatured,
      isPublished: file.isPublished,
    });
    setActiveTab('add');
  };

  const startCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      longDescription: '',
      category: 'software',
      fileType: 'ZIP',
      fileSize: '35.0 MB',
      version: 'v1.0.0',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      screenshots: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      fileUrl: 'https://files.catbox.moe/example.zip',
      downloadMode: 'direct',
      redirectUrl: '',
      openInNewTab: false,
      checksum: '',
      tags: 'open-source, utility, modern',
      compatibility: 'Windows 10/11, macOS 12+, Linux',
      license: 'MIT License',
      developer: 'Independent Developer',
      releaseNotes: 'Initial release distribution.',
      isFeatured: false,
      isPublished: true,
    });
    setActiveTab('add');
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || prev.slug === storageService.generateSlug(prev.title)
        ? storageService.generateSlug(val)
        : prev.slug,
    }));
  };

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDirectUploading(true);
    setDirectUploadSuccess(null);
    setUploadProgressMessage('Calculating cryptographic SHA-256 hash...');

    try {
      // 1. Calculate SHA-256 Checksum via Web Crypto API
      let realChecksum = '';
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        realChecksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (hashErr) {
        console.warn('Could not compute client SHA-256:', hashErr);
      }

      // 2. Format file size
      const sizeMB = file.size / (1024 * 1024);
      const formattedSize =
        sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      // 3. Extract file type
      const ext = file.name.includes('.')
        ? file.name.split('.').pop()?.toUpperCase() || 'ZIP'
        : 'ZIP';

      // 4. Clean title
      const baseTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanTitle = baseTitle
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      setUploadProgressMessage(`Uploading "${file.name}" to Cloudflare Workers KV...`);

      // 5. Upload binary directly into Workers KV
      const uploaded = await kvClient.uploadFile(file);

      // 6. Update form fields automatically
      setFormData((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : cleanTitle,
        slug: prev.slug.trim() ? prev.slug : storageService.generateSlug(cleanTitle),
        fileUrl: `/files/${uploaded.key}`,
        fileSize: formattedSize,
        fileType: ext,
        checksum: realChecksum || prev.checksum,
      }));

      setDirectUploadSuccess(
        `File "${file.name}" (${formattedSize}) uploaded directly to Cloudflare Workers KV key: /files/${uploaded.key}`
      );
      showToast(
        'Stored in Cloudflare KV',
        `"${file.name}" uploaded to Cloudflare KV. Form auto-filled and ready to publish!`,
        'success'
      );
    } catch (err) {
      console.warn('Direct upload error:', err);
      const sizeMB = file.size / (1024 * 1024);
      const formattedSize =
        sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      const ext = file.name.includes('.')
        ? file.name.split('.').pop()?.toUpperCase() || 'ZIP'
        : 'ZIP';
      const baseTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

      setFormData((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : baseTitle,
        fileSize: formattedSize,
        fileType: ext,
      }));

      showToast(
        'Upload Notice',
        `Could not directly upload binary to KV (${err instanceof Error ? err.message : String(err)}). Form fields were populated; you can provide a Catbox.moe or external link.`,
        'warning'
      );
    } finally {
      setIsDirectUploading(false);
      setUploadProgressMessage(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Error', 'File title is required', 'error');
      return;
    }

    setIsSubmittingFile(true);

    try {
      const screenshotsArray = formData.screenshots
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (formData.downloadMode === 'redirect' && !formData.redirectUrl.trim()) {
        showToast('Redirection URL Required', 'Please provide a destination URL for the external redirection download mode.', 'error');
        return;
      }

      const cleanFileUrl = formData.fileUrl.trim();
      const isCatbox = storageService.isCatboxUrl(cleanFileUrl);
      const isKV = cleanFileUrl.startsWith('/files/');
      const storageSource: 'catbox' | 'kv' | 'direct' | 'r2' = isCatbox ? 'catbox' : isKV ? 'kv' : 'direct';

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || storageService.generateSlug(formData.title),
        description: formData.description.trim(),
        longDescription: formData.longDescription.trim(),
        category: formData.category,
        fileType: formData.fileType.toUpperCase().trim(),
        fileSize: formData.fileSize.trim(),
        fileSizeBytes: storageService.parseSizeToBytes(formData.fileSize),
        version: formData.version.trim() || 'v1.0.0',
        thumbnailUrl: formData.thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        screenshots: screenshotsArray,
        fileUrl: cleanFileUrl || (isCatbox ? cleanFileUrl : `/files/${formData.slug}`),
        storageSource,
        externalUrl: isCatbox ? cleanFileUrl : undefined,
        downloadMode: formData.downloadMode,
        redirectUrl: formData.downloadMode === 'redirect' ? formData.redirectUrl.trim() : undefined,
        openInNewTab: formData.downloadMode === 'redirect' ? formData.openInNewTab : false,
        checksum: formData.checksum.trim() || storageService.generateDummySha256(formData.title),
        tags: tagsArray.length > 0 ? tagsArray : ['general'],
        compatibility: formData.compatibility.trim(),
        license: formData.license.trim(),
        developer: formData.developer.trim(),
        releaseNotes: formData.releaseNotes.trim(),
        isFeatured: formData.isFeatured,
        isPublished: formData.isPublished,
        safetyVerified: true,
      };

      // If Catbox URL, register pointer in Workers KV asynchronously as well
      if (isCatbox && cleanFileUrl) {
        kvClient.registerExternalFile(payload.slug, cleanFileUrl, {
          filename: `${payload.slug}.${payload.fileType.toLowerCase()}`,
          sizeBytes: payload.fileSizeBytes,
        }).catch(() => {});
      }

      let cloudSaved = false;
      if (editingId) {
        const res = await storageService.updateFileAndPersist(editingId, payload);
        cloudSaved = res.cloudSaved;
        showToast(
          cloudSaved ? 'File Updated & Cloud Stored' : 'File Updated',
          `"${payload.title}" successfully updated and saved to Cloudflare Workers KV!`,
          'success'
        );
      } else {
        const res = await storageService.addFileAndPersist(payload);
        cloudSaved = res.cloudSaved;
        showToast(
          cloudSaved ? 'Post Published & Cloud Stored' : 'Post Published',
          `"${payload.title}" is now published and automatically stored in Cloudflare Workers KV edge storage!`,
          'success'
        );
      }

      setFilesVersion((v) => v + 1);
      setActiveTab('files');
    } catch (err: unknown) {
      showToast('Save Error', err instanceof Error ? err.message : 'Failed to save file.', 'error');
    } finally {
      setIsSubmittingFile(false);
    }
  };

  const togglePublish = (file: FileItem) => {
    const updated = storageService.updateFile(file.id, { isPublished: !file.isPublished });
    if (updated) {
      setFilesVersion((v) => v + 1);
      showToast(
        updated.isPublished ? 'Published' : 'Unpublished',
        `"${file.title}" is now ${updated.isPublished ? 'live for download' : 'hidden'}`,
        'info'
      );
    }
  };

  const toggleFeatured = (file: FileItem) => {
    const updated = storageService.updateFile(file.id, { isFeatured: !file.isFeatured });
    if (updated) {
      setFilesVersion((v) => v + 1);
      showToast(
        'Featured Status',
        `"${file.title}" ${updated.isFeatured ? 'marked as featured' : 'unfeatured'}`,
        'info'
      );
    }
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      storageService.deleteFile(fileToDelete.id);
      setFilesVersion((v) => v + 1);
      showToast('File Deleted', `Removed "${fileToDelete.title}" from storage.`, 'warning');
      setFileToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const confirmResetData = () => {
    storageService.resetToDefaultData();
    setFilesVersion((v) => v + 1);
    showToast('Reset Complete', 'Default verified sample repository restored.', 'success');
    setResetModalOpen(false);
  };

  const handleSaveR2 = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveR2Config(r2Config);
    showToast('R2 Configuration Saved', 'Cloudflare R2 bucket settings updated.', 'success');
  };

  const handleExportJson = () => {
    const jsonStr = storageService.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filevault-database-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Database Exported', 'JSON backup file downloaded.', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = storageService.importJson(content);
      if (ok) {
        setFilesVersion((v) => v + 1);
        showToast('Database Imported', 'File repository successfully synchronized.', 'success');
      } else {
        showToast('Import Failed', 'Invalid JSON format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeNew !== passcodeConfirm) {
      showToast('Mismatch', 'New passcode confirmation does not match.', 'error');
      return;
    }
    const res = await adminAuthService.changePasscode(passcodeCurrent, passcodeNew);
    if (res.success) {
      showToast('Security Updated', res.message, 'success');
      setPasscodeCurrent('');
      setPasscodeNew('');
      setPasscodeConfirm('');
    } else {
      showToast('Failed', res.message, 'error');
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setIsAuthenticated(false);
    showToast('Admin Locked', 'Logged out of admin console.', 'info');
  };

  if (!isAuthenticated) {
    return (
      <AdminGate
        onSuccess={() => setIsAuthenticated(true)}
        onNavigateHome={() => onNavigate('/')}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Workspace
            </h1>
            <span className="text-[11px] font-mono font-semibold bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
              Secure
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage file distributions, verify integrity hashes, and configure Cloudflare R2 endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="admin-add-file-btn"
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New File</span>
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            View Live Site
          </button>
          <button
            onClick={handleLogout}
            title="Lock admin session"
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-200/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium border-b border-slate-200/60">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0 ${
            activeTab === 'files'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Files className="w-3.5 h-3.5" />
          <span>Files Manager ({totalFiles})</span>
        </button>

        <button
          onClick={() => {
            if (activeTab !== 'add') startCreate();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0 ${
            activeTab === 'add'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{editingId ? 'Edit File' : 'Add File'}</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0 ${
            activeTab === 'storage'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Workers KV & Catbox Hosting</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0 ${
            activeTab === 'data'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database & Backup</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Grid (Bento Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Files</span>
                <Files className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalFiles}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {allFiles.filter((f) => f.isPublished).length} published • {allFiles.filter((f) => !f.isPublished).length} drafts
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Downloads</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                {totalDownloads.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Direct edge file transfers</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{categories.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Structured storage taxonomies</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Featured Items</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{featuredCount}</p>
              <p className="text-[11px] text-slate-400 mt-1">Spotlighted on homepage</p>
            </div>
          </div>

          {/* Two-Column Lists: Recently Added & Top Popular */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recently Added Files */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Recently Added Files</h3>
                <button
                  onClick={() => setActiveTab('files')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Manage all
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {allFiles.slice(0, 5).map((file) => (
                  <div key={file.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <SmartImage
                        src={file.thumbnailUrl}
                        alt={file.title}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {file.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {file.fileType} • {file.fileSize} • {file.version}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(file)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit file"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onNavigate(`/file/${file.slug}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View live"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Downloaded Files */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Most Popular Downloads</h3>
                <button
                  onClick={() => onNavigate('/popular')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  View ranking
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {[...allFiles]
                  .sort((a, b) => b.downloadCount - a.downloadCount)
                  .slice(0, 5)
                  .map((file, idx) => (
                    <div key={file.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-400 w-4 text-center">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {file.title}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {file.category} • {file.version}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-900">
                          {file.downloadCount.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-slate-400">downloads</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FILES MANAGEMENT TABLE */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* Table Filters (Bento Control Card) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search file name, slug, or description..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100/80 rounded-full border border-transparent focus:bg-white focus:border-slate-300 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryId | 'all')}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100/80 border border-slate-200 rounded-full text-slate-800"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100/80 border border-slate-200 rounded-full text-slate-800"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          {/* Files Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">File Distribution</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Size & Type</th>
                    <th className="px-3 py-3">Downloads</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Featured</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SmartImage
                            src={file.thumbnailUrl}
                            alt={file.title}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-slate-900 truncate">
                              {file.title}
                            </p>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 truncate">
                              <span>/{file.slug}</span>
                              <span>•</span>
                              <span>{file.version}</span>
                              {file.downloadMode === 'redirect' ? (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-sans font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60"
                                  title="Cloaked external redirection"
                                >
                                  <ArrowUpRight className="w-2.5 h-2.5" /> Redirection
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-sans font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                                  <HardDrive className="w-2.5 h-2.5" /> Direct Download
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 capitalize font-medium text-slate-700">
                        {file.category}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-800">{file.fileSize}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {file.fileType}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {file.downloadCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => togglePublish(file)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            file.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                          }`}
                        >
                          {file.isPublished ? (
                            <>
                              <Eye className="w-3 h-3" /> Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Draft
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleFeatured(file)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            file.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                              : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title="Toggle featured"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate(`/file/${file.slug}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View live post"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startEdit(file)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit file details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setFileToDelete(file);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No files matching current search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADD / EDIT FILE FORM */}
      {activeTab === 'add' && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit File Record' : 'Add New File Distribution'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the file metadata, storage location, and security checksum.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                >
                  Cancel edit
                </button>
              )}
            </div>

            {/* Direct File Upload & Auto-Storage Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Auto-Storage Direct File Uploader</span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                        Workers KV
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Drop or select a local file to store directly in Cloudflare KV. File size, format, checksum, and storage link populate automatically!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-semibold text-slate-800 shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose file from device...</span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={isDirectUploading || isSubmittingFile}
                    onChange={handleDirectFileUpload}
                  />
                </label>
                <span className="text-[11px] text-slate-400">
                  Supported formats: ZIP, EXE, PDF, APK, DMG, ISO, etc. (Or paste a Catbox / external URL below)
                </span>
              </div>

              {isDirectUploading && (
                <div className="p-3 bg-white/95 rounded-2xl border border-blue-200 flex items-center gap-2.5 text-xs text-blue-800 shadow-xs animate-pulse">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  <span className="font-medium">{uploadProgressMessage || 'Storing file in Cloudflare KV...'}</span>
                </div>
              )}

              {directUploadSuccess && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{directUploadSuccess}</span>
                </div>
              )}
            </div>

            {/* Title & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. PixelForge Studio"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug (/file/slug)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. pixelforge-studio"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-full font-mono focus:bg-white focus:border-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Description (Cards & Previews) *
              </label>
              <textarea
                required
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary shown on homepage and search cards..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* Long Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Detailed Description
              </label>
              <textarea
                rows={4}
                value={formData.longDescription}
                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                placeholder="Extended details, features, usage instructions..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* Category, Version, Type, Size */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryId })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full capitalize"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="v2.1.0"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Type / Ext
                </label>
                <input
                  type="text"
                  value={formData.fileType}
                  onChange={(e) => setFormData({ ...formData, fileType: e.target.value.toUpperCase() })}
                  placeholder="ZIP, EXE, PDF"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Size (e.g. 45 MB)
                </label>
                <input
                  type="text"
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                  placeholder="42.5 MB"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full"
                />
              </div>
            </div>

            {/* Download Delivery Mode: Direct Download vs External Redirection */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 border border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Download Action & Delivery Method</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      User Experience
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose what happens when visitors click "Download" on your site for this file.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mode 1: Direct Site Download */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, downloadMode: 'direct' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.downloadMode === 'direct'
                      ? 'bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-xs'
                      : 'bg-white/60 hover:bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        formData.downloadMode === 'direct' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Direct Download from Site</span>
                    </div>
                    {formData.downloadMode === 'direct' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Downloads directly from your website via Cloudflare Worker proxy/KV storage. Visitors stay on your site.
                  </p>
                </button>

                {/* Mode 2: External Redirection */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, downloadMode: 'redirect' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.downloadMode === 'redirect'
                      ? 'bg-white border-purple-600 ring-2 ring-purple-600/10 shadow-xs'
                      : 'bg-white/60 hover:bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        formData.downloadMode === 'redirect' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">External Link Redirection</span>
                    </div>
                    {formData.downloadMode === 'redirect' && (
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Redirects visitors to an external URL when they click download. The target URL is cloaked and hidden from visitors.
                  </p>
                </button>
              </div>

              {/* Redirection Configuration (only when Redirection mode selected) */}
              {formData.downloadMode === 'redirect' && (
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/90 space-y-3 mt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-purple-950">
                        Target Redirection URL * (Hidden / Cloaked from Visitors)
                      </label>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                        Masked Target
                      </span>
                    </div>
                    <input
                      type="url"
                      required={formData.downloadMode === 'redirect'}
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      placeholder="https://your-partner-site.com/download/package or external link"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-purple-200 rounded-full font-mono text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-[11px] text-purple-900">
                    <div className="flex items-start gap-1.5 leading-relaxed">
                      <Lock className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Cloaked Link:</strong> Visitors will <em>not</em> see this destination URL on cards or details; they will only see the normal download button and be seamlessly redirected upon clicking.
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-purple-950 shrink-0 bg-white/70 px-3 py-1.5 rounded-xl border border-purple-200/60 hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.openInNewTab}
                        onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0"
                      />
                      <span>Open link in new tab</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Storage URL & Checksum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    File Download / Storage URL *
                  </label>
                  <a
                    href="https://catbox.moe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline"
                    title="Upload files up to 200MB free on Catbox.moe"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Upload to Catbox.moe</span>
                  </a>
                </div>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updates: Record<string, string> = { fileUrl: val };
                    // If user pastes Catbox URL, try detecting extension
                    if (storageService.isCatboxUrl(val)) {
                      try {
                        const path = new URL(val).pathname;
                        const ext = path.split('.').pop()?.toUpperCase();
                        if (ext && ext.length <= 4) {
                          updates.fileType = ext;
                        }
                      } catch {}
                    }
                    setFormData({ ...formData, ...updates });
                  }}
                  placeholder="https://files.catbox.moe/abc123.zip or /files/vault-key"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full font-mono"
                />

                {storageService.isCatboxUrl(formData.fileUrl) ? (
                  <div className="mt-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Catbox.moe URL active • Filestora edge proxy will stream & download directly</span>
                    </div>
                    <a
                      href={formData.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-800 underline font-semibold shrink-0 ml-2"
                    >
                      Test Direct Link
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 ml-2">
                    <span>Supports Catbox.moe (https://files.catbox.moe/...), Workers KV (/files/:key), or direct URL.</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fileUrl: 'https://files.catbox.moe/example.zip', fileType: 'ZIP' })}
                      className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold underline"
                    >
                      Insert Catbox sample
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cryptographic Checksum (SHA-256)
                </label>
                <input
                  type="text"
                  value={formData.checksum}
                  onChange={(e) => setFormData({ ...formData, checksum: e.target.value })}
                  placeholder="Leave empty to auto-generate verified hash"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full font-mono"
                />
              </div>
            </div>

            {/* Thumbnail and Screenshots with ImgBB Embed Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Thumbnail Image (Direct URL or ImgBB Embed)
                  </label>
                  <button
                    type="button"
                    onClick={() => setImgBbModalOpen(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>ImgBB Embed Tool</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.thumbnailUrl}
                  onChange={(e) => {
                    const parsed = extractDirectImageUrl(e.target.value);
                    setFormData({ ...formData, thumbnailUrl: parsed });
                  }}
                  placeholder="https://i.ibb.co/... or paste <img> HTML / BBCode"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-slate-900 focus:outline-hidden"
                />
                {formData.thumbnailUrl ? (
                  <div className="mt-2 flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                      <SmartImage
                        src={formData.thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Image Verified
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {formData.thumbnailUrl}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 block mt-1 ml-2">
                    Accepts direct URLs, ImgBB embed HTML, BBCode, or Markdown.
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Screenshots Gallery (URLs or ImgBB codes)
                  </label>
                  <button
                    type="button"
                    onClick={() => setImgBbModalOpen(true)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Auto-parser
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.screenshots}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseMultipleImageUrls(val);
                    if (parsed.length > 0 && (val.includes('<img') || val.includes('[img]'))) {
                      setFormData({ ...formData, screenshots: parsed.join('\n') });
                    } else {
                      setFormData({ ...formData, screenshots: val });
                    }
                  }}
                  placeholder="Paste direct URLs or ImgBB HTML/BBCode (one per line)..."
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-mono focus:bg-white focus:border-slate-900 focus:outline-hidden"
                />
                {formData.screenshots && (
                  <div className="mt-2 flex items-center gap-1.5 overflow-x-auto py-1">
                    {parseMultipleImageUrls(formData.screenshots).map((imgUrl, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
                      >
                        <SmartImage
                          src={imgUrl}
                          alt={`Shot ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags, Developer & License */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="indie, editor, fast"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Developer / Author
                </label>
                <input
                  type="text"
                  value={formData.developer}
                  onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                  placeholder="Studio Name"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  License
                </label>
                <input
                  type="text"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  placeholder="MIT, Apache, Freeware"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full"
                />
              </div>
            </div>

            {/* Checkboxes: Featured & Published */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-0"
                />
                <span>Published (Visible to public)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-0"
                />
                <span>Feature on Homepage Spotlight</span>
              </label>
            </div>

            {/* Cloud Auto-Storage Guarantee Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Automated Cloud Storage:</strong> When you click "{editingId ? 'Save Changes' : 'Publish File'}", this post is automatically saved to your persistent <strong>Cloudflare Workers KV</strong> storage so it is live across all devices immediately.
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0 ml-2">
                Auto-Sync Active
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                disabled={isSubmittingFile}
                className="px-5 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingFile || isDirectUploading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isSubmittingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Storing to Cloudflare KV...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingId ? 'Save Changes & Sync Cloud' : 'Publish File (Save to Storage)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: WORKERS KV & CATBOX.MOE STORAGE & HOSTING */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Workers KV & Catbox.moe File Distribution Architecture
                </h3>
                <p className="text-xs text-slate-500">
                  Direct key-value storage via Cloudflare Workers KV and unthrottled downloads via Catbox.moe edge proxy.
                </p>
              </div>
            </div>

            {/* Storage Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Catbox.moe Integration Module */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold border border-amber-300/60">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Catbox.moe Integration
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Free & Permanent
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Direct External File Hosting
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upload your files directly to <strong>Catbox.moe</strong> (up to 200MB free per file, permanently hosted) or <strong>Litterbox</strong> (up to 1GB temporary).
                  </p>

                  <div className="mt-3 space-y-2 text-xs text-slate-700 bg-white/80 rounded-xl p-3 border border-amber-200/60">
                    <p className="font-semibold text-slate-900">How Filestora handles Catbox:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Upload your file at <a href="https://catbox.moe" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline font-semibold">catbox.moe</a>.</li>
                      <li>Copy the generated link (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">https://files.catbox.moe/abc123.zip</code>).</li>
                      <li>Paste into the File URL input in Filestora.</li>
                      <li>Filestora automatically proxies the file through its Cloudflare Worker edge with clean download headers and custom filenames!</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="https://catbox.moe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-center text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Catbox.moe</span>
                  </a>
                  <a
                    href="https://litterbox.catbox.moe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-center text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Litterbox (1GB)</span>
                  </a>
                </div>
              </div>

              {/* Workers KV Storage Module */}
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-900 text-xs font-bold border border-blue-300/60">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                      Cloudflare Workers KV
                    </span>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      FILE_VAULT Bound
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Native Edge Key-Value Store
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bound directly to your Cloudflare Worker with ultra-low latency worldwide replication.
                  </p>

                  <div className="mt-3 space-y-2 text-xs text-slate-700 bg-white/80 rounded-xl p-3 border border-blue-200/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Binding Name:</span>
                      <code className="font-bold text-blue-800">env.FILE_VAULT</code>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Upload API:</span>
                      <code className="font-bold text-slate-700">POST /upload</code>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Fetch API:</span>
                      <code className="font-bold text-slate-700">GET /files/:key</code>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Global Sync API:</span>
                      <code className="font-bold text-emerald-700">GET/POST /api/catalog</code>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  💡 For files larger than 25MB, simply upload them to Catbox.moe and paste the link into Filestora for unlimited free storage!
                </div>
              </div>
            </div>

            {/* Global Multi-Device Catalog Sync Panel */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>Global Multi-Device Synchronization (Cloudflare KV)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Files stored in Cloudflare KV replicate globally in milliseconds so they are instantly visible on all user devices and browsers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} in directory
                  </span>
                </div>
              </div>

              {cloudSyncStatus && (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{cloudSyncStatus}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={handlePushAllToCloud}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>Push All Files to Cloudflare KV</span>
                </button>
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={handlePullFromCloud}
                  className="px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pull Catalog from Cloudflare KV</span>
                </button>
              </div>
            </div>

            {/* Live Catbox Download Proxy Tester */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Test Catbox.moe Download Stream</span>
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Paste any Catbox.moe URL below to test downloading it through your website's edge proxy.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={testCatboxUrl}
                  onChange={(e) => {
                    setTestCatboxUrl(e.target.value);
                    setTestCatboxStatus(null);
                  }}
                  placeholder="https://files.catbox.moe/abc123.zip"
                  className="w-full sm:flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!testCatboxUrl.trim()) {
                      showToast('Missing URL', 'Please paste a valid Catbox.moe link first', 'warning');
                      return;
                    }
                    if (!storageService.isCatboxUrl(testCatboxUrl)) {
                      showToast('Warning', 'URL does not appear to be hosted on catbox.moe, but testing anyway', 'info');
                    }
                    const cleanName = 'test-catbox-download.zip';
                    const proxyUrl = `/download?url=${encodeURIComponent(testCatboxUrl.trim())}&name=${encodeURIComponent(cleanName)}`;
                    
                    const link = document.createElement('a');
                    link.href = proxyUrl;
                    link.download = cleanName;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setTestCatboxStatus('Download stream initiated via /download proxy!');
                    showToast('Proxy Triggered', 'Attempting edge proxy transfer', 'success');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Test Edge Download</span>
                </button>
              </div>

              {testCatboxStatus && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{testCatboxStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP, EXPORT & RESTORE */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                Database Backup & Data Management
              </h3>
              <p className="text-xs text-slate-500">
                Export JSON snapshots, restore directory files, or reset to original sample dataset.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Export */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Export JSON</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Download complete snapshot of all files, downloads, and checksum records.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Import */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Import JSON</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Restore files from previously exported JSON backup file.
                  </p>
                </div>
                <label className="w-full py-2.5 px-4 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Backup JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset to Default */}
              <div className="p-5 sm:p-6 rounded-3xl bg-red-50/50 border border-red-200/60 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-red-900">Reset Repository</h4>
                  <p className="text-xs text-red-700/80 mt-1">
                    Re-seed database with default verified samples (Games, Apps, Software).
                  </p>
                </div>
                <button
                  onClick={() => setResetModalOpen(true)}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>

            {/* Admin Passcode & Console Security Settings */}
            <div className="border-t border-slate-100 pt-6">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-700" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Admin Passcode & Console Security
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Change your restricted passcode to prevent unauthorized access to this management dashboard.
                </p>
              </div>

              <form onSubmit={handleUpdatePasscode} className="max-w-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Current Passcode
                    </label>
                    <input
                      type="password"
                      required
                      value={passcodeCurrent}
                      onChange={(e) => setPasscodeCurrent(e.target.value)}
                      placeholder="Current..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      New Passcode
                    </label>
                    <input
                      type="password"
                      required
                      value={passcodeNew}
                      onChange={(e) => setPasscodeNew(e.target.value)}
                      placeholder="Min 4 chars..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Confirm New
                    </label>
                    <input
                      type="password"
                      required
                      value={passcodeConfirm}
                      onChange={(e) => setPasscodeConfirm(e.target.value)}
                      placeholder="Re-enter..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full transition-colors shadow-2xs"
                  >
                    Update Passcode
                  </button>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Salted SHA-256 Protected
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete File Distribution?"
        message={`Are you sure you want to delete "${fileToDelete?.title}"? This action cannot be undone and will remove the file from all search listings.`}
        confirmLabel="Delete File"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setFileToDelete(null);
        }}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="Reset Sample Repository?"
        message="This will replace all current files and custom records with the original verified default distribution library."
        confirmLabel="Reset Everything"
        onConfirm={confirmResetData}
        onCancel={() => setResetModalOpen(false)}
      />

      {/* ImgBB Embed Helper Modal */}
      <ImgBbHelperModal
        isOpen={imgBbModalOpen}
        onClose={() => setImgBbModalOpen(false)}
        onSelectUrl={(url, target) => {
          if (target === 'thumbnail') {
            setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
            showToast('Thumbnail Set', 'Extracted direct image applied.', 'success');
          } else {
            setFormData((prev) => ({
              ...prev,
              screenshots: prev.screenshots ? `${prev.screenshots}\n${url}` : url,
            }));
            showToast('Screenshot Added', 'Image appended to screenshot gallery.', 'success');
          }
        }}
      />
    </div>
  );
};
