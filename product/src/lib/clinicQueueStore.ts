// src/lib/clinicQueueStore.ts
// B2B clinic queue --- dual-writes to localStorage (cross-tab sync via storage events)
// and POSTs to /api/clinic/queue for server-side persistence.
// All reads are synchronous so the dashboard mounts instantly.

import type { ClinIQClinicalReport } from "./sessionStore";

// --------- Types ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export interface ClinicQueueEntry {
  /** Stable ID: `${clinicId}::${tokenNumber}` */
  id: string;
  clinicId: string;
  tokenNumber: number;
  /** Display token e.g. "A-014" */
  token: string;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  language: string;
  chiefComplaint: string;
  redFlags: string[];
  hasRedFlags: boolean;
  icd10Suggestions: string[];
  report?: ClinIQClinicalReport;
  intakeStartedAt: number;
  intakeCompletedAt: number;
  avgIntakeMins: number;
  status: "waiting" | "in_consultation" | "done";
  /** Cryptographic session ID for DPDP consent tracking */
  sessionId?: string;
}

export const CLINIC_QUEUE_LS_KEY = "cliniq_clinic_queue_v1";

// --------- Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function readQueue(storage: Storage): ClinicQueueEntry[] {
  try {
    const raw = storage.getItem(CLINIC_QUEUE_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClinicQueueEntry[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(storage: Storage, queue: ClinicQueueEntry[]): void {
  // Keep at most 200 entries --- drop oldest "done" entries first
  let trimmed = [...queue];
  while (trimmed.length > 200) {
    const doneIdx = trimmed.findIndex((e) => e.status === "done");
    if (doneIdx !== -1) trimmed.splice(doneIdx, 1);
    else trimmed.shift();
  }
  storage.setItem(CLINIC_QUEUE_LS_KEY, JSON.stringify(trimmed));
}

function buildToken(tokenNumber: number): string {
  const letter = String.fromCharCode(65 + Math.floor((tokenNumber - 1) / 99) % 26);
  const num = String(((tokenNumber - 1) % 99) + 1).padStart(3, "0");
  return `${letter}-${num}`;
}

/** POST to server without blocking --- fire and forget with single retry. */
async function persistToServer(entry: ClinicQueueEntry): Promise<void> {
  try {
    await fetch("/api/clinic/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    // Non-critical --- localStorage is source of truth for the dashboard
  }
}

// --------- Public API ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Called from report/page.tsx once the SOAP report has been generated.
 * Writes the entry synchronously to localStorage and async-persists to server.
 */
export function publishPatientToClinicQueue(params: {
  clinicId: string;
  tokenNumber: number;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  language: string;
  chiefComplaint: string;
  report: ClinIQClinicalReport;
  intakeStartedAt: number;
  sessionId?: string;
}): ClinicQueueEntry {
  const storage = getLocalStorage();
  const queue = storage ? readQueue(storage) : [];

  const id = `${params.clinicId}::${params.tokenNumber}`;
  const now = Date.now();
  const avgIntakeMins = Math.round((now - params.intakeStartedAt) / 60_000 * 10) / 10;

  const entry: ClinicQueueEntry = {
    id,
    clinicId: params.clinicId,
    tokenNumber: params.tokenNumber,
    token: buildToken(params.tokenNumber),
    patientName: params.patientName || "Patient",
    patientAge: params.patientAge,
    patientGender: params.patientGender,
    language: params.language,
    chiefComplaint: params.report.chiefComplaint || params.chiefComplaint,
    redFlags: params.report.redFlags ?? [],
    hasRedFlags: (params.report.redFlags ?? []).length > 0,
    icd10Suggestions: params.report.icd10Suggestions ?? [],
    report: params.report,
    intakeStartedAt: params.intakeStartedAt,
    intakeCompletedAt: now,
    avgIntakeMins,
    status: "waiting",
    sessionId: params.sessionId,
  };

  // Upsert by id
  const idx = queue.findIndex((e) => e.id === id);
  if (idx !== -1) queue[idx] = entry;
  else queue.push(entry);

  if (storage) writeQueue(storage, queue);
  void persistToServer(entry);

  return entry;
}

/** Read the full queue for a clinic synchronously from localStorage. */
export function getClinicQueue(clinicId: string): ClinicQueueEntry[] {
  const storage = getLocalStorage();
  if (!storage) return [];
  return readQueue(storage).filter((e) => e.clinicId === clinicId);
}

/** Update a patient's status (waiting --- in_consultation --- done) synchronously. */
export function updateClinicQueueStatus(
  id: string,
  status: ClinicQueueEntry["status"]
): void {
  const storage = getLocalStorage();
  if (!storage) return;
  const queue = readQueue(storage);
  const idx = queue.findIndex((e) => e.id === id);
  if (idx !== -1) {
    queue[idx].status = status;
    writeQueue(storage, queue);
  }
}

/**
 * Subscribe to cross-tab queue changes via the storage event.
 * Returns an unsubscribe function.
 */
export function subscribeToClinicQueue(
  clinicId: string,
  callback: (queue: ClinicQueueEntry[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key === CLINIC_QUEUE_LS_KEY) {
      callback(getClinicQueue(clinicId));
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * Parse intake URL params from the current page URL.
 * Safe to call during SSR --- returns defaults when window is unavailable.
 */
export function parseIntakeParams(): { clinicId: string; tokenNumber: number } {
  if (typeof window === "undefined") {
    return { clinicId: "pilot-clinic-01", tokenNumber: 1 };
  }
  const params = new URLSearchParams(window.location.search);
  const clinicId = params.get("clinicId")?.trim() || "pilot-clinic-01";
  const tokenRaw = parseInt(params.get("token") ?? params.get("tokenNumber") ?? "0", 10);
  const tokenNumber = Number.isFinite(tokenRaw) && tokenRaw > 0 ? tokenRaw : Date.now() % 999 + 1;
  return { clinicId, tokenNumber };
}
