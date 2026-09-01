CREATE TABLE IF NOT EXISTS "email_verification_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_verification_codes_user_idx" ON "email_verification_codes" ("user_id");
CREATE INDEX IF NOT EXISTS "email_verification_codes_expires_idx" ON "email_verification_codes" ("expires_at");
