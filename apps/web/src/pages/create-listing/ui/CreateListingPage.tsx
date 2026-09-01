import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CURRENCIES,
  DELIVERY_MODES,
  LISTING_CONDITIONS,
  MAX_LISTING_IMAGES,
  MAX_UPLOAD_BYTES,
  createListingSchema,
  categoryRequiresCondition,
  type CountryCode,
  type CurrencyCode,
  type DeliveryMode,
  type ListingCondition,
} from '@markethub/shared';
import { apiRequest, apiUpload } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { deliveryModeLabels, listingConditionLabels } from '@/entities/listing/model/labels';
import { CitySelect } from '@/entities/geo/ui/CitySelect';
import { CountrySelect } from '@/entities/geo/ui/CountrySelect';
import { Combobox } from '@/shared/ui/combobox';
import { categoryChildren, categoryRoots } from '@/entities/category/model/tree';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { mapListingError } from '../model/map-listing-error';
import {
  attributeFieldKey,
  listingFormErrorCount,
  listingSectionHasError,
  scrollToFirstFieldError,
  zodIssuesToFieldErrors,
} from '../model/listing-form-errors';
import { ListingAttributesFields, type AttributeDef } from './ListingAttributesFields';
import { FieldError, fieldControlClass } from '@/shared/ui/field-error';
import { ListingFormSection } from './ListingFormSection';
import { ListingPhotosField, type EditorImage } from './ListingPhotosField';
import {
  ListingCopilotPanel,
  type ListingCopilotResult,
} from '@/features/listing-copilot/ui/ListingCopilotPanel';
import { ListingPriceHint } from '@/features/listing-copilot/ui/ListingPriceHint';
import { AiPagePitch } from '@/features/ai/ui/AiPagePitch';
import { useAiStatus } from '@/features/ai/model/use-ai-status';
import type { ListingAiAssessment } from '@markethub/shared';

type PriceInsightResponse = {
  min: number | null;
  max: number | null;
  median: number | null;
  sampleSize: number;
  currency: CurrencyCode;
};

type CategoriesResponse = {
  items: Array<{ id: string; slug: string; nameRu: string; parentId: string | null }>;
};

type AttributesResponse = { items: AttributeDef[] };

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
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('RUB');
  const [country, setCountry] = useState<CountryCode>((user?.country as CountryCode) ?? 'RU');
  const [city, setCity] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('used');
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(['meetup']);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [images, setImages] = useState<EditorImage[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [copilotResult, setCopilotResult] = useState<ListingCopilotResult | null>(null);
  const [aiAssessment, setAiAssessment] = useState<ListingAiAssessment | null>(null);
  const [assessmentStale, setAssessmentStale] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);
  const skipCategoryReset = useRef(isEdit);
  const attributesApplied = useRef(false);
  const lastAssessedCover = useRef<string | null>(null);
  const reassessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentReassessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipStaleMark = useRef(false);
  const coverImageUrl = images[0]?.url ?? null;

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

  const aiStatusQuery = useAiStatus();

  const priceInsightQuery = useQuery({
    queryKey: ['ai', 'price-insight', categoryId, country, currency, accessToken],
    enabled: Boolean(accessToken && categoryId),
    queryFn: () => {
      const params = new URLSearchParams({
        categoryId,
        country,
        currency,
      });
      return apiRequest<PriceInsightResponse>(`/v1/ai/price-insight?${params}`, {
        token: accessToken,
      });
    },
  });

  const priceHintSource = aiAssessment?.price ?? priceInsightQuery.data ?? null;

  const categoryItems = categoriesQuery.data?.items ?? [];
  const selectedCategory = categoryItems.find((item) => item.id === categoryId);
  const selectedRootId = selectedCategory?.parentId ?? '';
  const selectedRoot = categoryItems.find((item) => item.id === selectedRootId);
  const showCondition = categoryRequiresCondition(selectedRoot?.slug);
  const leafOptions = selectedRootId ? categoryChildren(categoryItems, selectedRootId) : [];

  useEffect(() => {
    if (isEdit) return;
    if (!categoriesQuery.data?.items.length || categoryId) return;
    const laptops = categoriesQuery.data.items.find((c) => c.slug === 'laptops');
    setCategoryId(laptops?.id ?? categoriesQuery.data.items.find((c) => c.parentId)?.id ?? '');
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

  useEffect(() => {
    return () => {
      if (reassessTimer.current) clearTimeout(reassessTimer.current);
      if (contentReassessTimer.current) clearTimeout(contentReassessTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!aiAssessment || !categoryId) return;
    if (reassessTimer.current) clearTimeout(reassessTimer.current);
    reassessTimer.current = setTimeout(() => {
      void reassessPrice();
    }, 500);
  }, [price, categoryId, country, currency]);

  useEffect(() => {
    if (!aiAssessment || !coverImageUrl || !aiStatusQuery.data?.enabled) return;
    if (lastAssessedCover.current === coverImageUrl) return;
    if (!lastAssessedCover.current) return;

    if (contentReassessTimer.current) clearTimeout(contentReassessTimer.current);
    contentReassessTimer.current = setTimeout(() => {
      void runCopilot(coverImageUrl, { reassessOnly: true });
    }, 1000);
  }, [coverImageUrl]);

  useEffect(() => {
    if (!aiAssessment) return;
    if (skipStaleMark.current) {
      skipStaleMark.current = false;
      return;
    }
    setAssessmentStale(true);
  }, [title, description]);

  const attributeDefs = attributesQuery.data?.items ?? [];
  const withAttributes = attributeDefs.length > 0;
  const formIssueCount = listingFormErrorCount(fieldErrors);

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const payload = useMemo(
    () => ({
      title,
      description,
      categoryId,
      price: Number(price),
      currency,
      country,
      city,
      condition: showCondition ? condition : 'used',
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
      showCondition,
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
    setFormError(null);
    const room = MAX_LISTING_IMAGES - images.length;
    if (room <= 0) {
      setFormError(`Можно загрузить не больше ${MAX_LISTING_IMAGES} фото`);
      return;
    }
    const selected = Array.from(files).slice(0, room);
    if (selected.some((file) => file.size > MAX_UPLOAD_BYTES)) {
      setFormError('Файл больше 5 МБ');
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
      clearFieldError('photos');    } catch (err) {
      setFormError(err instanceof Error ? mapListingError(err.message) : 'Не удалось загрузить фото');
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveImage(target: EditorImage) {
    if (!accessToken) return;
    setFormError(null);
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
      setFormError(err instanceof Error ? mapListingError(err.message) : 'Не удалось удалить фото');
    } finally {
      setBusy(false);
    }
  }

  function toggleDelivery(mode: DeliveryMode) {
    setDeliveryModes((prev) =>
      prev.includes(mode) ? prev.filter((item) => item !== mode) : [...prev, mode],
    );
  }

  function applyCopilotDraftFrom(result: ListingCopilotResult) {
    skipStaleMark.current = true;
    setTitle(result.title);
    setDescription(result.description);
    setCategoryId(result.categoryId);
    setCondition(result.condition);
    if (result.suggestedPrice) {
      setPrice(String(Math.round(result.suggestedPrice)));
    }
    setAiAssessment(result.assessment);
    setAttributeValues(
      Object.fromEntries(result.attributes.map((item) => [item.attributeId, item.value])),
    );
    lastAssessedCover.current = coverImageUrl ?? lastAssessedCover.current;
    setAssessmentStale(false);
  }

  async function reassessPrice(): Promise<ListingAiAssessment | null> {
    if (!accessToken || !aiAssessment || !categoryId) return aiAssessment;
    const numericPrice = Number(price);
    try {
      const result = await apiRequest<{ assessment: ListingAiAssessment }>('/v1/ai/listing-reassess', {
        method: 'POST',
        token: accessToken,
        body: {
          categoryId,
          country,
          currency,
          price: numericPrice > 0 ? numericPrice : undefined,
          baseRiskScore: aiAssessment.baseRiskScore,
          sellerTrustScore: aiAssessment.sellerTrustScore,
          reasons: aiAssessment.reasons,
        },
      });
      setAiAssessment(result.assessment);
      if (copilotResult) {
        setCopilotResult({ ...copilotResult, assessment: result.assessment });
      }
      return result.assessment;
    } catch {
      return aiAssessment;
    }
  }

  async function runCopilot(
    imageUrl: string,
    options?: { reassessOnly?: boolean },
  ): Promise<ListingAiAssessment | null> {
    if (!accessToken) return aiAssessment;
    setCopilotBusy(true);
    setFormError(null);
    try {
      const result = await apiRequest<ListingCopilotResult>('/v1/ai/listing-copilot', {
        method: 'POST',
        token: accessToken,
        body: {
          imageUrl,
          country,
          city: city || undefined,
          price: Number(price) > 0 ? Number(price) : undefined,
          currency,
        },
      });
      setCopilotResult((prev) =>
        options?.reassessOnly && prev
          ? {
              ...prev,
              assessment: result.assessment,
              suggestedPrice: result.suggestedPrice,
            }
          : result,
      );
      setAiAssessment(result.assessment);
      lastAssessedCover.current = imageUrl;
      setAssessmentStale(false);
      return result.assessment;
    } catch (err) {
      if (!options?.reassessOnly) {
        setFormError(err instanceof Error ? mapListingError(err.message) : 'AI copilot недоступен');
      }
      return aiAssessment;
    } finally {
      setCopilotBusy(false);
    }
  }

  function applyCopilotDraft() {
    if (!copilotResult) return;
    applyCopilotDraftFrom(copilotResult);
  }

  function validateForm(publish: boolean) {
    const parsed = createListingSchema.safeParse({
      ...payload,
      price: price.trim() === '' ? '' : Number(price),
    });
    const errors = parsed.success ? {} : zodIssuesToFieldErrors(parsed.error.issues);

    if (publish && images.length === 0) {
      errors.photos = 'Добавьте хотя бы одно фото';
    }

    if (publish) {
      for (const attr of attributeDefs.filter((item) => item.required)) {
        if (!(attributeValues[attr.id] ?? '').trim()) {
          errors[attributeFieldKey(attr.id)] = `Укажите «${attr.labelRu}»`;
        }
      }
    }

    return { parsed, errors };
  }

  async function onSubmit(publish: boolean) {
    setFormError(null);
    const { parsed, errors } = validateForm(publish);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollToFirstFieldError(errors);
      return;
    }
    if (!parsed.success) return;

    setFieldErrors({});

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
          body: {},
        });
      }

      await navigate(
        isEdit ? { to: '/listings/$id', params: { id: listing.id } } : { to: '/my-listings' },
      );
    } catch (err) {
      setFormError(
        err instanceof Error ? mapListingError(err.message) : 'Не удалось сохранить объявление',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-28">
      {!isEdit ? <AiPagePitch page="create-listing" compact className="mb-6" /> : null}
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Редактирование объявления' : 'Подать объявление'}
        </h1>
        <p className="text-muted text-sm">
          {isEdit
            ? 'Изменения сохраняются в объявлении. Новые фото можно добавить сразу.'
            : 'Заполните форму по шагам — как на Avito или Kufar.'}
        </p>
      </header>

      {isSold ? (
        <Card className="mb-6">
          <CardContent className="text-muted p-5 text-sm">
            Проданное объявление нельзя изменить.
          </CardContent>
        </Card>
      ) : null}

      <fieldset disabled={busy || isSold} className="space-y-4">
        {formIssueCount > 0 ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100"
            role="alert"
          >
            Исправьте {formIssueCount}{' '}
            {formIssueCount === 1 ? 'ошибку' : formIssueCount < 5 ? 'ошибки' : 'ошибок'} в форме —
            они отмечены у соответствующих полей.
          </div>
        ) : null}

        <ListingFormSection
          step={1}
          title="Фото"
          hint="Сначала добавьте снимки — первое фото будет на карточке в каталоге."
          hasError={listingSectionHasError(1, fieldErrors, withAttributes)}
        >
          <div id="field-photos" className="scroll-mt-24 space-y-2">
            <ListingPhotosField
            images={images}
            disabled={busy || isSold}
            onUpload={(files) => void onUpload(files)}
            onRemove={(image) => void onRemoveImage(image)}
            />
            <FieldError message={fieldErrors.photos} />
          </div>

          {aiStatusQuery.data?.enabled && !isEdit ? (
            <div className="border-border bg-muted/40 space-y-3 rounded-xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">AI-помощник</p>
                  <p className="text-muted text-sm">
                    Сгенерирует черновик по главному фото. Форма не изменится, пока вы не нажмёте
                    «Применить черновик AI».
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={copilotBusy || images.length === 0}
                  onClick={() => void runCopilot(images[0]!.url)}
                >
                  {copilotBusy ? 'AI анализирует…' : 'Сгенерировать черновик'}
                </Button>
              </div>
              {assessmentStale && aiAssessment ? (
                <p className="text-amber-700 text-xs dark:text-amber-300">
                  Вы изменили текст объявления — Trust Score обновится при публикации.
                </p>
              ) : null}
            </div>
          ) : null}

          {copilotResult ? (
            <ListingCopilotPanel
              assessment={copilotResult.assessment}
              suggestedPrice={copilotResult.suggestedPrice}
              busy={busy}
              onApply={applyCopilotDraft}
            />
          ) : null}
        </ListingFormSection>

        <ListingFormSection
          step={2}
          title="Категория"
          hint="Выберите раздел и подкатегорию — от этого зависят характеристики."
          hasError={listingSectionHasError(2, fieldErrors, withAttributes)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category-root">Раздел</Label>
              <Combobox
                id="category-root"
                value={selectedRootId}
                onChange={(rootId) => {
                  const first = categoryChildren(categoryItems, rootId)[0];
                  setCategoryId(first?.id ?? '');
                  clearFieldError('categoryId');
                }}
                options={categoryRoots(categoryItems).map((category) => ({
                  value: category.id,
                  label: category.nameRu,
                }))}
              />
            </div>
            <div id="field-categoryId" className="scroll-mt-24 space-y-1.5">
              <Label htmlFor="category">Подкатегория</Label>
              <Combobox
                id="category"
                value={categoryId}
                onChange={(value) => {
                  setCategoryId(value);
                  clearFieldError('categoryId');
                }}
                disabled={!selectedRootId}
                placeholder={selectedRootId ? 'Подкатегория' : 'Сначала выберите раздел'}
                className={fieldControlClass(Boolean(fieldErrors.categoryId))}
                options={leafOptions.map((category) => ({
                  value: category.id,
                  label: category.nameRu,
                }))}
              />
              <FieldError message={fieldErrors.categoryId} />
            </div>
          </div>
          {showCondition ? (
            <div id="field-condition" className="max-w-xs scroll-mt-24 space-y-1.5">
              <Label htmlFor="condition">Состояние</Label>
              <Combobox
                id="condition"
                value={condition}
                onChange={(value) => {
                  setCondition(value as ListingCondition);
                  clearFieldError('condition');
                }}
                className={fieldControlClass(Boolean(fieldErrors.condition))}
                options={LISTING_CONDITIONS.map((item) => ({
                  value: item,
                  label: listingConditionLabels[item],
                }))}
              />
              <FieldError message={fieldErrors.condition} />
            </div>
          ) : null}
        </ListingFormSection>

        <ListingFormSection
          step={3}
          title="Название и описание"
          hint="Пишите от первого лица — так покупатели привыкли читать объявления."
          hasError={listingSectionHasError(3, fieldErrors, withAttributes)}
        >
          <div id="field-title" className="scroll-mt-24 space-y-1.5">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              placeholder="Например: iPhone 13 128GB синий, Global"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFieldError('title');
              }}
              aria-invalid={Boolean(fieldErrors.title)}
              className={fieldControlClass(Boolean(fieldErrors.title))}
            />
            <div className="flex items-start justify-between gap-2">
              <FieldError message={fieldErrors.title} />
              <p className="text-muted ml-auto text-xs">{title.length}/120</p>
            </div>
          </div>
          <div id="field-description" className="scroll-mt-24 space-y-1.5">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              placeholder="Опишите товар: состояние, комплект, особенности, как можно забрать."
              className={fieldControlClass(
                Boolean(fieldErrors.description),
                'border-border bg-card focus-visible:ring-primary/30 min-h-36 w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2',
              )}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError('description');
              }}
              aria-invalid={Boolean(fieldErrors.description)}
            />
            <FieldError message={fieldErrors.description} />
          </div>
        </ListingFormSection>

        {withAttributes ? (
          <ListingFormSection
            step={4}
            title="Характеристики"
            hint="Заполните параметры — по ним покупатели фильтруют каталог."
            hasError={listingSectionHasError(4, fieldErrors, withAttributes)}
          >
            <ListingAttributesFields
              defs={attributeDefs}
              values={attributeValues}
              fieldErrors={fieldErrors}
              onChange={(id, value) => {
                setAttributeValues((prev) => ({ ...prev, [id]: value }));
                clearFieldError(attributeFieldKey(id));
              }}
            />
          </ListingFormSection>
        ) : null}

        <ListingFormSection
          step={withAttributes ? 5 : 4}
          title="Цена"
          hint="Укажите сумму, которую хотите получить за товар."
          hasError={listingSectionHasError(5, fieldErrors, withAttributes)}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <div id="field-price" className="scroll-mt-24 space-y-1.5">
              <Label htmlFor="price">Сумма</Label>
              <Input
                id="price"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="0"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearFieldError('price');
                }}
                aria-invalid={Boolean(fieldErrors.price)}
                className={fieldControlClass(Boolean(fieldErrors.price))}
              />
              <FieldError message={fieldErrors.price} />
            </div>
            <div id="field-currency" className="scroll-mt-24 space-y-1.5">
              <Label htmlFor="currency">Валюта</Label>
              <Combobox
                id="currency"
                value={currency}
                onChange={(value) => {
                  setCurrency(value as CurrencyCode);
                  clearFieldError('currency');
                }}
                className={fieldControlClass(Boolean(fieldErrors.currency))}
                options={CURRENCIES.map((item) => ({
                  value: item.code,
                  label: `${item.code} — ${item.nameRu}`,
                }))}
              />
              <FieldError message={fieldErrors.currency} />
            </div>
          </div>
          <ListingPriceHint price={price} insight={priceHintSource} />
        </ListingFormSection>

        <ListingFormSection
          step={withAttributes ? 6 : 5}
          title="Место и способ передачи"
          hint="Где можно забрать товар и как вы готовы передать его покупателю."
          hasError={listingSectionHasError(6, fieldErrors, withAttributes)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div id="field-country" className="scroll-mt-24 space-y-1.5">
              <Label htmlFor="country">Страна</Label>
              <CountrySelect
                id="country"
                value={country}
                onChange={(value) => {
                  setCountry(value as CountryCode);
                  clearFieldError('country');
                }}
                onCountryChange={() => {
                  setCity('');
                  clearFieldError('city');
                }}
              />
              <FieldError message={fieldErrors.country} />
            </div>
            <div id="field-city" className="scroll-mt-24 space-y-1.5">
              <Label htmlFor="city">Город</Label>
              <CitySelect
                id="city"
                country={country}
                value={city}
                onChange={(value) => {
                  setCity(value);
                  clearFieldError('city');
                }}
              />
              <FieldError message={fieldErrors.city} />
            </div>
          </div>
          <div id="field-deliveryModes" className="scroll-mt-24 space-y-2">
            <Label>Способ передачи</Label>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_MODES.map((mode) => {
                const active = deliveryModes.includes(mode);
                return (
                  <Button
                    key={mode}
                    type="button"
                    variant={active ? 'default' : 'secondary'}
                    onClick={() => {
                      toggleDelivery(mode);
                      clearFieldError('deliveryModes');
                    }}
                  >
                    {deliveryModeLabels[mode]}
                  </Button>
                );
              })}
            </div>
            <FieldError message={fieldErrors.deliveryModes} />
          </div>
        </ListingFormSection>
      </fieldset>

      {formError ? (
        <p
          className="text-danger mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed inset-x-0 bottom-0 z-20 border-t p-4 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl flex-wrap gap-3">
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
    </div>
  );
}
