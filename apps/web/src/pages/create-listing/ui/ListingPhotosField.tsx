import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { MAX_LISTING_IMAGES } from '@markethub/shared';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

export type EditorImage = { id: string | null; url: string };

export function ListingPhotosField({
  images,
  disabled,
  onUpload,
  onRemove,
  compact,
}: {
  images: EditorImage[];
  disabled: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (image: EditorImage) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_LISTING_IMAGES - images.length;
  const canAdd = !disabled && remaining > 0;

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        disabled={!canAdd}
        onChange={(e) => {
          onUpload(e.target.files);
          e.target.value = '';
        }}
      />

      {images.length === 0 ? (
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-border hover:border-primary/40 hover:bg-primary/5 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
            !canAdd && 'cursor-not-allowed opacity-60',
          )}
        >
          <span className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
            <Camera className="h-7 w-7" />
          </span>
          <span>
            <span className="block text-base font-medium">Добавьте фото товара</span>
            <span className="text-muted mt-1 block text-sm">
              Первое фото станет обложкой · до {MAX_LISTING_IMAGES} шт. · до 5 МБ
            </span>
          </span>
          <span className="text-primary text-sm font-medium">Выбрать файлы</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4')}>
            {images.map((image, index) => (
              <div
                key={image.id ?? image.url}
                className={cn('relative overflow-hidden rounded-xl', index === 0 && 'sm:col-span-2 sm:row-span-2')}
              >
                <img
                  src={image.url}
                  alt={index === 0 ? 'Главное фото объявления' : `Фото ${index + 1}`}
                  className={cn(
                    'w-full object-cover',
                    index === 0 ? 'aspect-[4/3] sm:aspect-square sm:min-h-52' : 'aspect-square',
                  )}
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                    Обложка
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2 h-8 w-8 bg-white/90 shadow-sm"
                  aria-label="Удалить фото"
                  disabled={disabled}
                  onClick={() => onRemove(image)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {canAdd ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="border-border hover:border-primary/40 hover:bg-primary/5 flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition-colors"
              >
                <Camera className="text-muted h-6 w-6" />
                <span className="text-muted px-2 text-center text-xs">Ещё {remaining}</span>
              </button>
            ) : null}
          </div>
          <p className="text-muted text-sm">
            {images.length} из {MAX_LISTING_IMAGES} фото
          </p>
        </div>
      )}
    </div>
  );
}
