import React, { useState } from 'react';
import { Megaphone, ExternalLink, Info } from 'lucide-react';

interface AdPlaceholderProps {
  location: 'homepage' | 'category' | 'detail' | 'download';
  format?: 'banner' | 'rectangle' | 'compact';
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  location,
  format = 'banner',
  className = '',
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // In production, an ad network script (e.g., Adsterra / Google AdSense tag)
  // would be inserted into this dedicated container.
  // We keep it completely distinct from download CTAs to prevent deceptive UX.

  if (format === 'compact') {
    return (
      <div
        id={`ad-slot-${location}-compact`}
        className={`rounded-2xl border border-slate-200/80 bg-slate-100/60 p-3 my-4 text-center ${className}`}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Megaphone className="w-3 h-3 text-slate-400" />
            Sponsored
          </span>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Ad integration info"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>

        <div className="py-2.5 px-3.5 bg-white border border-slate-200/70 rounded-xl text-left flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-slate-900">Cloudflare Edge Storage</p>
            <p className="text-[11px] text-slate-500">Low-latency global asset delivery with zero egress fees.</p>
          </div>
          <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full font-semibold shrink-0 flex items-center gap-1">
            Visit <ExternalLink className="w-3 h-3" />
          </span>
        </div>

        {showInfo && (
          <p className="text-[10px] text-slate-400 mt-2 text-left italic border-t border-slate-200/60 pt-1.5">
            Ad network slot integration ready: Inject verified partner scripts (e.g. Adsterra, Google AdSense) safely into this isolated container.
          </p>
        )}
      </div>
    );
  }

  if (format === 'rectangle') {
    return (
      <div
        id={`ad-slot-${location}-rectangle`}
        className={`rounded-3xl border border-slate-200/90 bg-slate-100/60 p-4 my-6 ${className}`}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Megaphone className="w-3.5 h-3.5 text-slate-400" />
            Advertisement
          </span>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="hover:text-slate-600 transition-colors text-[10px] flex items-center gap-1 font-medium"
          >
            About Ads <Info className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[160px] shadow-2xs">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-1">
            Partner Network Spot
          </span>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            High-Speed Object Storage for Developers
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
            Host releases, binary distributions, and game mods with global edge CDN caching and 100% uptime.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors cursor-pointer">
            <span>Learn More</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>

        {showInfo && (
          <p className="text-[11px] text-slate-400 mt-2 text-center italic">
            Safe Ad Zone: Adsterra / programmatic partner tag container. Non-intrusive and separate from download buttons.
          </p>
        )}
      </div>
    );
  }

  // Default 'banner'
  return (
    <div
      id={`ad-slot-${location}-banner`}
      className={`w-full rounded-3xl border border-slate-200/80 bg-slate-100/60 p-3.5 sm:p-4 my-8 ${className}`}
    >
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2 px-1 uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Megaphone className="w-3.5 h-3.5 text-slate-400" />
          Sponsored Partner
        </span>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="hover:text-slate-600 transition-colors text-[11px] flex items-center gap-1 font-medium"
        >
          <span>Slot: {location}</span>
          <Info className="w-3 h-3" />
        </button>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="text-center sm:text-left">
          <div className="inline-block text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1.5 border border-blue-100">
            Verified Partner
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900">
            Build & Deploy Resilient Open Source Apps
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Free tier includes 10GB S3-compatible R2 storage, edge compute, and automated SSL.
          </p>
        </div>

        <a
          href="https://workers.cloudflare.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-full transition-colors flex items-center gap-1.5"
        >
          <span>Explore Platform</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {showInfo && (
        <div className="mt-2 text-[11px] text-slate-500 bg-white/90 p-3 rounded-xl border border-slate-200/60">
          <strong>Adsterra / Ad Network integration notice:</strong> Replace this container’s inner HTML with your approved ad script tag (`&lt;script type=&quot;text/javascript&quot; src=&quot;//adsterra...&quot;&gt;&lt;/script&gt;`). Styled to prevent CLS (Cumulative Layout Shift) and keep download triggers safe and explicit.
        </div>
      )}
    </div>
  );
};
