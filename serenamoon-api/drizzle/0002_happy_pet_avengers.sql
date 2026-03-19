ALTER TABLE "plans" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "price_monthly" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "price_yearly" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "duration_days";