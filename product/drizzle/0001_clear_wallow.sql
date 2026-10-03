CREATE TABLE "otp_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"mobile" text NOT NULL,
	"otp" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"token_index" integer NOT NULL,
	"lang" text DEFAULT 'hi' NOT NULL,
	"login_method" text DEFAULT 'anonymous' NOT NULL,
	"patient_name" text,
	"chief_complaint" text DEFAULT 'Not specified' NOT NULL,
	"severity" text DEFAULT 'moderate' NOT NULL,
	"suggested_icd10" text DEFAULT '' NOT NULL,
	"red_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ayush_note" text,
	"has_documents" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"doctor_notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
