import {
  CategoryAttributeFields,
  type CategoryAttributeDef,
} from '@/entities/category/ui/CategoryAttributeFields';

export type AttributeDef = CategoryAttributeDef;

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
      <CategoryAttributeFields
        defs={defs}
        valueOf={(attr) => values[attr.id] ?? ''}
        onChange={(attr, value) => onChange(attr.id, value)}
        showRequired
        enumClearLabel="Выберите"
      />
    </div>
  );
}
