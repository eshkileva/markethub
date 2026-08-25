import { isCatalogKind, type CatalogKind } from '@markethub/shared';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Combobox } from '@/shared/ui/combobox';
import { CatalogBrandField, CatalogModelField } from '@/entities/catalog/ui/CatalogFields';

export type CategoryAttributeDef = {
  id: string;
  key: string;
  labelRu: string;
  type: string;
  options: string[] | null;
  required?: boolean;
  dictionary?: string | null;
  parentKey?: string | null;
};

function parentValue(
  defs: CategoryAttributeDef[],
  valueOf: (def: CategoryAttributeDef) => string,
  parentKey?: string | null,
) {
  if (!parentKey) return '';
  const parent = defs.find((item) => item.key === parentKey);
  return parent ? valueOf(parent) : '';
}

export function CategoryAttributeFields({
  defs,
  valueOf,
  onChange,
  idPrefix = 'attr',
  enumClearLabel = 'Любое',
  showRequired = false,
  onBrandChange,
}: {
  defs: CategoryAttributeDef[];
  valueOf: (def: CategoryAttributeDef) => string;
  onChange: (def: CategoryAttributeDef, value: string) => void;
  idPrefix?: string;
  enumClearLabel?: string;
  showRequired?: boolean;
  onBrandChange?: (def: CategoryAttributeDef, value: string) => void;
}) {
  return (
    <>
      {defs.map((attr) => {
        const kind = attr.dictionary && isCatalogKind(attr.dictionary) ? attr.dictionary : null;
        const brand = parentValue(defs, valueOf, attr.parentKey);
        const fieldId = `${idPrefix}-${attr.key}`;
        return (
          <div key={attr.id} className="space-y-1.5">
            <Label htmlFor={fieldId}>
              {attr.labelRu}
              {showRequired && attr.required ? ' *' : ''}
            </Label>
            {kind && attr.key === 'model' ? (
              <CatalogModelField
                id={fieldId}
                kind={kind as CatalogKind}
                brand={brand}
                value={valueOf(attr)}
                onChange={(value) => onChange(attr, value)}
              />
            ) : kind ? (
              <CatalogBrandField
                id={fieldId}
                kind={kind as CatalogKind}
                value={valueOf(attr)}
                onChange={(value) => {
                  if (onBrandChange) {
                    onBrandChange(attr, value);
                  } else {
                    onChange(attr, value);
                    const child = defs.find((item) => item.parentKey === attr.key);
                    if (child) onChange(child, '');
                  }
                }}
              />
            ) : attr.type === 'enum' && attr.options ? (
              <Combobox
                id={fieldId}
                value={valueOf(attr)}
                onChange={(value) => onChange(attr, value)}
                allowEmpty
                clearLabel={enumClearLabel}
                options={attr.options.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            ) : (
              <Input
                id={fieldId}
                value={valueOf(attr)}
                onChange={(e) => onChange(attr, e.target.value)}
                placeholder={attr.type === 'number' ? 'Число' : undefined}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
