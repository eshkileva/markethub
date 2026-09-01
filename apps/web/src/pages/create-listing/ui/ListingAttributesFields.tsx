import {
  CategoryAttributeFields,
  type CategoryAttributeDef,
} from '@/entities/category/ui/CategoryAttributeFields';
import { attributeFieldKey } from '../model/listing-form-errors';

export type AttributeDef = CategoryAttributeDef;

export function ListingAttributesFields({
  defs,
  values,
  onChange,
  fieldErrors,
}: {
  defs: AttributeDef[];
  values: Record<string, string>;
  onChange: (attributeId: string, value: string) => void;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CategoryAttributeFields
        defs={defs}
        valueOf={(attr) => values[attr.id] ?? ''}
        onChange={(attr, value) => onChange(attr.id, value)}
        showRequired
        enumClearLabel="Выберите"
        errorOf={(attr) => fieldErrors?.[attributeFieldKey(attr.id)]}
      />
    </div>
  );
}
