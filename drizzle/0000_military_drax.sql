CREATE TYPE "public"."activity_category" AS ENUM('food_and_drink', 'culture_and_history', 'nature_and_parks', 'shopping', 'nightlife', 'experiences');--> statement-breakpoint
CREATE TABLE "activity_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_local" text,
	"category" "activity_category" NOT NULL,
	"description" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"distance_metres" integer,
	"image_url" text,
	"relevance_score" numeric(4, 2),
	"seasonal_tags" text[],
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrichments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stop_id" uuid NOT NULL,
	"wikipedia_summary" text,
	"wikipedia_url" text,
	"image_url" text,
	"image_attribution" text,
	"opening_hours" text,
	"admission_fee" text,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrichments_stop_id_unique" UNIQUE("stop_id")
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"share_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "itineraries_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_local" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"date_start" date,
	"date_end" date,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_suggestions" ADD CONSTRAINT "activity_suggestions_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichments" ADD CONSTRAINT "enrichments_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;