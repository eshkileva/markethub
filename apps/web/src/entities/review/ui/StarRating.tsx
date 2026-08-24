import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function StarRating({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} из 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index + 1 <= Math.round(value);
        return (
          <Star
            key={index}
            className={cn(px, filled ? 'fill-primary text-primary' : 'text-border')}
          />
        );
      })}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Оценка">
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const filled = rating <= value;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${rating} из 5`}
            className="rounded-full p-0.5"
            onClick={() => onChange(rating)}
          >
            <Star className={cn('h-6 w-6', filled ? 'fill-primary text-primary' : 'text-border')} />
          </button>
        );
      })}
    </div>
  );
}
