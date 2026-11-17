import "server-only";

import {
  GENERAL_OPD_SAFETY_GUIDELINE,
  LOCAL_CLINICAL_KNOWLEDGE,
  type ClinicalGuidelineChunk,
  type ICD10Mapping,
} from "./localClinicalKnowledge";

export type { ClinicalGuidelineChunk } from "./localClinicalKnowledge";

const MAX_RESULTS = 4;
const SUPABASE_TIMEOUT_MS = 1_500;

type UnknownRecord = Record<string, unknown>;

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenise(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

const LOCAL_INDEX = LOCAL_CLINICAL_KNOWLEDGE.map((entry, index) => ({
  entry,
  index,
  normalizedTitle: normalizeText(`${entry.title} ${entry.symptomCluster}`),
  normalizedKeywords: entry.keywords.map(normalizeText),
}));

function scoreLocalEntry(query: string, entry: (typeof LOCAL_INDEX)[number]): number {
  const normalizedQuery = normalizeText(query);
  const queryTokens = new Set(tokenise(query));
  if (!normalizedQuery) return 0;

  let score = 0;
  for (const keyword of entry.normalizedKeywords) {
    if (!keyword) continue;
    if (normalizedQuery.includes(keyword)) {
      // Phrases such as "chest pain" are stronger than a single token.
      score += keyword.includes(" ") ? 5 : 2;
      continue;
    }

    const keywordTokens = keyword.split(" ");
    if (keywordTokens.some((token) => queryTokens.has(token))) score += 1;
  }

  for (const token of entry.normalizedTitle.split(" ")) {
    if (token.length > 2 && queryTokens.has(token)) score += 1;
  }

  return score;
}

function cloneLocalChunk(
  entry: ClinicalGuidelineChunk,
  score = 0
): ClinicalGuidelineChunk {
  return {
    ...entry,
    mandatoryFollowUpQuestions: [...entry.mandatoryFollowUpQuestions],
    redFlagSymptoms: [...entry.redFlagSymptoms],
    ayushCorrelates: [...entry.ayushCorrelates],
    icd10Mappings: entry.icd10Mappings.map((mapping) => ({ ...mapping })),
    score,
    retrievalMethod: "local",
  };
}

/**
 * Deterministic local retrieval. It does no I/O, embedding, or model call and
 * is intentionally small enough to complete well below the 15ms local-dev
 * budget even on a kiosk/serverless cold start.
 */
export function retrieveLocalClinicalContext(
  chiefComplaintEnglish: string,
  ayushMode: boolean
): ClinicalGuidelineChunk[] {
  const ranked = LOCAL_INDEX
    .map((indexed) => ({
      indexed,
      score: scoreLocalEntry(chiefComplaintEnglish, indexed),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.indexed.index - right.indexed.index)
    .slice(0, MAX_RESULTS);

  if (ranked.length === 0) {
    return [cloneLocalChunk(GENERAL_OPD_SAFETY_GUIDELINE, ayushMode ? 0.15 : 0.1)];
  }

  const highestScore = ranked[0].score;
  return ranked.map(({ indexed, score }) => cloneLocalChunk(
    indexed.entry,
    Math.round((score / Math.max(highestScore, 1)) * 1000) / 1000
  ));
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function firstValue(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function asStringList(value: unknown): string[] {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === "string") return item.trim();
        const object = asRecord(item);
        const text = firstValue(object, ["text", "question", "description", "value", "name"]);
        return typeof text === "string" ? text.trim() : "";
      })
      .filter(Boolean);
  }
  if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
  return [];
}

function asICD10Mappings(value: unknown): ICD10Mapping[] {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    return parsed
      .map((item): ICD10Mapping | null => {
        if (typeof item === "string") {
          const [code, ...description] = item.split(/\s+[----]\s+|:\s*/);
          return code?.trim()
            ? { code: code.trim(), description: description.join(" --- ").trim() || code.trim() }
            : null;
        }
        const object = asRecord(item);
        const code = firstValue(object, ["code", "icd10", "icd10Code", "icd_code"]);
        const description = firstValue(object, ["description", "label", "name", "text"]);
        return typeof code === "string" && code.trim()
          ? { code: code.trim(), description: typeof description === "string" && description.trim() ? description.trim() : code.trim() }
          : null;
      })
      .filter((mapping): mapping is ICD10Mapping => mapping !== null);
  }

  const object = asRecord(parsed);
  return Object.entries(object)
    .map(([code, description]) => ({
      code: code.trim(),
      description: typeof description === "string" ? description.trim() : code.trim(),
    }))
    .filter((mapping) => Boolean(mapping.code));
}

function mapSupabaseRow(value: unknown): ClinicalGuidelineChunk | null {
  const row = asRecord(value);
  const metadata = asRecord(firstValue(row, ["metadata", "meta"]));
  const merged: UnknownRecord = { ...metadata, ...row };
  const idValue = firstValue(merged, ["id", "guideline_id", "chunk_id"]);
  const titleValue = firstValue(merged, ["title", "name", "heading"]);
  const clusterValue = firstValue(merged, ["symptomCluster", "symptom_cluster", "cluster", "category"]);
  const id = typeof idValue === "string" && idValue.trim() ? idValue.trim() : "supabase-clinical-guideline";
  const title = typeof titleValue === "string" && titleValue.trim()
    ? titleValue.trim()
    : typeof clusterValue === "string" && clusterValue.trim() ? clusterValue.trim() : id;

  const mandatoryFollowUpQuestions = asStringList(firstValue(merged, [
    "mandatoryFollowUpQuestions",
    "mandatory_follow_up_questions",
    "follow_up_questions",
    "mandatory_questions",
  ]));
  const redFlagSymptoms = asStringList(firstValue(merged, [
    "redFlagSymptoms",
    "red_flag_symptoms",
    "red_flags",
  ]));
  const ayushCorrelates = asStringList(firstValue(merged, [
    "ayushCorrelates",
    "ayush_correlates",
    "ayush_context",
  ]));
  const icd10Mappings = asICD10Mappings(firstValue(merged, [
    "icd10Mappings",
    "icd10_mappings",
    "icd10",
    "icd_codes",
  ]));
  const sourceValue = firstValue(merged, ["source", "source_name", "citation"]);
  const scoreValue = firstValue(merged, ["score", "similarity", "rank"]);
  const score = typeof scoreValue === "number" && Number.isFinite(scoreValue) ? scoreValue : undefined;

  // A row without the structured protocol fields cannot safely guide the
  // interview/report. Treat it as an RPC schema mismatch and use local data.
  if (
    mandatoryFollowUpQuestions.length === 0 &&
    redFlagSymptoms.length === 0 &&
    icd10Mappings.length === 0
  ) {
    return null;
  }

  return {
    id,
    symptomCluster: typeof clusterValue === "string" && clusterValue.trim() ? clusterValue.trim() : "clinical_guideline",
    title,
    keywords: [],
    mandatoryFollowUpQuestions,
    redFlagSymptoms,
    ayushCorrelates,
    icd10Mappings,
    source: typeof sourceValue === "string" && sourceValue.trim() ? sourceValue.trim() : "Supabase clinical guideline index",
    score,
    retrievalMethod: "supabase",
  };
}

function supabaseConfig(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

async function retrieveFromSupabase(
  chiefComplaintEnglish: string,
  ayushMode: boolean
): Promise<ClinicalGuidelineChunk[] | null> {
  const config = supabaseConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/match_clinical_guidelines`, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_text: chiefComplaintEnglish.trim(),
        match_count: MAX_RESULTS,
        ayush_mode: ayushMode,
      }),
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[RAG] Supabase clinical RPC returned HTTP ${response.status}; using local protocols.`);
      return null;
    }

    const payload = await response.json() as unknown;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(asRecord(payload).data) ? asRecord(payload).data as unknown[] : [];
    const chunks = rows
      .map(mapSupabaseRow)
      .filter((chunk): chunk is ClinicalGuidelineChunk => chunk !== null)
      .slice(0, MAX_RESULTS);

    return chunks.length > 0 ? chunks : null;
  } catch (error) {
    console.warn("[RAG] Supabase clinical RPC unavailable; using local protocols:", error);
    return null;
  }
}

/**
 * Retrieve protocol context for an English chief complaint.
 *
 * Supabase is attempted only when both server-side credentials exist. Any
 * timeout, schema mismatch, or empty result falls back to the local indexed
 * protocols so interview/report generation never waits on RAG availability.
 */
export async function retrieveClinicalContext(
  chiefComplaintEnglish: string,
  ayushMode: boolean
): Promise<ClinicalGuidelineChunk[]> {
  const remoteChunks = await retrieveFromSupabase(chiefComplaintEnglish, ayushMode);
  return remoteChunks ?? retrieveLocalClinicalContext(chiefComplaintEnglish, ayushMode);
}
