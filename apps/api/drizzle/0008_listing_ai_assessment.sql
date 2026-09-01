ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "listing_trust_score" integer,
  ADD COLUMN IF NOT EXISTS "ai_risk_level" text,
  ADD COLUMN IF NOT EXISTS "ai_assessment" jsonb,
  ADD COLUMN IF NOT EXISTS "ai_assessed_at" timestamptz;
