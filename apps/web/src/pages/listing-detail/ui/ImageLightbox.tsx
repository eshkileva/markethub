import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ListingImage } from '@/entities/listing/ui/ListingImage';
import { Button } from '@/shared/ui/button';

export type LightboxImage = { id: string; url: string };

export function ImageLightbox({
  title,
  images,
  activeId,
  onSelect,
  onClose,
}: {
  title: string;
  images: LightboxImage[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const labelId = useId();
  const index = Math.max(
    0,
    images.findIndex((image) => image.id === activeId),
  );
  const current = images[index] ?? images[0];
  const hasMany = images.length > 1;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (!hasMany) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const next = images[(index + 1) % images.length];
        if (next) onSelect(next.id);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const prev = images[(index - 1 + images.length) % images.length];
        if (prev) onSelect(prev.id);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hasMany, images, index, onClose, onSelect]);

  if (!current) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className="z-90 fixed inset-0 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      onClick={onClose}
    >
      <p id={labelId} className="sr-only">
        {title}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>
      {hasMany ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full"
            aria-label="Предыдущее фото"
            onClick={(event) => {
              event.stopPropagation();
              const prev = images[(index - 1 + images.length) % images.length];
              if (prev) onSelect(prev.id);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full sm:right-14"
            aria-label="Следующее фото"
            onClick={(event) => {
              event.stopPropagation();
              const next = images[(index + 1) % images.length];
              if (next) onSelect(next.id);
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      ) : null}
      <div
        className="flex max-h-full max-w-full items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <ListingImage
          src={current.url}
          alt={title}
          className="max-h-[min(90dvh,900px)] max-w-[min(100%,1100px)] rounded-lg object-contain"
        />
      </div>
    </div>,
    document.body,
  );
}
