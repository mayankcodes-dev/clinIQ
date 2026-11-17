// src/lib/clinicAnalytics.ts
// Chronic-condition detector, 30-day recall scheduler, and live Clinic ROI calculator.
// Pure-function module - no side effects, no imports from server-only code.

import type { ClinicQueueEntry } from "./clinicQueueStore";
import type { ClinIQClinicalReport } from "./sessionStore";

// --- Chronic condition catalogue ---------------------------------------------

export type ChronicTag =
  | "Diabetes"
  | "Hypertension"
  | "Hypothyroidism"
  | "Asthma"
  | "Osteoarthritis"
  | "AYUSH Chronic Care"
  | "Chronic Kidney Disease"
  | "COPD"
  | "Ischemic Heart Disease";

interface ChronicRule {
  tag: ChronicTag;
  /** ICD-10 prefixes that match this condition */
  icd10Prefixes: string[];
  /** Case-insensitive keywords to scan in text fields */
  keywords: string[];
  /** Recommended recall interval in days */
  recallDays: number;
  /** Average consultation fee (?) for ROI calc */
  avgFeeINR: number;
  /** Canonical SNOMED / lay term for WhatsApp message */
  displayName: { en: string; hi: string };
}

const CHRONIC_RULES: ChronicRule[] = [
  {
    tag: "Diabetes",
    icd10Prefixes: ["E10", "E11", "E12", "E13", "E14"],
    keywords: ["diabetes", "diabetic", "blood sugar", "hyperglycemia", "insulin", "metformin", "HbA1c", "fasting glucose"],
    recallDays: 30,
    avgFeeINR: 500,
    displayName: { en: "Diabetes", hi: "?????? (????)" },
  },
  {
    tag: "Hypertension",
    icd10Prefixes: ["I10", "I11", "I12", "I13"],
    keywords: ["hypertension", "high blood pressure", "HTN", "amlodipine", "telmisartan", "atenolol", "antihypertensive"],
    recallDays: 30,
    avgFeeINR: 450,
    displayName: { en: "Hypertension", hi: "???? ??????? (BP)" },
  },
  {
    tag: "Hypothyroidism",
    icd10Prefixes: ["E03", "E00", "E01", "E02"],
    keywords: ["hypothyroidism", "thyroid", "TSH", "thyroxine", "levothyroxine", "T3", "T4"],
    recallDays: 60,
    avgFeeINR: 500,
    displayName: { en: "Thyroid Disorder", hi: "??????? ?????" },
  },
  {
    tag: "Asthma",
    icd10Prefixes: ["J45", "J46"],
    keywords: ["asthma", "bronchial", "inhaler", "salbutamol", "budesonide", "formoterol", "wheeze", "wheezing"],
    recallDays: 30,
    avgFeeINR: 450,
    displayName: { en: "Asthma", hi: "??? (??????)" },
  },
  {
    tag: "Osteoarthritis",
    icd10Prefixes: ["M15", "M16", "M17", "M18", "M19"],
    keywords: ["osteoarthritis", "arthritis", "joint pain", "knee pain", "vata-rakta", "rheumatoid", "gout"],
    recallDays: 30,
    avgFeeINR: 500,
    displayName: { en: "Arthritis / Joint Disorder", hi: "????? / ?????? ?? ????" },
  },
  {
    tag: "AYUSH Chronic Care",
    icd10Prefixes: [],
    keywords: ["ayurveda", "panchakarma", "rasayana", "vata", "pitta", "kapha", "prakriti", "dosha imbalance"],
    recallDays: 21,
    avgFeeINR: 400,
    displayName: { en: "AYUSH Chronic Care", hi: "???? ?????????? ????????" },
  },
  {
    tag: "Chronic Kidney Disease",
    icd10Prefixes: ["N18", "N19"],
    keywords: ["chronic kidney", "CKD", "renal failure", "creatinine", "eGFR", "dialysis", "nephrotic"],
    recallDays: 14,
    avgFeeINR: 600,
    displayName: { en: "Chronic Kidney Disease", hi: "?????????? ?????? ???" },
  },
  {
    tag: "COPD",
    icd10Prefixes: ["J44", "J43"],
    keywords: ["COPD", "chronic obstructive", "emphysema", "bronchiectasis", "tiotropium", "ipratropium"],
    recallDays: 30,
    avgFeeINR: 450,
    displayName: { en: "COPD", hi: "COPD (?????? ?? ???)" },
  },
  {
    tag: "Ischemic Heart Disease",
    icd10Prefixes: ["I20", "I21", "I22", "I25"],
    keywords: ["ischemic heart", "angina", "coronary", "CAD", "stent", "CABG", "aspirin", "clopidogrel", "nitrate"],
    recallDays: 14,
    avgFeeINR: 600,
    displayName: { en: "Ischemic Heart Disease", hi: "???? ??? (IHD)" },
  },
];

// --- Detection ----------------------------------------------------------------

function safeStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(safeStr).join(" ");
  return "";
}

function buildSearchCorpus(entry: ClinicQueueEntry): string {
  const r = entry.report as Partial<ClinIQClinicalReport> | undefined;
  const parts: string[] = [
    safeStr(entry.chiefComplaint),
    ...(entry.icd10Suggestions ?? []).map(safeStr),
    ...(entry.redFlags ?? []).map(safeStr),
    safeStr(r?.chiefComplaint),
    safeStr(r?.historyOfPresentIllness),
    safeStr(r?.pastMedicalHistory),
    safeStr(r?.medications),
    safeStr(r?.differentialConsiderations),
    safeStr(r?.keyLabFindings),
    safeStr(r?.familyAndSocialHistory),
    safeStr(r?.reviewOfSystems),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/** Returns all chronic tags that match this patient's clinical data. */
export function detectChronicConditions(entry: ClinicQueueEntry): ChronicTag[] {
  const corpus = buildSearchCorpus(entry);
  const icd10List = (entry.icd10Suggestions ?? []).map((c) => c.toUpperCase());
  const matched: ChronicTag[] = [];

  for (const rule of CHRONIC_RULES) {
    const icdMatch = rule.icd10Prefixes.some((prefix) =>
      icd10List.some((code) => code.startsWith(prefix))
    );
    const keywordMatch = rule.keywords.some((kw) =>
      corpus.includes(kw.toLowerCase())
    );
    if (icdMatch || keywordMatch) {
      matched.push(rule.tag);
    }
  }
  return matched;
}

const FALLBACK_RULE: ChronicRule = {
  tag: "Diabetes",
  icd10Prefixes: [],
  keywords: [],
  recallDays: 30,
  avgFeeINR: 500,
  displayName: { en: "Chronic Condition", hi: "?????????? ??????" },
};

function getRuleForTag(tag: ChronicTag): ChronicRule {
  return CHRONIC_RULES.find((r) => r.tag === tag) ?? FALLBACK_RULE;
}

// --- Recall record ------------------------------------------------------------

export interface ChronicRecallRecord {
  entryId: string;
  patientName: string;
  patientAge?: string;
  language: string;
  tokenNumber: number;
  clinicId: string;
  conditions: ChronicTag[];
  primaryTag: ChronicTag;
  recallDays: number;
  scheduledDate: string;   // ISO date string
  scheduledLabel: string;  // "15 Dec 2026"
  whatsappUrl: string;
  intakeCompletedAt: number;
}

function formatDate(ts: number, extraDays: number): { iso: string; label: string } {
  // Guard: if ts is 0 or in the past before 2020, treat as "now"
  const base = ts > 1_577_836_800_000 ? ts : Date.now();
  const d = new Date(base + extraDays * 86_400_000);
  const iso = d.toISOString().slice(0, 10);
  const label = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return { iso, label };
}

function buildRecallWhatsApp(
  entry: ClinicQueueEntry,
  tag: ChronicTag,
  rule: ChronicRule,
  scheduledLabel: string,
  baseUrl: string
): string {
  const lang = entry.language?.toLowerCase() ?? "en";
  const isHindi = lang === "hi" || lang === "hindi";

  const conditionName = isHindi ? rule.displayName.hi : rule.displayName.en;
  // If baseUrl is empty (SSR edge), use a relative-safe placeholder
  const safeBase = baseUrl.startsWith("http") ? baseUrl : "https://app.cliniq.health";
  const checkInUrl = `${safeBase}/patient/consent?clinicId=${encodeURIComponent(entry.clinicId)}&recall=1`;

  let body: string;
  if (isHindi) {
    body = [
      `?? *ClinIQ - ???????? ?????????*`,
      ``,
      `?????? ${entry.patientName} ??,`,
      ``,
      `???? ????? ???? ?? ?????? ???? *${conditionName}* ?? ??? ?????? ????-?? ?????? ???`,
      ``,
      `?? *???????? ???????? ????:* ${scheduledLabel}`,
      ``,
      `???? ???? ?????? ?? ???? ????? ???? ???? ????????? ???-?? ???? ????:`,
      checkInUrl,
      ``,
      `_ClinIQ AI - ??????, ????, ???? ???? ???_ ??`,
    ].join("\n");
  } else {
    body = [
      `?? *ClinIQ - Follow-Up Reminder*`,
      ``,
      `Hello ${entry.patientName},`,
      ``,
      `Based on your recent visit, you are due for a *${conditionName}* follow-up consultation.`,
      ``,
      `?? *Recommended Visit Date:* ${scheduledLabel}`,
      ``,
      `Please complete your health check-in before your next visit:`,
      checkInUrl,
      ``,
      `_ClinIQ AI - Fast, Accurate, In Your Language_ ??`,
    ].join("\n");
  }

  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

/** Build ChronicRecallRecord for a single queue entry. Returns null if no chronic conditions found. */
export function buildRecallRecord(
  entry: ClinicQueueEntry,
  baseUrl: string
): ChronicRecallRecord | null {
  if (!entry.report) return null;
  const conditions = detectChronicConditions(entry);
  if (conditions.length === 0) return null;

  const primaryTag = conditions[0];
  const rule = getRuleForTag(primaryTag);
  const { iso, label } = formatDate(
    entry.intakeCompletedAt || Date.now(),
    rule.recallDays
  );

  return {
    entryId: entry.id,
    patientName: entry.patientName,
    patientAge: entry.patientAge,
    language: entry.language,
    tokenNumber: entry.tokenNumber,
    clinicId: entry.clinicId,
    conditions,
    primaryTag,
    recallDays: rule.recallDays,
    scheduledDate: iso,
    scheduledLabel: label,
    whatsappUrl: buildRecallWhatsApp(entry, primaryTag, rule, label, baseUrl),
    intakeCompletedAt: entry.intakeCompletedAt,
  };
}

/** Build recall records for the entire clinic queue. */
export function buildRecallList(
  queue: ClinicQueueEntry[],
  baseUrl: string
): ChronicRecallRecord[] {
  return queue
    .filter((e) => e.status === "done" || e.report)
    .map((e) => buildRecallRecord(e, baseUrl))
    .filter((r): r is ChronicRecallRecord => r !== null)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

// --- ROI Calculator -----------------------------------------------------------

export interface ClinicROIMetrics {
  totalIntakes: number;
  completedIntakes: number;
  doctorHoursSaved: number;        // intakes * 6.5 min / 60
  avgIntakeLatencyMins: number;
  chronicPatientsCount: number;
  chronicFollowUpsQueued: number;
  projectedMonthlyRevenueLift: number; // chronicPatients * ?500
  redFlagsDetected: number;
  estimatedAnnualRevenueLift: number;
}

export function calculateClinicROI(
  queue: ClinicQueueEntry[],
  recallList: ChronicRecallRecord[]
): ClinicROIMetrics {
  const completedIntakes = queue.filter((e) => e.report || e.status === "done").length;
  const totalIntakes = queue.length;

  const validIntakes = queue.filter(
    (e) => (e.report || e.status === "done") && e.avgIntakeMins > 0
  );
  const avgIntakeLatencyMins =
    validIntakes.length > 0
      ? Math.round(
          (validIntakes.reduce((s, e) => s + e.avgIntakeMins, 0) /
            validIntakes.length) *
            10
        ) / 10
      : 0;

  const doctorHoursSaved = Math.round((completedIntakes * 6.5) / 60 * 10) / 10;
  const chronicPatientsCount = recallList.length;

  // Revenue lift: each chronic patient generates a recall consult fee
  // Use per-condition avg fee; fall back to ?500 baseline
  const projectedMonthlyRevenueLift = recallList.length === 0 ? 0 : recallList.reduce((sum, r) => {
    const rule = getRuleForTag(r.primaryTag);
    return sum + rule.avgFeeINR;
  }, 0);

  const redFlagsDetected = queue.filter((e) => e.hasRedFlags).length;

  return {
    totalIntakes,
    completedIntakes,
    doctorHoursSaved,
    avgIntakeLatencyMins,
    chronicPatientsCount,
    chronicFollowUpsQueued: recallList.length,
    projectedMonthlyRevenueLift,
    estimatedAnnualRevenueLift: projectedMonthlyRevenueLift * 12,
    redFlagsDetected,
  };
}

// --- Condition color palette --------------------------------------------------

export const CHRONIC_TAG_STYLES: Record<ChronicTag, { bg: string; text: string; border: string }> = {
  Diabetes:               { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Hypertension:           { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  Hypothyroidism:         { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  Asthma:                 { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"    },
  Osteoarthritis:         { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  "AYUSH Chronic Care":   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  "Chronic Kidney Disease":{ bg: "bg-indigo-50", text: "text-indigo-700",  border: "border-indigo-200" },
  COPD:                   { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"   },
  "Ischemic Heart Disease":{ bg: "bg-rose-50",   text: "text-rose-700",    border: "border-rose-200"   },
};
