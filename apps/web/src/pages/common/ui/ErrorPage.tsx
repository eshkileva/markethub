import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Что-то сломалось</CardTitle>
      </CardHeader>
      <CardContent className="text-muted space-y-3 text-sm">
        <p>Не удалось показать страницу. Обновите или вернитесь в каталог.</p>
        {error.message ? <p className="break-all font-mono text-xs">{error.message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={reset}>
            Попробовать снова
          </Button>
          <Button asChild>
            <Link to="/catalog">В каталог</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
