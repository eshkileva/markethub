import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';

export type AttributeDef = {
  id: string;
  key: string;
  labelRu: string;
  type: string;
  options: string[] | null;
  required: boolean;
};

export function ListingAttributesFields({
  defs,
  values,
  onChange,
}: {
  defs: AttributeDef[];
  values: Record<string, string>;
  onChange: (attributeId: string, value: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {defs.map((attr) => (
        <div key={attr.id} className="space-y-1.5">
          <Label htmlFor={attr.id}>
            {attr.labelRu}
            {attr.required ? ' *' : ''}
          </Label>
          {attr.type === 'enum' && attr.options ? (
            <select
              id={attr.id}
              className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
              value={values[attr.id] ?? ''}
              onChange={(e) => onChange(attr.id, e.target.value)}
            >
              <option value="">Выберите</option>
              {attr.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={attr.id}
              value={values[attr.id] ?? ''}
              onChange={(e) => onChange(attr.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
