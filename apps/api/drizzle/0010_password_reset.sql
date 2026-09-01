CREATE TABLE IF NOT EXISTS "password_reset_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "password_reset_codes_user_idx" ON "password_reset_codes" ("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_codes_expires_idx" ON "password_reset_codes" ("expires_at");
