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
  | "medications_allergies"
  | "ayush_prakriti";

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

  if (category === "hpi" || category === "symptom_duration" || category === "symptom_modifiers") {
    return "hpi_opqrst";
  }
  if (category === "review_of_systems" || category === "associated") {
    return "associated_symptoms";
  }
  if (
    category === "drug_allergy" ||
    category === "allergies" ||
    category === "medicines_taken"
  ) {
    return "medications_allergies";
  }

  const validCategories: InterviewCategory[] = [
    "chief_complaint",
    "hpi_opqrst",
    "associated_symptoms",
    "past_history",
    "medications_allergies",
    "ayush_prakriti",
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

function messagesFromLegacy(value: unknown): InterviewTurn[] {
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
  // A previous mount bug could leave an empty active object behind while the
  // real answers still live under one of the legacy keys. Only treat the
  // active record as authoritative once it contains interview turns.
  if (active?.turns.length) {
    return active;
  }

  let migrated: ClinIQPatientSession | null = null;
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

  const session = migrated?.turns.length
    ? active
      ? {
          ...active,
          turns: migrated.turns,
          patient: active.patient ?? migrated.patient,
          summary: active.summary ?? migrated.summary,
          updatedAt: Date.now(),
        }
      : migrated
    : active ?? createEmptySession();
  writeSession(storage, session);

  for (const key of LEGACY_SESSION_KEYS) {
    storage.removeItem(key);
  }

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
