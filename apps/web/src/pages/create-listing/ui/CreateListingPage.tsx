import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  COUNTRIES,
  CURRENCIES,
  DELIVERY_MODES,
  LISTING_CONDITIONS,
  MAX_LISTING_IMAGES,
  MAX_UPLOAD_BYTES,
  createListingSchema,
  type CountryCode,
  type CurrencyCode,
  type DeliveryMode,
  type ListingCondition,
} from '@markethub/shared';
import { apiRequest, apiUpload } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { deliveryModeLabels, listingConditionLabels } from '@/entities/listing/model/labels';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { mapListingError } from '../model/map-listing-error';
import { ListingAttributesFields } from './ListingAttributesFields';
import { ListingPhotosField, type EditorImage } from './ListingPhotosField';

type CategoriesResponse = {
  items: Array<{ id: string; slug: string; nameRu: string }>;
};

type AttributesResponse = {
  items: Array<{
    id: string;
    key: string;
    labelRu: string;
    type: string;
    options: string[] | null;
    required: boolean;
  }>;
};

type ListingResponse = {
  id: string;
  status: string;
};

type ListingDetail = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  currency: CurrencyCode;
  country: CountryCode;
  city: string;
  condition: ListingCondition;
  deliveryModes: DeliveryMode[];
  status: string;
  images: Array<{ id: string; url: string }>;
  attributes: Array<{ attributeId: string; value: string }>;
  seller: { id: string } | null;
};

export function CreateListingPage({ listingId }: { listingId?: string }) {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isEdit = Boolean(listingId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('1000');
  const [currency, setCurrency] = useState<CurrencyCode>('RUB');
  const [country, setCountry] = useState<CountryCode>((user?.country as CountryCode) ?? 'RU');
  const [city, setCity] = useState('Москва');
  const [condition, setCondition] = useState<ListingCondition>('used');
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(['meetup']);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [images, setImages] = useState<EditorImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);
  const skipCategoryReset = useRef(isEdit);
  const attributesApplied = useRef(false);

  const listingQuery = useQuery({
    queryKey: ['listing', listingId, accessToken],
    enabled: Boolean(listingId && accessToken),
    queryFn: () => apiRequest<ListingDetail>(`/v1/listings/${listingId}`, { token: accessToken }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<CategoriesResponse>('/v1/categories'),
  });

  const attributesQuery = useQuery({
    queryKey: ['category-attributes', categoryId],
    enabled: Boolean(categoryId),
    queryFn: () => apiRequest<AttributesResponse>(`/v1/categories/${categoryId}/attributes`),
  });

  useEffect(() => {
    if (isEdit) return;
    if (!categoriesQuery.data?.items.length || categoryId) return;
    const computers = categoriesQuery.data.items.find((c) => c.slug === 'computers');
    setCategoryId(computers?.id ?? categoriesQuery.data.items[0]!.id);
  }, [categoriesQuery.data, categoryId, isEdit]);

  useEffect(() => {
    const listing = listingQuery.data;
    if (!listing || loaded) return;
    skipCategoryReset.current = true;
    setTitle(listing.title);
    setDescription(listing.description);
    setCategoryId(listing.categoryId);
    setPrice(String(listing.price));
    setCurrency(listing.currency);
    setCountry(listing.country);
    setCity(listing.city);
    setCondition(listing.condition);
    setDeliveryModes(listing.deliveryModes);
    setImages(listing.images.map((image) => ({ id: image.id, url: image.url })));
    setLoaded(true);
  }, [listingQuery.data, loaded]);

  useEffect(() => {
    if (skipCategoryReset.current) {
      skipCategoryReset.current = false;
      return;
    }
    if (!loaded) return;
    setAttributeValues({});
    attributesApplied.current = false;
  }, [categoryId, loaded]);

  useEffect(() => {
    const listing = listingQuery.data;
    if (!listing || !loaded || attributesApplied.current || attributesQuery.isLoading) return;
    if (categoryId !== listing.categoryId) return;
    const next: Record<string, string> = {};
    for (const attr of listing.attributes) {
      next[attr.attributeId] = attr.value;
    }
    setAttributeValues(next);
    attributesApplied.current = true;
  }, [listingQuery.data, loaded, categoryId, attributesQuery.isLoading]);

  const attributeDefs = attributesQuery.data?.items ?? [];

  const payload = useMemo(
    () => ({
      title,
      description,
      categoryId,
      price: Number(price),
      currency,
      country,
      city,
      condition,
      deliveryModes,
      attributes: attributeDefs
        .filter((attr) => (attributeValues[attr.id] ?? '').trim().length > 0)
        .map((attr) => ({
          attributeId: attr.id,
          value: attributeValues[attr.id]!.trim(),
        })),
    }),
    [
      title,
      description,
      categoryId,
      price,
      currency,
      country,
      city,
      condition,
      deliveryModes,
      attributeDefs,
      attributeValues,
    ],
  );

  if (!accessToken || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Редактирование' : 'Нужна авторизация'}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>
            {isEdit
              ? 'Войдите, чтобы изменить объявление.'
              : 'Чтобы разместить объявление, войдите в аккаунт.'}
          </p>
          <Button asChild>
            <Link to="/auth">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEdit && listingQuery.isLoading) {
    return <Card className="h-80 animate-pulse bg-slate-100" />;
  }

  if (isEdit && (listingQuery.isError || !listingQuery.data)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Объявление не найдено</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link to="/my-listings">К моим объявлениям</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEdit && listingQuery.data?.seller?.id && listingQuery.data.seller.id !== user.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет доступа</CardTitle>
        </CardHeader>
        <CardContent className="text-muted text-sm">
          Редактировать можно только свои объявления.
        </CardContent>
      </Card>
    );
  }

  const listingStatus = listingQuery.data?.status;
  const isSold = listingStatus === 'sold';
  const canPublish = !listingStatus || ['draft', 'rejected', 'archived'].includes(listingStatus);

  async function onUpload(files: FileList | null) {
    if (!files?.length || !accessToken) return;
    setError(null);
    const room = MAX_LISTING_IMAGES - images.length;
    if (room <= 0) {
      setError(`Можно загрузить не больше ${MAX_LISTING_IMAGES} фото`);
      return;
    }
    const selected = Array.from(files).slice(0, room);
    if (selected.some((file) => file.size > MAX_UPLOAD_BYTES)) {
      setError('Файл больше 5 МБ');
      return;
    }
    setBusy(true);
    try {
      const uploaded: EditorImage[] = [];
      for (const file of selected) {
        const result = await apiUpload<{ url: string }>('/v1/media/upload', file, accessToken);
        uploaded.push({ id: null, url: result.url });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? mapListingError(err.message) : 'Не удалось загрузить фото');
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveImage(target: EditorImage) {
    if (!accessToken) return;
    setError(null);
    if (!target.id) {
      setImages((prev) => prev.filter((item) => item.url !== target.url));
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/v1/listings/${listingId}/images/${target.id}`, {
        method: 'DELETE',
        token: accessToken,
      });
      setImages((prev) => prev.filter((item) => item.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? mapListingError(err.message) : 'Не удалось удалить фото');
    } finally {
      setBusy(false);
    }
  }

  function toggleDelivery(mode: DeliveryMode) {
    setDeliveryModes((prev) =>
      prev.includes(mode) ? prev.filter((item) => item !== mode) : [...prev, mode],
    );
  }

  async function onSubmit(publish: boolean) {
    setError(null);
    const parsed = createListingSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Проверьте форму');
      return;
    }
    if (publish && images.length === 0) {
      setError('Добавьте хотя бы одно фото перед публикацией');
      return;
    }
    const missingRequired = attributeDefs.filter(
      (attr) => attr.required && !(attributeValues[attr.id] ?? '').trim(),
    );
    if (publish && missingRequired.length > 0) {
      setError(
        `Заполните характеристики: ${missingRequired.map((attr) => attr.labelRu).join(', ')}`,
      );
      return;
    }

    setBusy(true);
    try {
      const listing = isEdit
        ? await apiRequest<ListingResponse>(`/v1/listings/${listingId}`, {
            method: 'PATCH',
            token: accessToken,
            body: parsed.data,
          })
        : await apiRequest<ListingResponse>('/v1/listings', {
            method: 'POST',
            token: accessToken,
            body: parsed.data,
          });

      const pending = images.filter((image) => !image.id);
      for (const image of pending) {
        const saved = await apiRequest<{ id: string; url: string }>(
          `/v1/listings/${listing.id}/images`,
          {
            method: 'POST',
            token: accessToken,
            body: { url: image.url },
          },
        );
        setImages((prev) =>
          prev.map((item) => (item.url === image.url ? { id: saved.id, url: saved.url } : item)),
        );
      }

      if (publish) {
        await apiRequest(`/v1/listings/${listing.id}/publish`, {
          method: 'POST',
          token: accessToken,
        });
      }

      await navigate(
        isEdit ? { to: '/listings/$id', params: { id: listing.id } } : { to: '/my-listings' },
      );
    } catch (err) {
      setError(
        err instanceof Error ? mapListingError(err.message) : 'Не удалось сохранить объявление',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Редактирование объявления' : 'Новое объявление'}
        </h1>
        <p className="text-muted text-sm">
          {isEdit
            ? 'Изменения сохраняются в объявлении. Новые фото можно добавить сразу.'
            : 'Черновик можно сохранить и опубликовать после загрузки фото.'}
        </p>
      </div>

      {isSold ? (
        <Card>
          <CardContent className="text-muted p-5 text-sm">
            Проданное объявление нельзя изменить.
          </CardContent>
        </Card>
      ) : null}

      <fieldset disabled={busy || isSold} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основное</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Заголовок</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Описание</Label>
              <textarea
                id="description"
                className="border-border bg-card focus-visible:ring-primary/30 min-h-32 w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">Категория</Label>
                <select
                  id="category"
                  className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {(categoriesQuery.data?.items ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameRu}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="condition">Состояние</Label>
                <select
                  id="condition"
                  className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ListingCondition)}
                >
                  {LISTING_CONDITIONS.map((item) => (
                    <option key={item} value={item}>
                      {listingConditionLabels[item]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {attributeDefs.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Характеристики</CardTitle>
            </CardHeader>
            <CardContent>
              <ListingAttributesFields
                defs={attributeDefs}
                values={attributeValues}
                onChange={(id, value) => setAttributeValues((prev) => ({ ...prev, [id]: value }))}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Цена и локация</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Цена</Label>
              <Input
                id="price"
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Валюта</Label>
              <select
                id="currency"
                className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} — {item.nameRu}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Страна</Label>
              <select
                id="country"
                className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
              >
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nameRu}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Город</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Доставка</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {DELIVERY_MODES.map((mode) => {
              const active = deliveryModes.includes(mode);
              return (
                <Button
                  key={mode}
                  type="button"
                  variant={active ? 'default' : 'secondary'}
                  onClick={() => toggleDelivery(mode)}
                >
                  {deliveryModeLabels[mode]}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <ListingPhotosField
          images={images}
          disabled={busy || isSold}
          onUpload={(files) => void onUpload(files)}
          onRemove={(image) => void onRemoveImage(image)}
        />
      </fieldset>

      {error ? <p className="text-danger text-sm">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || isSold}
          onClick={() => void onSubmit(false)}
        >
          {isEdit ? 'Сохранить' : 'Сохранить черновик'}
        </Button>
        {canPublish ? (
          <Button type="button" disabled={busy || isSold} onClick={() => void onSubmit(true)}>
            Опубликовать
          </Button>
        ) : null}
        {isEdit ? (
          <Button asChild variant="ghost">
            <Link to="/listings/$id" params={{ id: listingId! }}>
              Отмена
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
