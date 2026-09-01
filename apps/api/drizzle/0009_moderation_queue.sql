ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_note text;

CREATE INDEX IF NOT EXISTS listings_pending_moderation_idx
  ON listings (ai_risk_level, created_at DESC)
  WHERE status = 'pending_moderation';
