import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function ListingAttributes({
  items,
}: {
  items: Array<{ attributeId: string; labelRu?: string; value: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Характеристики</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-border divide-y">
          {items.map((item) => (
            <div key={item.attributeId} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-muted">{item.labelRu ?? 'Параметр'}</dt>
              <dd className="text-right font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
