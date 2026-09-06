import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';
import { storageService } from '../services/storageService';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FileCard } from '../components/FileCard';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { LightboxModal } from '../components/LightboxModal';
import { SmartImage } from '../components/SmartImage';
import { RichDescription } from '../components/RichDescription';
import { useToast } from '../context/ToastContext';
import {
  Download,
  ShieldCheck,
  HardDrive,
  Calendar,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Info,
  Maximize2,
  FileCode,
  Tag,
  Share2,
  Lock,
  Cloud,
  Loader2,
} from 'lucide-react';

interface FileDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onQuickDownload: (file: FileItem) => void;
}

export const FileDetailPage: React.FC<FileDetailPageProps> = ({
  slug,
  onNavigate,
  onQuickDownload,
}) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<FileItem | null>(() => storageService.getFileBySlug(slug) || null);
  const [loading, setLoading] = useState<boolean>(!storageService.getFileBySlug(slug));

  const [copiedHash, setCopiedHash] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync / fetch file by slug from Cloudflare Workers KV if not in local storage
  useEffect(() => {
    const localFile = storageService.getFileBySlug(slug);
    if (localFile) {
      setFile(localFile);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    storageService
      .fetchFileBySlug(slug)
      .then((cloudFile) => {
        if (isMounted) {
          setFile(cloudFile);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Subscribe to storage changes (e.g. background sync finishing from Cloudflare KV)
  useEffect(() => {
    return storageService.subscribe(() => {
      const updated = storageService.getFileBySlug(slug);
      if (updated) {
        setFile(updated);
        setLoading(false);
      }
    });
  }, [slug]);

  useEffect(() => {
    if (file) {
      storageService.addRecentlyViewed(file.slug);
      // Update page title dynamically for SEO
      document.title = `${file.title} (${file.version}) - Download | FileVault`;
    }
    return () => {
      document.title = 'FileVault - Minimal File Hosting & Downloads';
    };
  }, [file]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 mx-auto text-slate-800 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Loading File Distribution...</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Checking Cloudflare edge storage for verified release details.
        </p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">File Not Found</h2>
        <p className="text-sm text-neutral-500 mb-6">
          The requested file distribution does not exist or may have been unpublished.
        </p>
        <button
          onClick={() => onNavigate('/files')}
          className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Return to All Files
        </button>
      </div>
    );
  }

  const relatedFiles = storageService.getRelatedFiles(file, 4);

  const copyChecksum = () => {
    navigator.clipboard.writeText(file.checksum);
    setCopiedHash(true);
    showToast('SHA-256 Copied', 'Checksum copied to clipboard for integrity verification.');
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('Link Copied', 'Direct file page URL copied to clipboard.');
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const allPreviewImages = file.screenshots && file.screenshots.length > 0
    ? file.screenshots
    : file.thumbnailUrl ? [file.thumbnailUrl] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Files', onClick: () => onNavigate('/files') },
          {
            label: file.category.charAt(0).toUpperCase() + file.category.slice(1),
            onClick: () => onNavigate(`/category/${file.category}`),
          },
          { label: file.title },
        ]}
      />

      {/* Main File Header Card (Bento Hero Cell) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          {/* File Thumbnail & Identity */}
          <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
              <SmartImage
                src={file.thumbnailUrl}
                alt={file.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs text-[10px] font-bold text-white text-center py-0.5 tracking-wider uppercase">
                {file.fileType}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <button
                  onClick={() => onNavigate(`/category/${file.category}`)}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors capitalize border border-slate-200/60"
                >
                  {file.category}
                </button>
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-100/80 text-slate-600 border border-slate-200/50">
                  {file.version}
                </span>
                {file.safetyVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Safe
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                {file.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                {file.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 flex-wrap">
                {file.developer && (
                  <span>Developer: <strong className="text-slate-700">{file.developer}</strong></span>
                )}
                <span>License: <strong className="text-slate-700">{file.license || 'Permissive'}</strong></span>
                <span>Downloads: <strong className="text-slate-700">{file.downloadCount.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Action CTAs Box */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 pt-2 md:pt-0">
            <button
              id="file-primary-download-btn"
              onClick={() => onNavigate(`/file/${file.slug}/download`)}
              className="w-full sm:w-auto md:w-56 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Go to Download</span>
            </button>

            <button
              id="file-quick-download-btn"
              onClick={() => onQuickDownload(file)}
              className="w-full sm:w-auto md:w-56 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Instant Download ({file.fileSize})</span>
            </button>

            <button
              onClick={copyShareLink}
              className="w-full sm:w-auto md:w-56 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Key Specs Bento Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">File Size</span>
            <span className="font-bold text-slate-900">{file.fileSize}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Archive Format</span>
            <span className="font-bold text-slate-900 uppercase font-mono">{file.fileType}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Release Date</span>
            <span className="font-bold text-slate-900">{formatDate(file.uploadDate)}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Last Updated</span>
            <span className="font-bold text-slate-900">{formatDate(file.updatedDate)}</span>
          </div>
        </div>
      </div>

      {/* Grid: Details & Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Long description, screenshots, release notes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview & Description */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              About this Release
            </h2>
            <RichDescription
              content={file.longDescription || file.description}
              onImageClick={(src) => {
                const existingIdx = allPreviewImages.indexOf(src);
                if (existingIdx !== -1) {
                  setActiveImageIndex(existingIdx);
                }
                setLightboxOpen(true);
              }}
            />

            {/* Compatibility info */}
            {file.compatibility && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  System Requirements & Compatibility
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 font-semibold">
                  {file.compatibility}
                </p>
              </div>
            )}

            {/* Release notes */}
            {file.releaseNotes && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Changelog & Notes ({file.version})
                </h3>
                <pre className="text-xs font-mono text-slate-700 bg-slate-50 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {file.releaseNotes}
                </pre>
              </div>
            )}

            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Tags:</span>
                {file.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => onNavigate(`/search?q=${encodeURIComponent(t)}`)}
                    className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors font-medium"
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Screenshots Gallery */}
          {allPreviewImages.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Screenshots & Previews
                </h2>
                <span className="text-xs text-slate-400">
                  Click image to expand
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allPreviewImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 aspect-video cursor-pointer"
                  >
                    <SmartImage
                      src={imgUrl}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white p-2.5 rounded-xl backdrop-blur-xs">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ad Slot on Detail Page */}
          <AdPlaceholder location="detail" format="banner" />
        </div>

        {/* Right 1 Col: Security, Checksum & Storage Details */}
        <div className="space-y-6">
          {/* File Integrity & Security Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                File Integrity & Checksum
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-500">SHA-256 Hash</span>
                <button
                  onClick={copyChecksum}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl font-mono text-[11px] text-slate-800 break-all select-all leading-relaxed">
                {file.checksum}
              </div>
            </div>

            {file.md5Checksum && (
              <div>
                <span className="text-slate-500 text-xs block mb-1 font-semibold">MD5 Signature</span>
                <div className="bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl font-mono text-[11px] text-slate-700 select-all">
                  {file.md5Checksum}
                </div>
              </div>
            )}

            <div className="pt-2 text-xs text-slate-500 space-y-1.5">
              <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Zero modifications guarantee
              </p>
              <p className="text-[11px] leading-relaxed">
                Compare the cryptographic checksum of your downloaded archive with the hash above to guarantee zero file tampering.
              </p>
            </div>
          </div>

          {/* Storage Distribution Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Cloud className="w-5 h-5 text-blue-500 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Storage & Delivery
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {file.downloadMode === 'redirect'
                ? 'Delivered through an authenticated high-speed distribution mirror with verified hash integrity.'
                : 'Delivered directly through Filestora high-speed edge distribution network with verified package integrity.'}
            </p>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 font-mono text-[11px] text-slate-600 break-all">
              {file.downloadMode === 'redirect'
                ? `secure-mirror://${file.slug}.distribution`
                : `filestora://edge-storage/${file.slug}.${(file.fileType || 'zip').toLowerCase()}`}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 font-medium">
              <span>
                Origin:{' '}
                {file.downloadMode === 'redirect'
                  ? 'Verified Release Mirror'
                  : 'Filestora Edge CDN'}
              </span>
              <span className="font-bold text-emerald-600">Online</span>
            </div>
          </div>

          {/* Compact Ad Slot */}
          <AdPlaceholder location="detail" format="compact" />
        </div>
      </div>

      {/* Related Files Section */}
      {relatedFiles.length > 0 && (
        <section className="pt-8 border-t border-slate-200/80">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6">
            Related Distributions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedFiles.map((rf) => (
              <FileCard
                key={rf.id}
                file={rf}
                onNavigate={onNavigate}
                onQuickDownload={onQuickDownload}
              />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      <LightboxModal
        images={allPreviewImages}
        currentIndex={activeImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActiveImageIndex}
      />
    </div>
  );
};
