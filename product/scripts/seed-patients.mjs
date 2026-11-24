// scripts/seed-patients.mjs
// Seeds 23 realistic Indian patient records into Neon DB
// Run: node scripts/seed-patients.mjs
//
// Uses DATABASE_URL from .env.local

import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

// ── Load .env.local manually ─────────────────────────────────────────────────
const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile.split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);
const DATABASE_URL = env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL missing in .env.local"); process.exit(1); }

const sql = neon(DATABASE_URL);

// ── Helper ────────────────────────────────────────────────────────────────────
function cuid() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
function yob(age) { return new Date().getFullYear() - age; }

// ── Seed data ─────────────────────────────────────────────────────────────────
const PATIENTS = [
  { name:"Ravi Kumar",        gender:"male",   age:42, lang:"hi", cc:"Chest pain and breathlessness since 3 days",  mode:"allopathic" },
  { name:"Sunita Devi",       gender:"female", age:58, lang:"hi", cc:"Joint pain in knees for 6 months",            mode:"allopathic" },
  { name:"Arjun Nair",        gender:"male",   age:34, lang:"ml", cc:"Fever and body ache for 5 days",              mode:"allopathic" },
  { name:"Priya Venkatesh",   gender:"female", age:27, lang:"ta", cc:"Headache and vomiting since morning",         mode:"allopathic" },
  { name:"Mohammed Rashid",   gender:"male",   age:65, lang:"ur", cc:"Increased urination and thirst for 2 months", mode:"allopathic" },
  { name:"Anjali Sharma",     gender:"female", age:32, lang:"hi", cc:"Abdominal pain and irregular periods",        mode:"ayush"      },
  { name:"Deepak Patel",      gender:"male",   age:50, lang:"gu", cc:"Acidity and bloating after meals",            mode:"allopathic" },
  { name:"Kavitha Reddy",     gender:"female", age:45, lang:"te", cc:"Back pain radiating to left leg",             mode:"allopathic" },
  { name:"Santosh Yadav",     gender:"male",   age:38, lang:"hi", cc:"Cough with yellowish sputum for 2 weeks",    mode:"allopathic" },
  { name:"Fatima Shaikh",     gender:"female", age:29, lang:"ur", cc:"Skin rash and itching on arms",              mode:"allopathic" },
  { name:"Ramesh Hegde",      gender:"male",   age:55, lang:"kn", cc:"Dizziness and blurred vision",               mode:"allopathic" },
  { name:"Usha Pillai",       gender:"female", age:62, lang:"ml", cc:"Swelling in feet and shortness of breath",   mode:"allopathic" },
  { name:"Vikram Singh",      gender:"male",   age:28, lang:"hi", cc:"Knee pain after sports injury",              mode:"allopathic" },
  { name:"Meera Iyer",        gender:"female", age:40, lang:"ta", cc:"Hair loss and fatigue for 3 months",         mode:"ayush"      },
  { name:"Suresh Babu",       gender:"male",   age:70, lang:"te", cc:"Forgetfulness and confusion",               mode:"allopathic" },
  { name:"Nandini Kulkarni",  gender:"female", age:35, lang:"mr", cc:"Anxiety and sleep disturbance",             mode:"ayush"      },
  { name:"Harpreet Kaur",     gender:"female", age:48, lang:"pa", cc:"Heavy menstrual bleeding",                  mode:"allopathic" },
  { name:"Amitabh Ghosh",     gender:"male",   age:52, lang:"bn", cc:"Palpitations and sweating at night",        mode:"allopathic" },
  { name:"Leela Nambiar",     gender:"female", age:67, lang:"ml", cc:"Difficulty swallowing solid foods",         mode:"allopathic" },
  { name:"Gaurav Mehta",      gender:"male",   age:23, lang:"hi", cc:"Acne and oily skin",                        mode:"ayush"      },
  { name:"Sarla Bai",         gender:"female", age:75, lang:"hi", cc:"Hip pain and difficulty walking",           mode:"allopathic" },
  { name:"Irfan Khan",        gender:"male",   age:44, lang:"ur", cc:"Weight loss and loss of appetite",          mode:"allopathic" },
  { name:"Divya Krishnaswamy",gender:"female", age:31, lang:"ta", cc:"Thyroid swelling noticed by family",        mode:"allopathic" },
];

const SUMMARIES = [
  { chiefComplaint:"Chest pain", historyOfPresentIllness:"3-day h/o central chest pain, exertional, with associated dyspnoea. No radiation.", pastMedicalHistory:"Hypertension (5y), on amlodipine 5mg", medications:["Amlodipine 5mg OD"], allergies:["NKDA"], familyAndSocialHistory:"Father had MI at 60. Smoker 10 pack-years. Labourer.", reviewOfSystems:"No cough, no haemoptysis, mild ankle swelling.", redFlags:["Exertional chest pain — rule out ACS"], differentialConsiderations:["STEMI/NSTEMI","Unstable angina","GERD"], icd10Suggestions:["I20.0 — Unstable angina"] },
  { chiefComplaint:"Bilateral knee pain", historyOfPresentIllness:"6-month h/o bilateral knee pain, worse on stairs, morning stiffness <30min. Grade 2 crepitus.", pastMedicalHistory:"Type 2 DM (8y), on metformin", medications:["Metformin 500mg BD"], allergies:["NKDA"], familyAndSocialHistory:"Housewife. Mother had osteoarthritis.", reviewOfSystems:"No joint swelling, no fever.", redFlags:[], differentialConsiderations:["Osteoarthritis","Rheumatoid arthritis"], icd10Suggestions:["M17.1 — Primary gonarthrosis"] },
];

async function seed() {
  console.log("🌱 Seeding 23 patients into Neon DB…\n");

  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const sessionId = cuid();
    const patientId = cuid();
    const historyId = cuid();
    const consentId = cuid();

    // Pick a summary (cycle through available ones)
    const summary = SUMMARIES[i % SUMMARIES.length];
    const fullSummary = { ...summary, chiefComplaint: p.cc };

    try {
      // 1. Session
      await sql`
        INSERT INTO sessions (id, lang, mode, status, submitted_at)
        VALUES (${sessionId}, ${p.lang}, ${p.mode}, 'submitted', NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // 2. Patient
      await sql`
        INSERT INTO patients (id, session_id, name, gender, year_of_birth, abha_number, mobile)
        VALUES (${patientId}, ${sessionId}, ${p.name}, ${p.gender}, ${yob(p.age)}, NULL, NULL)
        ON CONFLICT (id) DO NOTHING
      `;

      // 3. History / Report
      await sql`
        INSERT INTO history_records (id, session_id, messages, summary, is_mock)
        VALUES (${historyId}, ${sessionId}, ${JSON.stringify([
          { role:"ai",      text:`What is your main problem today?`, stage:"chief_complaint" },
          { role:"patient", text:p.cc,                                stage:"chief_complaint" },
          { role:"ai",      text:`How long has it been?`,             stage:"hpi" },
          { role:"patient", text:`About ${Math.floor(Math.random()*14)+1} days`, stage:"hpi" },
        ])}, ${JSON.stringify(fullSummary)}, false)
        ON CONFLICT (id) DO NOTHING
      `;

      // 4. Consent
      await sql`
        INSERT INTO consents (id, session_id, data_capture, doctor_share, abha_link, audio_recording)
        VALUES (${consentId}, ${sessionId}, true, true, false, false)
        ON CONFLICT (id) DO NOTHING
      `;

      console.log(`  ✅ ${String(i+1).padStart(2)} | ${p.name.padEnd(24)} | ${p.lang} | ${p.mode} | ${p.cc.slice(0,45)}`);
    } catch (err) {
      console.error(`  ❌ ${i+1} | ${p.name} | ${err.message}`);
    }
  }

  console.log("\n✅ Seed complete — 23 patients inserted.");
}

seed().catch(console.error);
