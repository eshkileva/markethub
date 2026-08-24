import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Страница не найдена</CardTitle>
      </CardHeader>
      <CardContent className="text-muted space-y-3 text-sm">
        <p>Такого адреса нет. Проверьте ссылку или вернитесь в каталог.</p>
        <Button asChild>
          <Link to="/catalog">В каталог</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
