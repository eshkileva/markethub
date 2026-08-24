import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StarRating } from './StarRating';

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  listing: { id: string; title: string } | null;
};

export function ReviewList({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted text-sm">Пока нет отзывов.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((review) => {
        const name = review.author.displayName ?? review.author.username;
        return (
          <li
            key={review.id}
            className="border-border space-y-2 border-b pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                to="/profile/$username"
                params={{ username: review.author.username }}
                className="flex min-w-0 items-center gap-2"
              >
                <Avatar className="h-8 w-8">
                  {review.author.avatarUrl ? (
                    <AvatarImage src={review.author.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{name}</div>
                  <div className="text-muted text-xs">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </Link>
              <StarRating value={review.rating} size="sm" />
            </div>
            {review.comment ? <p className="text-sm leading-relaxed">{review.comment}</p> : null}
            {review.listing ? (
              <Link
                to="/listings/$id"
                params={{ id: review.listing.id }}
                className="text-primary text-xs"
              >
                {review.listing.title}
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
