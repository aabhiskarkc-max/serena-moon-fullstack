-- Add monthly and yearly price columns to plans
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "price_monthly" integer;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "price_yearly" integer;
--> statement-breakpoint
-- Backfill: treat existing price as monthly, yearly = monthly * 12
UPDATE "plans" SET "price_monthly" = "price", "price_yearly" = "price" * 12 WHERE "price_monthly" IS NULL;
--> statement-breakpoint
-- Default for any new rows (e.g. from concurrent insert)
UPDATE "plans" SET "price_monthly" = 0, "price_yearly" = 0 WHERE "price_monthly" IS NULL;
--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "price_monthly" SET NOT NULL;
ALTER TABLE "plans" ALTER COLUMN "price_yearly" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN IF EXISTS "price";
ALTER TABLE "plans" DROP COLUMN IF EXISTS "duration_days";
