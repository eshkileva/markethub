import { X } from 'lucide-react';
import { MAX_LISTING_IMAGES } from '@markethub/shared';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

export type EditorImage = { id: string | null; url: string };

export function ListingPhotosField({
  images,
  disabled,
  onUpload,
  onRemove,
}: {
  images: EditorImage[];
  disabled: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (image: EditorImage) => void;
}) {
  const remaining = MAX_LISTING_IMAGES - images.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Фото</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={disabled || remaining <= 0}
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-muted text-sm">
          {images.length} из {MAX_LISTING_IMAGES} · до 5 МБ каждое
        </p>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.map((image) => (
              <div key={image.id ?? image.url} className="relative">
                <img
                  src={image.url}
                  alt="Превью объявления"
                  className="aspect-square rounded-xl object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2 h-8 w-8"
                  aria-label="Удалить фото"
                  disabled={disabled}
                  onClick={() => onRemove(image)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Загрузите хотя бы одно фото перед публикацией.</p>
        )}
      </CardContent>
    </Card>
  );
}
