CREATE TABLE "websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"email" text NOT NULL,
	"interval_seconds" integer DEFAULT 30 NOT NULL,
	"next_check_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "websites_url_email_unique" UNIQUE("url","email")
);
