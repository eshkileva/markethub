import { z } from 'zod';
import type { listingCopilotRequestSchema, listingReassessSchema } from '@markethub/shared';
import {
  buildListingAssessment,
  type ListingAiAssessment,
  type CurrencyCode,
} from '@markethub/shared';
import type { AppConfig } from '../../../config/env.js';
import type { AiCallLogger } from '../../../infrastructure/ai/ai-call-logger.js';
import type { AiUsageLimiter } from '../../../infrastructure/ai/ai-usage-limiter.js';
import { OpenRouterClient } from '../../../infrastructure/ai/openrouter.client.js';
import { resolveImageForAi } from '../../../infrastructure/ai/resolve-image-for-ai.js';
import type { ObjectStorage } from '../../../infrastructure/storage/s3.js';
import { ValidationError } from '../../../shared/errors/app-error.js';
import type { ListingCopilotRepository } from '../infrastructure/listing-copilot.repository.js';

type CopilotInput = z.infer<typeof listingCopilotRequestSchema>;
type ReassessInput = z.infer<typeof listingReassessSchema>;

const PHOTO_CONTEXT_RULES = [
  'Do not treat ordinary real-world context as a defect.',
  'A room, street, car interior, outdoor setting, or lived-in scene is normal and good for classifieds.',
  'Background does not need to be white, studio, or empty.',
  'Secondary objects around the item (furniture, packaging, other belongings) are fine unless they hide the item or contradict the title.',
  'Only raise photo risk for: item not visible, photo clearly unrelated, stolen/stock/watermarked image, or title/description mismatch.',
].join(' ');

export const LISTING_COPILOT_DRAFT_PROMPT = [
  'You draft classified listings for a CIS marketplace (BY/RU/KZ).',
  'Reply with JSON only. No markdown, no prose, no code fences.',
  'Use exactly these keys:',
  'title, description, categorySlug, condition, attributes, suggestedPrice, riskScore, riskReasons.',
  'Write title and description AS THE SELLER in first person (я продаю, продаю, в отличном состоянии).',
  'Title and description are the public ad text buyers will read.',
  'Sound confident and factual like Avito/Kufar listings: state condition, комплект, особенности, способ передачи.',
  'Never write as a reviewer, moderator, or buyer.',
  'Forbidden in title/description: «уточняйте у продавца», «проверьте при встрече», «возможно», «подозрительно», warnings about scam/fraud, mentions of seller account age or trust.',
  'riskScore (0-100) and riskReasons are INTERNAL moderation signals only — never copy them into title or description.',
  'riskReasons must describe listing-content signals for moderators (item vs photo match, price plausibility), not seller account stats and not ordinary photo setting.',
  PHOTO_CONTEXT_RULES,
  'categorySlug must be one of the provided leaf slugs.',
  'condition must be new, used, or for_parts.',
  'attributes must be an object keyed by attribute keys for the chosen category.',
  'description must be practical Russian text, 2-5 short sentences.',
  'suggestedPrice must be a positive number in the listing currency when possible.',
  'Example:',
  '{"title":"iPhone 13 128GB синий, Global","description":"Продаю iPhone 13 128GB в синем цвете. Телефон полностью рабочий, экран без сколов. Face ID и камеры работают. В комплекте коробка и кабель, iCloud отвязан. Самовывоз или встреча по договорённости.","categorySlug":"smartphones","condition":"used","attributes":{"manufacturer":"Apple","model":"iPhone 13"},"suggestedPrice":48000,"riskScore":20,"riskReasons":["На фото виден телефон из объявления"]}',
].join(' ');

export const LISTING_ASSESS_PUBLISH_PROMPT = [
  'You assess classified listings for moderation on a CIS marketplace.',
  'Reply with JSON only. Keys: riskScore (0-100), riskReasons (array of short Russian strings).',
  'Evaluate photo vs title/description consistency, price plausibility, and whether the photo looks stolen, stock, or unrelated to the item.',
  PHOTO_CONTEXT_RULES,
  'Do not mention seller account age or trust — those are added server-side.',
  'Example:',
  '{"riskScore":18,"riskReasons":["Фото соответствует описанию","Цена правдоподобна для категории"]}',
].join(' ');

const aiDraftSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(10_000),
  categorySlug: z.string().trim().min(1).max(80),
  condition: z.enum(['new', 'used', 'for_parts']),
  attributes: z.record(z.string().trim().max(160)).default({}),
  suggestedPrice: z.number().positive().optional(),
  riskScore: z.number().min(0).max(100).default(30),
  riskReasons: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
});

const publishRiskSchema = z.object({
  riskScore: z.number().min(0).max(100).default(35),
  riskReasons: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
});

export class ListingCopilotService {
  constructor(
    private readonly repo: ListingCopilotRepository,
    private readonly openRouter: OpenRouterClient,
    private readonly config: AppConfig,
    private readonly storage: ObjectStorage,
    private readonly usageLimiter: AiUsageLimiter,
    private readonly aiLogger: AiCallLogger,
  ) {}

  async analyze(userId: string, input: CopilotInput) {
    await this.usageLimiter.assertCopilotQuota(userId);

    const leafCategories = await this.repo.listLeafCategories();
    if (leafCategories.length === 0) {
      throw new ValidationError('Categories are not available');
    }

    const seller = await this.repo.sellerSignals(userId);
    if (!seller) {
      throw new ValidationError('Seller not found');
    }

    const slugList = leafCategories.map((item) => `${item.slug} (${item.nameRu})`).join(', ');
    const imagePayload = await resolveImageForAi(this.config, this.storage, input.imageUrl);
    const draft = await this.openRouter.chatJson<unknown>(
      [
        {
          role: 'system',
          content: LISTING_COPILOT_DRAFT_PROMPT,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Leaf categories: ${slugList}` },
            {
              type: 'text',
              text: [
                `Country: ${input.country}`,
                input.city ? `City: ${input.city}` : null,
                input.hint ? `Seller hint: ${input.hint}` : null,
                input.price
                  ? `Seller draft price: ${input.price} ${input.currency ?? 'RUB'}`
                  : null,
              ]
                .filter(Boolean)
                .join('\n'),
            },
            { type: 'image_url', image_url: { url: imagePayload } },
          ],
        },
      ],
      {
        meta: { operation: 'listing-copilot', userId },
        logger: this.aiLogger,
      },
    );

    const parsed = aiDraftSchema.safeParse(draft);
    if (!parsed.success) {
      throw new ValidationError(
        this.config.isDev
          ? `AI returned an incomplete listing draft: ${parsed.error.issues[0]?.message ?? 'validation failed'}`
          : 'AI returned an incomplete listing draft',
      );
    }

    const category = await this.repo.findCategoryBySlug(parsed.data.categorySlug);
    if (!category) {
      throw new ValidationError('AI chose an unknown category');
    }

    const attrs = await this.repo.listCategoryAttributes(category.id);
    const attributes = attrs
      .map((attr) => {
        const value = parsed.data.attributes[attr.key];
        if (!value?.trim()) return null;
        if (attr.type === 'enum' && attr.options?.length && !attr.options.includes(value)) {
          return null;
        }
        return {
          attributeId: attr.id,
          key: attr.key,
          labelRu: attr.labelRu,
          value: value.trim(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const currency = (input.currency ?? 'RUB') as CurrencyCode;
    const stats = await this.repo.priceStats({
      categoryId: category.id,
      country: input.country,
      currency,
    });

    const suggestedPrice = parsed.data.suggestedPrice ?? input.price ?? stats.median ?? null;
    const assessment = this.buildAssessmentWithSellerSignals(
      parsed.data.riskScore,
      parsed.data.riskReasons,
      seller,
      suggestedPrice ?? input.price,
      stats,
      currency,
    );

    return {
      title: parsed.data.title,
      description: parsed.data.description,
      categoryId: category.id,
      categorySlug: category.slug,
      condition: parsed.data.condition,
      attributes,
      suggestedPrice,
      assessment,
      aiEnabled: this.config.aiEnabled,
    };
  }

  async assessForPublish(userId: string, listingId: string): Promise<ListingAiAssessment | null> {
    if (!this.config.aiEnabled) return null;

    const listing = await this.repo.findListingForAssessment(listingId);
    if (!listing || listing.sellerId !== userId || !listing.coverImageUrl) return null;

    const seller = await this.repo.sellerSignals(userId);
    if (!seller) return null;

    try {
      const imagePayload = await resolveImageForAi(
        this.config,
        this.storage,
        listing.coverImageUrl,
      );
      const draft = await this.openRouter.chatJson<unknown>(
        [
          {
            role: 'system',
            content: LISTING_ASSESS_PUBLISH_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  `Title: ${listing.title}`,
                  `Description: ${listing.description}`,
                  `Price: ${listing.price} ${listing.currency}`,
                  `Country: ${listing.country}`,
                  `Condition: ${listing.condition}`,
                  listing.categorySlug ? `Category: ${listing.categorySlug}` : null,
                ]
                  .filter(Boolean)
                  .join('\n'),
              },
              { type: 'image_url', image_url: { url: imagePayload } },
            ],
          },
        ],
        {
          meta: { operation: 'listing-assess-publish', userId, listingId },
          logger: this.aiLogger,
        },
      );

      const parsed = publishRiskSchema.safeParse(draft);
      if (!parsed.success) return null;

      const stats = await this.repo.priceStats({
        categoryId: listing.categoryId,
        country: listing.country,
        currency: listing.currency,
      });

      return this.buildAssessmentWithSellerSignals(
        parsed.data.riskScore,
        parsed.data.riskReasons,
        seller,
        listing.price,
        stats,
        listing.currency,
      );
    } catch {
      return null;
    }
  }

  async priceInsight(categoryId: string, country: string, currency: CurrencyCode) {
    const stats = await this.repo.priceStats({ categoryId, country, currency });
    return { ...stats, currency };
  }

  async reassess(input: ReassessInput): Promise<{ assessment: ListingAiAssessment }> {
    const stats = await this.repo.priceStats({
      categoryId: input.categoryId,
      country: input.country,
      currency: input.currency,
    });

    const assessment = buildListingAssessment({
      baseRiskScore: input.baseRiskScore,
      sellerTrustScore: input.sellerTrustScore,
      price: input.price,
      stats,
      currency: input.currency,
      reasons: input.reasons,
      model: this.openRouter.model,
    });

    return { assessment };
  }

  private buildAssessmentWithSellerSignals(
    modelRiskScore: number,
    modelReasons: string[],
    seller: NonNullable<Awaited<ReturnType<ListingCopilotRepository['sellerSignals']>>>,
    price: number | null | undefined,
    stats: Awaited<ReturnType<ListingCopilotRepository['priceStats']>>,
    currency: CurrencyCode,
  ) {
    const sellerRiskReasons: string[] = [];
    let baseRiskScore = modelRiskScore;
    if (!seller.emailVerified) {
      baseRiskScore += 8;
      sellerRiskReasons.push('Email продавца не подтверждён');
    }
    if (seller.accountAgeDays < 3) {
      baseRiskScore += 5;
      sellerRiskReasons.push('Новый аккаунт продавца');
    }
    baseRiskScore = Math.min(100, baseRiskScore);

    return buildListingAssessment({
      baseRiskScore,
      sellerTrustScore: seller.trustScore,
      price,
      stats,
      currency,
      reasons: [...modelReasons, ...sellerRiskReasons],
      model: this.openRouter.visionModel,
    });
  }
}
