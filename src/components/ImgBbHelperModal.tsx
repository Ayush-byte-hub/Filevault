import React, { useState } from 'react';
import {
  extractDirectImageUrl,
  parseMultipleImageUrls,
  isImgBbUrl,
  isImgBbViewerPage,
} from '../utils/imageHelper';
import { SmartImage } from './SmartImage';
import {
  ImagePlus,
  X,
  Sparkles,
  Check,
  ExternalLink,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ImgBbHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl: (url: string, target: 'thumbnail' | 'screenshot') => void;
}

export const ImgBbHelperModal: React.FC<ImgBbHelperModalProps> = ({
  isOpen,
  onClose,
  onSelectUrl,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [targetField, setTargetField] = useState<'thumbnail' | 'screenshot'>('thumbnail');

  if (!isOpen) return null;

  const extractedUrls = parseMultipleImageUrls(rawInput);
  const singleExtracted = extractDirectImageUrl(rawInput);
  const isViewerPage = isImgBbViewerPage(rawInput.trim());

  const handleApply = (url: string) => {
    onSelectUrl(url, targetField);
    onClose();
    setRawInput('');
  };

  const handleApplyAllScreenshots = () => {
    if (extractedUrls.length > 0) {
      extractedUrls.forEach((u) => onSelectUrl(u, 'screenshot'));
      onClose();
      setRawInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ImagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ImgBB & Image Embed Converter
              </h3>
              <p className="text-xs text-slate-500">
                Paste any ImgBB HTML code, BBCode, or direct URL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Paste Embed Code or URL:
          </label>
          <textarea
            rows={4}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Examples accepted:\n• HTML: <a href="..."><img src="https://i.ibb.co/xyz/pic.jpg" /></a>\n• BBCode: [img]https://i.ibb.co/xyz/pic.jpg[/img]\n• Markdown: ![alt](https://i.ibb.co/xyz/pic.jpg)\n• Direct Link: https://i.ibb.co/xyz/pic.jpg`}
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-hidden"
          />
        </div>

        {/* Target selection */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-slate-500">Insert into:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="targetField"
              checked={targetField === 'thumbnail'}
              onChange={() => setTargetField('thumbnail')}
              className="text-slate-900"
            />
            <span>Thumbnail Image</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="targetField"
              checked={targetField === 'screenshot'}
              onChange={() => setTargetField('screenshot')}
              className="text-slate-900"
            />
            <span>Screenshots</span>
          </label>
        </div>

        {/* ImgBB Viewer Notice if applicable */}
        {isViewerPage && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice: ImgBB Page link detected</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                On ImgBB, select <strong>"HTML full linked"</strong>, <strong>"BBCode full"</strong>, or copy the <strong>"Direct Link (i.ibb.co/...)"</strong> so the raw image can be displayed.
              </p>
            </div>
          </div>
        )}

        {/* Live Preview */}
        {singleExtracted && singleExtracted.startsWith('http') && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Extracted Direct Image Preview:
            </span>
            <div className="h-32 rounded-xl overflow-hidden bg-slate-200 border border-slate-200/90 flex items-center justify-center">
              <SmartImage
                src={singleExtracted}
                alt="Converted preview"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] font-mono text-slate-500 truncate">
              {singleExtracted}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.open('https://imgbb.com', '_blank')}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open ImgBB</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              Cancel
            </button>

            {extractedUrls.length > 1 && targetField === 'screenshot' ? (
              <button
                type="button"
                onClick={handleApplyAllScreenshots}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors shadow-xs"
              >
                Apply All {extractedUrls.length} Images
              </button>
            ) : (
              <button
                type="button"
                disabled={!singleExtracted || !singleExtracted.startsWith('http')}
                onClick={() => handleApply(singleExtracted)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-full transition-colors shadow-xs"
              >
                Use Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
