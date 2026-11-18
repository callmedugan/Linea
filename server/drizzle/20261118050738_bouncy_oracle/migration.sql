CREATE TYPE "error_type" AS ENUM('timeout', 'dns', 'connection', 'tls', 'blocked', 'network', 'unknown');--> statement-breakpoint
CREATE TABLE "checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"website_id" uuid NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"error_type" "error_type",
	"expected_status" integer NOT NULL,
	"checked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "claim_id" uuid;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "expected_status" integer DEFAULT 200 NOT NULL;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "last_status" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "response_time_ms" integer;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "last_error" "error_type";--> statement-breakpoint
ALTER TABLE "websites" ALTER COLUMN "interval_seconds" SET DEFAULT 15;--> statement-breakpoint
ALTER TABLE "websites" ALTER COLUMN "next_check_at" SET DATA TYPE timestamp with time zone USING "next_check_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "websites" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
CREATE INDEX "checks_website_id_checked_at_index" ON "checks" ("website_id","checked_at");--> statement-breakpoint
ALTER TABLE "checks" ADD CONSTRAINT "checks_website_id_websites_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE;