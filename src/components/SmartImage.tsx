import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = 'Image',
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 select-none ${className}`}
      >
        <ImageOff className="w-5 h-5 mb-1 opacity-60" />
        <span className="text-[10px] font-medium text-slate-400 truncate max-w-full">
          Preview
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      onLoad={handleLoad}
      className={`${className} ${isLoading ? 'opacity-80 transition-opacity' : 'opacity-100'}`}
      {...props}
    />
  );
};
