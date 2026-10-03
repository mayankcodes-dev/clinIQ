// scripts/migrate.ts
// Run DB migrations against Neon — adds doctor_notes column to queue_entries.
// Usage: npx tsx scripts/migrate.ts
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running ClinIQ DB migration...");

  // Add doctor_notes to queue_entries if it doesn't exist
  await sql`
    ALTER TABLE queue_entries
    ADD COLUMN IF NOT EXISTS doctor_notes text
  `;
  console.log("✅ doctor_notes column added to queue_entries");

  // Also ensure otp_sessions table exists (it may have been missing)
  await sql`
    CREATE TABLE IF NOT EXISTS otp_sessions (
      id text PRIMARY KEY,
      mobile text NOT NULL,
      otp text NOT NULL,
      expires_at timestamp NOT NULL,
      attempts integer DEFAULT 0 NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ otp_sessions table verified");

  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
