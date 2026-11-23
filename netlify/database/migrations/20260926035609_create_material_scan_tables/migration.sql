CREATE TABLE "batches" (
	"id" serial PRIMARY KEY,
	"batch_number" text NOT NULL,
	"target_qty" integer DEFAULT 50 NOT NULL,
	"completed_qty" integer DEFAULT 0 NOT NULL,
	"mismatch_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"operator_name" text DEFAULT 'Operator' NOT NULL,
	"operator_email" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scan_items" (
	"id" serial PRIMARY KEY,
	"batch_id" integer NOT NULL,
	"item_index" integer NOT NULL,
	"material_1" text NOT NULL,
	"material_2" text NOT NULL,
	"is_match" boolean NOT NULL,
	"scanned_at" timestamp DEFAULT now(),
	"error_reason" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'Warehouse Operator' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "scan_items" ADD CONSTRAINT "scan_items_batch_id_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id");