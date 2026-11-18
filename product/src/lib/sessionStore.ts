export const ACTIVE_SESSION_KEY = "cliniq_active_patient_session_v1";
export const SESSION_STORAGE_KEY = ACTIVE_SESSION_KEY;

const LEGACY_SESSION_KEYS = [
  "medikiosk_session",
  "medikiosk_responses",
  "interviewResponses",
] as const;

export type InterviewCategory =
  | "chief_complaint"
  | "hpi_opqrst"
  | "associated_symptoms"
  | "past_history"
  | "past_surgeries"
  | "medications_allergies"
  | "habits"
  | "family_history"
  | "family_disease_history"
  | "personal_history"
  | "review_of_systems"
  | "ayush_prakriti"
  | "ayush_vikriti"
  | "ayush_agni"
  | "ayush_koshtha"
  | "ayush_ahara_vihara"
  | "ayush_nidana"
  | "ayush_samprapti"
  | "ayush_sara"
  | "ayush_samhanana"
  | "ayush_satmya"
  | "ayush_pramana"
  | "ayush_sattva"
  | "ayush_ahara_shakti"
  | "ayush_vyayama_shakti"
  | "ayush_vaya";

export type InterviewInputType =
  | "single_select"
  | "multi_select"
  | "numeric_scale"
  | "free_text";

export interface InterviewTurn {
  questionId: string;
  category: InterviewCategory;
  questionLocalized?: string;
  questionEnglish?: string;
  answer: string;
  inputType?: InterviewInputType;
  suggestedAnswers?: string[];
  timestamp?: number;
}

export interface ClinIQClinicalReport {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string[];
  allergies: string[];
  familyAndSocialHistory: string;
  reviewOfSystems: string;
  keyLabFindings: string[];
  redFlags: string[];
  differentialConsiderations: string[];
  icd10Suggestions: string[];
  patientSummaryLocalized: string;
}

export interface ClinIQPatientSession {
  sessionId: string;
  language: string;
  mode: "allopathic" | "ayush";
  ayushMode: boolean;
  turns: InterviewTurn[];
  patient?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  scannedDocuments?: Array<Record<string, unknown>>;
  generatedReport?: ClinIQClinicalReport;
  startedAt: number;
  updatedAt: number;
  /** B2B intake routing - set from ?clinicId= URL param or defaults to "pilot-clinic-01" */
  clinicId?: string;
  /** Token number assigned to this patient in the clinic queue */
  tokenNumber?: number;
  /** Patient name captured during registration */
  patientName?: string;
  /** Age captured during registration */
  patientAge?: string;
  /** Gender captured during registration */
  patientGender?: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cliniq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptySession(): ClinIQPatientSession {
  const now = Date.now();
  return {
    sessionId: createSessionId(),
    language: "hi",
    mode: "allopathic",
    ayushMode: false,
    turns: [],
    startedAt: now,
    updatedAt: now,
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function normalizeCategory(value: unknown): InterviewCategory {
  const category = asString(value);

  // Allopathic aliases
  if (category === "hpi" || category === "symptom_duration" || category === "symptom_modifiers") {
    return "hpi_opqrst";
  }
  if (category === "associated" || category === "associated_symptoms") {
    return "associated_symptoms";
  }
  if (
    category === "drug_allergy" ||
    category === "allergies" ||
    category === "medicines_taken"
  ) {
    return "medications_allergies";
  }

  // All valid InterviewCategory values — covers every Stage used by history/page.tsx
  const validCategories: InterviewCategory[] = [
    "chief_complaint",
    "hpi_opqrst",
    "associated_symptoms",
    "past_history",
    "past_surgeries",
    "medications_allergies",
    "habits",
    "family_history",
    "family_disease_history",
    "personal_history",
    "review_of_systems",
    "ayush_prakriti",
    "ayush_vikriti",
    "ayush_agni",
    "ayush_koshtha",
    "ayush_ahara_vihara",
    "ayush_nidana",
    "ayush_samprapti",
    "ayush_sara",
    "ayush_samhanana",
    "ayush_satmya",
    "ayush_pramana",
    "ayush_sattva",
    "ayush_ahara_shakti",
    "ayush_vyayama_shakti",
    "ayush_vaya",
  ];

  return validCategories.includes(category as InterviewCategory)
    ? (category as InterviewCategory)
    : "chief_complaint";
}


function normalizeTurn(value: unknown, index: number): InterviewTurn | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const role = asString(item.role);
  const answer = asString(
    item.answer ?? item.response ?? (role === "patient" ? item.text : undefined)
  ).trim();

  if (!answer) return null;

  const category = normalizeCategory(item.category ?? item.stage);
  const question = asString(item.questionLocalized ?? item.question ?? item.prompt);

  return {
    questionId: asString(item.questionId, `q_${index + 1}`),
    category,
    questionLocalized: question,
    questionEnglish: asString(item.questionEnglish, question),
    answer,
    inputType: item.inputType as InterviewInputType | undefined,
    suggestedAnswers: Array.isArray(item.suggestedAnswers)
      ? item.suggestedAnswers.filter((answer): answer is string => typeof answer === "string")
      : undefined,
    timestamp: typeof item.timestamp === "number" ? item.timestamp : Date.now(),
  };
}

function turnsFromLegacy(value: unknown): InterviewTurn[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const container = value as Record<string, unknown>;
    return turnsFromLegacy(container.turns ?? container.responses ?? container.answers);
  }
  if (!Array.isArray(value)) return [];

  const turns: InterviewTurn[] = [];
  for (const item of value) {
    const turn = normalizeTurn(item, turns.length);
    if (turn) turns.push(turn);
  }
  return turns;
}

export function messagesFromLegacy(value: unknown): InterviewTurn[] {
  if (!Array.isArray(value)) return [];

  const turns: InterviewTurn[] = [];
  let pendingQuestion: Record<string, unknown> | null = null;

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const message = item as Record<string, unknown>;
    const role = asString(message.role);

    if (role === "ai" || role === "assistant") {
      pendingQuestion = message;
      continue;
    }

    if (role === "patient" || role === "user") {
      const turn = normalizeTurn(
        {
          ...pendingQuestion,
          ...message,
          answer: message.text ?? message.answer,
          questionLocalized: pendingQuestion?.text ?? pendingQuestion?.questionLocalized,
          questionEnglish: pendingQuestion?.questionEnglish,
        },
        turns.length
      );
      if (turn) turns.push(turn);
      pendingQuestion = null;
    }
  }

  return turns;
}

export function sessionTurnsToLegacyMessages(turns: InterviewTurn[]): Array<{
  role: "ai" | "patient";
  text: string;
  stage: string;
}> {
  return turns.flatMap((turn) => {
    const stage = turn.category === "hpi_opqrst"
      ? "hpi"
      : turn.category === "associated_symptoms"
        ? "review_of_systems"
        : turn.category === "medications_allergies"
          ? "drug_allergy"
          : turn.category;

    return [
      { role: "ai" as const, text: turn.questionLocalized ?? turn.questionEnglish ?? "", stage },
      { role: "patient" as const, text: turn.answer, stage },
    ];
  });
}

function normalizeSession(value: unknown): ClinIQPatientSession | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const turns = turnsFromLegacy(source.turns ?? source.interviewTurns ?? source.responses);
  const messages = messagesFromLegacy(source.messages);
  const mergedTurns = turns.length > 0 ? turns : messages;
  const mode = source.mode === "ayush" || source.ayushMode === true ? "ayush" : "allopathic";
  const now = Date.now();

  return {
    sessionId: asString(source.sessionId ?? source.id, createSessionId()),
    language: asString(source.language ?? source.lang, "hi"),
    mode,
    ayushMode: mode === "ayush",
    turns: mergedTurns,
    patient: source.patient && typeof source.patient === "object"
      ? source.patient as Record<string, unknown>
      : undefined,
    summary: source.summary && typeof source.summary === "object"
      ? source.summary as Record<string, unknown>
      : undefined,
    scannedDocuments: Array.isArray(source.scannedDocuments)
      ? source.scannedDocuments.filter(
          (document): document is Record<string, unknown> =>
            Boolean(document) && typeof document === "object"
        )
      : undefined,
    generatedReport: source.generatedReport && typeof source.generatedReport === "object"
      ? source.generatedReport as ClinIQClinicalReport
      : undefined,
    startedAt: typeof source.startedAt === "number" ? source.startedAt : now,
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : now,
    clinicId: typeof source.clinicId === "string" ? source.clinicId : undefined,
    tokenNumber: typeof source.tokenNumber === "number" ? source.tokenNumber : undefined,
    patientName: typeof source.patientName === "string" ? source.patientName : undefined,
    patientAge: typeof source.patientAge === "string" ? source.patientAge : undefined,
    patientGender: typeof source.patientGender === "string" ? source.patientGender : undefined,
  };
}

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(storage: Storage, session: ClinIQPatientSession): void {
  storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

function readOrMigrate(storage: Storage): ClinIQPatientSession {
  const active = normalizeSession(readJson(storage, ACTIVE_SESSION_KEY));
  let migrated: ClinIQPatientSession | null = null;

  // Check mk_history first if active has no turns
  if (!active?.turns.length) {
    const mkHistory = readJson(storage, "mk_history");
    if (mkHistory) {
      migrated = normalizeSession(mkHistory);
    }
  }

  // Check legacy session keys if still no turns
  if (!active?.turns.length && !migrated?.turns.length) {
    for (const key of LEGACY_SESSION_KEYS) {
      const value = readJson(storage, key);
      if (key === "medikiosk_session") {
        migrated = normalizeSession(value);
      } else {
        const turns = turnsFromLegacy(value);
        if (turns.length > 0) {
          migrated = normalizeSession({
            ...(migrated ?? {}),
            turns,
          });
        }
      }
      if (migrated?.turns.length) break;
    }
  }

  // Hydrate supplementary fields from individual sessionStorage keys if missing
  const patientRaw = readJson(storage, "mk_patient") as Record<string, unknown> | null;
  const docsRaw = readJson(storage, "mk_docs") as Array<Record<string, unknown>> | null;
  const langRaw = storage.getItem("mk_lang");
  const modeRaw = storage.getItem("mk_mode");
  const clinicId = storage.getItem("mk_clinic_id") ?? undefined;
  const tokenRaw = storage.getItem("mk_token_number");
  const tokenNumber = tokenRaw ? parseInt(tokenRaw, 10) : undefined;

  const turns = active?.turns?.length ? active.turns : (migrated?.turns ?? []);
  const patient = active?.patient ?? patientRaw ?? migrated?.patient;
  const summary = active?.summary ?? migrated?.summary;
  const scannedDocs = (active?.scannedDocuments && active.scannedDocuments.length > 0)
    ? active.scannedDocuments
    : (Array.isArray(docsRaw) && docsRaw.length > 0 ? docsRaw : migrated?.scannedDocuments);

  const session: ClinIQPatientSession = {
    sessionId: active?.sessionId ?? migrated?.sessionId ?? createSessionId(),
    language: active?.language || langRaw || migrated?.language || "hi",
    mode: (modeRaw === "ayush" || active?.mode === "ayush" || migrated?.mode === "ayush") ? "ayush" : "allopathic",
    ayushMode: modeRaw === "ayush" || active?.ayushMode || migrated?.ayushMode || false,
    turns,
    patient,
    summary,
    scannedDocuments: scannedDocs,
    generatedReport: active?.generatedReport ?? migrated?.generatedReport,
    startedAt: active?.startedAt ?? migrated?.startedAt ?? Date.now(),
    updatedAt: Date.now(),
    clinicId: active?.clinicId ?? clinicId,
    tokenNumber: active?.tokenNumber ?? tokenNumber,
    patientName: active?.patientName ?? (typeof patient?.name === "string" ? patient.name : undefined),
    patientAge: active?.patientAge ?? (patient && (patient.age || patient.patientAge) ? String(patient.age ?? patient.patientAge) : undefined),
    patientGender: active?.patientGender ?? (typeof patient?.gender === "string" ? patient.gender : undefined),
  };

  writeSession(storage, session);
  return session;
}

export const SessionStore = {
  getSession(): ClinIQPatientSession {
    const storage = getStorage();
    if (!storage) return createEmptySession();
    return readOrMigrate(storage);
  },

  appendInterviewTurn(turn: InterviewTurn): ClinIQPatientSession {
    const storage = getStorage();
    const current = storage ? readOrMigrate(storage) : createEmptySession();
    const next: ClinIQPatientSession = {
      ...current,
      turns: [...current.turns, { ...turn, timestamp: turn.timestamp ?? Date.now() }],
      updatedAt: Date.now(),
    };

    if (storage) writeSession(storage, next);
    return next;
  },

  updateSession(partial: Partial<ClinIQPatientSession>): ClinIQPatientSession {
    const storage = getStorage();
    const current = storage ? readOrMigrate(storage) : createEmptySession();
    const next: ClinIQPatientSession = {
      ...current,
      ...partial,
      turns: Array.isArray(partial.turns) ? partial.turns : current.turns,
      updatedAt: Date.now(),
    };

    if (storage) writeSession(storage, next);
    return next;
  },

  clearSession(): void {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(ACTIVE_SESSION_KEY);
    for (const key of LEGACY_SESSION_KEYS) {
      storage.removeItem(key);
    }
  },
};
