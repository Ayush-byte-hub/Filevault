import React from 'react';
import Markdown from 'react-markdown';
import { SmartImage } from './SmartImage';

interface RichDescriptionProps {
  content: string;
  onImageClick?: (src: string) => void;
}

/**
 * Converts BBCode [img]...[/img] to markdown ![image](...)
 */
function preprocessBbCode(text: string): string {
  if (!text) return '';
  // Convert [img]url[/img] to ![image](url)
  let processed = text.replace(/\[img\]\s*([^\[\]\s]+)\s*\[\/img\]/gi, '![]($1)');
  // Convert [url=link][img]url[/img][/url] to [![]($2)]($1)
  processed = processed.replace(
    /\[url=([^\]]+)\]\s*!\[(.*?)\]\(([^\)]+)\)\s*\[\/url\]/gi,
    '[$2]($1)'
  );
  return processed;
}

export const RichDescription: React.FC<RichDescriptionProps> = ({ content, onImageClick }) => {
  if (!content) return null;

  const preprocessed = preprocessBbCode(content);

  return (
    <div className="rich-description text-sm text-slate-700 leading-relaxed space-y-3">
      <Markdown
        components={{
          img: ({ src, alt }) => {
            if (!src) return null;
            return (
              <span className="block my-3">
                <span
                  onClick={() => onImageClick && onImageClick(src)}
                  className={`block rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 max-w-2xl ${
                    onImageClick ? 'cursor-zoom-in hover:border-slate-400 transition-colors' : ''
                  }`}
                >
                  <SmartImage
                    src={src}
                    alt={alt || 'Embedded release image'}
                    className="w-full max-h-[480px] object-contain rounded-2xl"
                  />
                </span>
                {alt && <span className="block text-[11px] text-slate-400 mt-1 italic">{alt}</span>}
              </span>
            );
          },
          p: ({ children }) => <p className="mb-2.5 leading-relaxed">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-xs">
              {children}
            </code>
          ),
        }}
      >
        {preprocessed}
      </Markdown>
    </div>
  );
};
