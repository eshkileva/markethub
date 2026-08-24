import { useState } from 'react';
import { cn } from '@/shared/lib/cn';

type GalleryImage = { id: string; url: string };

export function ListingGallery({ title, images }: { title: string; images: GalleryImage[] }) {
  const [activeId, setActiveId] = useState(images[0]?.id);
  const cover = images.find((image) => image.id === activeId) ?? images[0];

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-linear-to-br aspect-[16/10] from-violet-100 to-slate-100">
        {cover ? (
          <img src={cover.url} alt={title} className="h-full w-full object-cover" />
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
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
