import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { ListingImage } from '@/entities/listing/ui/ListingImage';
import { ImageLightbox } from '@/pages/listing-detail/ui/ImageLightbox';

type GalleryImage = { id: string; url: string };

export function ListingGallery({ title, images }: { title: string; images: GalleryImage[] }) {
  const [activeId, setActiveId] = useState(images[0]?.id);
  const [open, setOpen] = useState(false);
  const cover = images.find((image) => image.id === activeId) ?? images[0];

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-linear-to-br aspect-[16/10] from-violet-100 to-slate-100">
        {cover ? (
          <button
            type="button"
            className="h-full w-full cursor-zoom-in"
            aria-label="Открыть фото"
            onClick={() => setOpen(true)}
          >
            <ListingImage src={cover.url} alt={title} className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-sm">Нет фото</div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto p-3">
          {images.map((image) => {
            const active = image.id === cover?.id;
            return (
              <button
                key={image.id}
                type="button"
                aria-label="Показать фото"
                aria-pressed={active}
                className={cn(
                  'h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-offset-2',
                  active ? 'ring-primary ring-2' : 'opacity-80 hover:opacity-100',
                )}
                onClick={() => setActiveId(image.id)}
              >
                <ListingImage src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
      {open && cover ? (
        <ImageLightbox
          title={title}
          images={images}
          activeId={cover.id}
          onSelect={setActiveId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
