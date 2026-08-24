import { useState } from 'react';
import { demoListingImageDataUri, isHotlinkPlaceholder } from '@markethub/shared';
import { cn } from '@/shared/lib/cn';

export function ListingImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const label = alt?.trim() || 'Объявление';
  const resolved = isHotlinkPlaceholder(src) ? demoListingImageDataUri(label) : src;

  if (!resolved || failed) {
    return (
      <div
        className={cn('h-full w-full bg-gradient-to-br from-violet-100 to-slate-100', className)}
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt}
      />
    );
  }

  return (
    <img src={resolved} alt={alt ?? ''} className={className} onError={() => setFailed(true)} />
  );
}
