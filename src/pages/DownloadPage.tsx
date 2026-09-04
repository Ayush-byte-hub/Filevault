import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';
import { storageService } from '../services/storageService';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FileCard } from '../components/FileCard';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { SmartImage } from '../components/SmartImage';
import { useToast } from '../context/ToastContext';
import {
  Download,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Cloud,
  FileCheck2,
} from 'lucide-react';

interface DownloadPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onTriggerDownload: (file: FileItem) => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({
  slug,
  onNavigate,
  onTriggerDownload,
}) => {
  const { showToast } = useToast();
  const file = storageService.getFileBySlug(slug);

  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (file) {
      document.title = `Downloading ${file.title} - FileVault`;
    }
    return () => {
      document.title = 'FileVault - Minimal File Hosting & Downloads';
    };
  }, [file]);

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">File Not Found</h2>
        <p className="text-sm text-neutral-500 mb-6">
          The file you are trying to download is unavailable.
        </p>
        <button
          onClick={() => onNavigate('/files')}
          className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Browse All Files
        </button>
      </div>
    );
  }

  const relatedFiles = storageService.getRelatedFiles(file, 4);

  const handleStartDownload = () => {
    setDownloadStarted(true);
    onTriggerDownload(file);
    showToast('Download Commenced', `Transferring ${file.title} (${file.fileSize})`, 'success');
  };

  const copyChecksum = () => {
    navigator.clipboard.writeText(file.checksum);
    setCopiedHash(true);
    showToast('Checksum Copied', 'SHA-256 hash copied to clipboard');
    setTimeout(() => setCopiedHash(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Files', onClick: () => onNavigate('/files') },
          { label: file.title, onClick: () => onNavigate(`/file/${file.slug}`) },
          { label: 'Download' },
        ]}
      />

      {/* Main Download Container (Bento Card) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs text-center">
        {/* Back Link */}
        <div className="flex items-center justify-start mb-6">
          <button
            onClick={() => onNavigate(`/file/${file.slug}`)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to file details</span>
          </button>
        </div>

        {/* File Icon & Identity */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
          <SmartImage
            src={file.thumbnailUrl}
            alt={file.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Package Ready</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
          {file.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 font-mono mb-6">
          Version {file.version} • {file.fileType} • {file.fileSize}
        </p>

        {/* Real Download Action Bento Box */}
        <div className="max-w-md mx-auto bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 mb-6">
          {downloadStarted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Your download has begun!</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                If the file did not automatically begin downloading, click the button below to retry immediately.
              </p>
              <button
                id="retry-download-btn"
                onClick={handleStartDownload}
                className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Retry Download ({file.fileSize})</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                id="start-download-now-btn"
                onClick={handleStartDownload}
                className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                <span>Download Now ({file.fileSize})</span>
              </button>
              <p className="text-[11px] text-slate-400">
                Direct Cloudflare R2 transfer. Safe, unthrottled, and free of bundled software.
              </p>
            </div>
          )}
        </div>

        {/* Security & Integrity Checkbox */}
        <div className="max-w-lg mx-auto text-left border-t border-slate-100 pt-6 space-y-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-slate-500" />
              Cryptographic Checksum (SHA-256)
            </span>
            <button
              onClick={copyChecksum}
              className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-100/80 p-3 rounded-2xl font-mono text-[11px] text-slate-700 break-all select-all">
            {file.checksum}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero spyware or 3rd party wrappers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Encrypted HTTPS TLS 1.3 transfer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clearly Separated Advertising Slot (Adsterra / Partner Network integration point) */}
      <div className="pt-2">
        <AdPlaceholder location="download" format="banner" />
      </div>

      {/* Related Files */}
      {relatedFiles.length > 0 && (
        <div className="pt-6 border-t border-slate-200/80">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-5">
            More Verified Distributions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedFiles.map((rf) => (
              <FileCard
                key={rf.id}
                file={rf}
                onNavigate={onNavigate}
                onQuickDownload={onTriggerDownload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
