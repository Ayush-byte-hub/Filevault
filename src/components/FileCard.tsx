import React from 'react';
import { FileItem } from '../types';
import { SmartImage } from './SmartImage';
import {
  Download,
  ShieldCheck,
  HardDrive,
  Calendar,
  Layers,
  ArrowUpRight,
  FileCode,
  FileText,
  Gamepad2,
  Film,
  Music,
  AppWindow,
  FolderArchive,
} from 'lucide-react';

interface FileCardProps {
  file: FileItem;
  onNavigate: (path: string) => void;
  onQuickDownload?: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onNavigate, onQuickDownload }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'games':
        return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'apps':
        return <AppWindow className="w-3.5 h-3.5" />;
      case 'software':
        return <FileCode className="w-3.5 h-3.5" />;
      case 'documents':
        return <FileText className="w-3.5 h-3.5" />;
      case 'videos':
        return <Film className="w-3.5 h-3.5" />;
      case 'music':
        return <Music className="w-3.5 h-3.5" />;
      default:
        return <FolderArchive className="w-3.5 h-3.5" />;
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const formatDownloadCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div
      id={`file-card-${file.slug}`}
      className="group relative flex flex-col justify-between bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div>
        {/* Header & Thumbnail */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 shadow-2xs">
            {file.thumbnailUrl ? (
              <SmartImage
                src={file.thumbnailUrl}
                alt={file.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                {getCategoryIcon(file.category)}
              </div>
            )}
            <span className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs text-[9px] font-bold text-white text-center py-0.5 tracking-wider uppercase">
              {file.fileType}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize">
                {getCategoryIcon(file.category)}
                {file.category}
              </span>
              {file.isFeatured && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                  Featured
                </span>
              )}
              {file.safetyVerified && (
                <span
                  title="Verified Checksum & Clean"
                  className="inline-flex items-center text-emerald-600 bg-emerald-50 p-1 rounded-full border border-emerald-100"
                >
                  <ShieldCheck className="w-3 h-3" />
                </span>
              )}
            </div>

            <button
              onClick={() => onNavigate(`/file/${file.slug}`)}
              className="text-left w-full group/title"
            >
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-snug group-hover/title:text-blue-600 transition-colors truncate">
                {file.title}
              </h3>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-mono text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                v{file.version}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Download className="w-3 h-3 text-slate-400" />
                {formatDownloadCount(file.downloadCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {file.description}
        </p>
      </div>

      {/* Meta Bar & Actions */}
      <div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <HardDrive className="w-3 h-3 text-slate-400" />
              {file.fileSize}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDate(file.updatedDate || file.uploadDate)}
            </span>
          </div>

          <span className="text-[10px] font-mono font-medium text-slate-500 uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
            {file.fileType}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id={`view-details-${file.slug}`}
            onClick={() => onNavigate(`/file/${file.slug}`)}
            className="w-full text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90 rounded-xl py-2 px-3 transition-colors flex items-center justify-center gap-1"
          >
            <span>Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            id={`download-btn-${file.slug}`}
            onClick={() => {
              if (onQuickDownload) {
                onQuickDownload(file);
              } else {
                onNavigate(`/file/${file.slug}/download`);
              }
            }}
            className="w-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl py-2 px-3 transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
