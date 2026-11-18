import { NextRequest, NextResponse } from "next/server";
import { CLINIQ_MODELS, groqClient } from "@/lib/groq";
import type {
  InterviewCategory,
  InterviewInputType,
  InterviewTurn,
} from "@/lib/sessionStore";
import { retrieveClinicalContext } from "@/lib/rag/clinicalRetriever";
import { singleFlight } from "@/lib/singleflight";

export const runtime = "nodejs";

const BASE_CLINICAL_SLOTS: InterviewCategory[] = [
  "chief_complaint",
  "hpi_opqrst",
  "associated_symptoms",
  "past_history",
  "medications_allergies",
];

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi",
  en: "English",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  or: "Odia",
  pa: "Punjabi",
  as: "Assamese",
  ur: "Urdu",
  sa: "Sanskrit",
  mai: "Maithili",
  ne: "Nepali",
  kok: "Konkani",
  doi: "Dogri",
  mni: "Manipuri",
  brx: "Bodo",
  sat: "Santali",
  ks: "Kashmiri",
  sd: "Sindhi",
};

const DEFAULT_INPUT_TYPES: Record<InterviewCategory, InterviewInputType> = {
  chief_complaint: "free_text",
  hpi_opqrst: "free_text",
  associated_symptoms: "multi_select",
  past_history: "multi_select",
  past_surgeries: "free_text",
  medications_allergies: "free_text",
  habits: "free_text",
  family_history: "free_text",
  family_disease_history: "multi_select",
  personal_history: "free_text",
  review_of_systems: "multi_select",
  ayush_prakriti: "single_select",
  ayush_vikriti: "free_text",
  ayush_agni: "single_select",
  ayush_koshtha: "single_select",
  ayush_ahara_vihara: "free_text",
  ayush_nidana: "free_text",
  ayush_samprapti: "free_text",
  ayush_sara: "single_select",
  ayush_samhanana: "single_select",
  ayush_satmya: "free_text",
  ayush_pramana: "free_text",
  ayush_sattva: "single_select",
  ayush_ahara_shakti: "single_select",
  ayush_vyayama_shakti: "single_select",
  ayush_vaya: "free_text",
};

const ALLOWED_INPUT_TYPES: InterviewInputType[] = [
  "single_select",
  "multi_select",
  "numeric_scale",
  "free_text",
];

const FALLBACK_QUESTIONS: Record<string, Partial<Record<InterviewCategory, string>>> = {
  en: {
    chief_complaint: "What is the main health problem you want help with today?",
    hpi_opqrst: "When did this problem start, and what does it feel like?",
    associated_symptoms: "What other symptoms are you having with this problem?",
    past_history: "Have you had any important illnesses or operations before?",
    medications_allergies: "What medicines do you take, and do you have any allergies?",
    ayush_prakriti: "Which description best matches your usual body and temperament?",
  },
  hi: {
    chief_complaint: "------ ------------ --------------- --------------------------- ------------------ ------------ ------?",
    hpi_opqrst: "------ ------------------ ------ ------------ --------- ------ ------------ --------------- ------------ ------?",
    associated_symptoms: "------ ------------------ ------ --------- ------------ ------ --------- ------ --------------- ---------?",
    past_history: "------------ ------------ --------- ------------ ------------------ ------ ------------------ --------- ------?",
    medications_allergies: "------ --------- ------ --------------- ------------ --------- ------ ------------ --------- ------------------ ------?",
    ayush_prakriti: "------------ ------------ ------ ------------------ ------ --------------- --------------- ------ --------- ------ ------?",
  },
  bn: {
    chief_complaint: "------ --------------- ------------------ --------------------------- ------------------ ------?",
    hpi_opqrst: "------ ------------------ --------- ------------ ------------------ --------- ------------ ------------------ ---------?",
    associated_symptoms: "------ --------------------- --------------- ------ ------ ------ ------------------ ---------?",
    past_history: "--------- ------ ------------ --------- ------------ ------ --------------------- ---------------------?",
    medications_allergies: "------------ --------- ------------ --------- --------- ------------ ------------------------------ --------- ------?",
    ayush_prakriti: "--------------- ------------ --- ------------------------ --------------- --------- ------------------------ ------------?",
  },
  ta: {
    chief_complaint: "--------------- ------------------ --------------------- ------------------------ ------------------------ ------------?",
    hpi_opqrst: "------------------ ------------------------ --------------------- ------------------------------, ------------------ ---------------------------------------?",
    associated_symptoms: "------------------ --------------------------------------- ------------ ------------ ------------------------------ ---------------?",
    past_history: "------------------ --------------------- --------------- ------------ ------------------ --------------- ------------------------ ---------------------------?",
    medications_allergies: "--------------------- ------------ ------------------------------ ------------------------------------------------------------------, --------------------- ------------------?",
    ayush_prakriti: "------------------ ------------ --------------------- ------------------------------ ------------ ------------------------ ------------------------------?",
  },
  te: {
    chief_complaint: "--- ------------ ------ ------------------ ------------------ --------------- ---------------?",
    hpi_opqrst: "--- --------------- --------------------- ------------------------, --------- ------------------------------------?",
    associated_symptoms: "--- --------------------- ------------ ------------ ------------ --- ------------------------ ---------------------?",
    past_history: "--------------- --------------- --------------- --------------------------- ------------ --------------------- ------------------------?",
    medications_allergies: "------------ --- ------------------ ------------------------------------, --------------- ------------------------ ---------------------?",
    ayush_prakriti: "------ --------------- --------------- --------------------------------- --- --------------- ------------------------------?",
  },
};

const FALLBACK_SUGGESTIONS: Record<string, Partial<Record<InterviewCategory, string[]>>> = {
  en: {
    chief_complaint: ["Pain", "Fever", "Cough", "Breathing difficulty"],
    hpi_opqrst: ["Today", "A few days ago", "A few weeks ago", "Not sure"],
    associated_symptoms: ["Nausea", "Dizziness", "Weakness", "None of these"],
    past_history: ["Diabetes", "High blood pressure", "Past surgery", "None"],
    medications_allergies: ["No medicines", "Daily medicines", "A medicine allergy", "Not sure"],
    ayush_prakriti: ["Vata", "Pitta", "Kapha", "Not sure"],
  },
  hi: {
    chief_complaint: ["------------", "---------------", "---------------", "------------ --------- ---------------"],
    hpi_opqrst: ["------ ------", "--------- --------- ------", "--------- ------------------ ------", "--------- ------------"],
    associated_symptoms: ["------ ---------------------", "---------------", "---------------------", "--------------- ------ --------- ------------"],
    past_history: ["------------------", "------------ ---------------------", "------------ ------------------", "--------- ------------"],
    medications_allergies: ["--------- --------- ------------", "------------ ------ ---------------", "--------- ------ ------------------", "--------- ------------"],
    ayush_prakriti: ["---------", "---------------", "------", "--------- ------------"],
  },
};

export interface InterviewRequest {
  lang?: string;
  language?: string;
  ayushMode?: boolean;
  mode?: "allopathic" | "ayush" | "combined";
  turns?: Array<Partial<InterviewTurn> & { stage?: string; text?: string; response?: string }>;
  answers?: Array<Partial<InterviewTurn> & { stage?: string; text?: string; response?: string }>;
  responses?: Array<Partial<InterviewTurn> & { stage?: string; text?: string; response?: string }>;
  coveredSlots?: InterviewCategory[];
  patientContext?: string;
  /** Session ID — used as dedup key for flight-shield SingleFlight */
  sessionId?: string;
  /** Optional normalized English chief complaint supplied by a trusted client. */
  chiefComplaintEnglish?: string;
}

export interface InterviewResponse {
  questionId: string;
  category: InterviewCategory;
  questionLocalized: string;
  questionEnglish: string;
  inputType: InterviewInputType;
  suggestedAnswers: [string, string, string, string];
  curatingStatusText: string;
  isInterviewComplete: boolean;
  progressPercentage: number;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getFallbackQuestion(lang: string, category: InterviewCategory): string {
  return FALLBACK_QUESTIONS[lang]?.[category]
    ?? FALLBACK_QUESTIONS.en[category]
    ?? "Please tell me more about your health.";
}

function getFallbackSuggestions(lang: string, category: InterviewCategory): string[] {
  return FALLBACK_SUGGESTIONS[lang]?.[category]
    ?? FALLBACK_SUGGESTIONS.en[category]
    ?? ["Yes", "No", "Not sure", "Something else"];
}

function getStatusText(lang: string): string {
  const status: Record<string, string> = {
    en: "Analysing your symptoms to prepare the next clinical question---",
    hi: "------------ --------------------- ------ ------------------------ ------------ ------------ ------------ --------------- ------------ ------ --------- ---------",
    bn: "--------------- ------------------ ------------------------ --------- ------------ ------------------ ------------ --------- ------------------",
    ta: "------------------ ------------------------------ --------------- ------------------ ------------------ ------------------ ---------------------------------------------------------",
    te: "------ --------------------------- --------------------------------- ------------------ ------------------ ------------------ ---------------------------------------",
  };
  return status[lang] ?? status.en;
}

function normalizeSuggestions(value: unknown, lang: string, category: InterviewCategory): [string, string, string, string] {
  const modelSuggestions = Array.isArray(value)
    ? value.map(asText).filter(Boolean)
    : [];
  const fallbacks = getFallbackSuggestions(lang, category);
  const suggestions = [...new Set([...modelSuggestions, ...fallbacks])].slice(0, 4);

  while (suggestions.length < 4) {
    suggestions.push(fallbacks[suggestions.length] ?? `Option ${suggestions.length + 1}`);
  }

  return suggestions as [string, string, string, string];
}

function getSlots(ayushMode: boolean): InterviewCategory[] {
  return ayushMode
    ? [...BASE_CLINICAL_SLOTS, "ayush_prakriti"]
    : BASE_CLINICAL_SLOTS;
}

function normalizeTurns(turns: InterviewRequest["turns"]): Array<{ category: InterviewCategory; answer: string }> {
  if (!Array.isArray(turns)) return [];

  return turns
    .map((turn) => ({
      category: (turn.category ?? turn.stage) as InterviewCategory,
      answer: asText(turn.answer ?? turn.response ?? turn.text),
    }))
    .filter((turn) => Boolean(turn.answer));
}

function getChiefComplaintEnglish(
  turns: InterviewRequest["turns"],
  explicitChiefComplaint?: string
): string {
  if (asText(explicitChiefComplaint)) return asText(explicitChiefComplaint);
  if (!Array.isArray(turns)) return "";

  const chiefComplaintTurn = turns.find((turn) =>
    (turn.category ?? turn.stage) === "chief_complaint"
  );
  if (!chiefComplaintTurn) return "";

  // The answer is the patient's chief complaint in the current flow. The
  // English question is retained as a final compatibility fallback for older
  // clients that sent only questionEnglish.
  return asText(
    chiefComplaintTurn.answer
      ?? chiefComplaintTurn.response
      ?? chiefComplaintTurn.text
      ?? chiefComplaintTurn.questionEnglish
  );
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function makeFallbackResponse(
  lang: string,
  category: InterviewCategory,
  questionId: string,
  progressPercentage: number,
  isInterviewComplete: boolean
): InterviewResponse {
  const question = isInterviewComplete
    ? (lang === "hi" ? "---------------------, ------------ --------------------- ------------------------ ------ ------ ------ ---------" : "Thank you, your information has been recorded.")
    : getFallbackQuestion(lang, category);

  return {
    questionId,
    category,
    questionLocalized: question,
    questionEnglish: isInterviewComplete
      ? "Thank you, your information has been recorded."
      : getFallbackQuestion("en", category),
    inputType: DEFAULT_INPUT_TYPES[category],
    suggestedAnswers: normalizeSuggestions(undefined, lang, category),
    curatingStatusText: getStatusText(lang),
    isInterviewComplete,
    progressPercentage,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InterviewRequest;
    const lang = body.lang ?? body.language ?? "hi";
    const ayushMode = body.ayushMode ?? (body.mode === "ayush" || body.mode === "combined");
    const slots = getSlots(Boolean(ayushMode));
    const rawTurns = body.turns ?? body.answers ?? body.responses;
    const turns = normalizeTurns(rawTurns);
    const covered = new Set<InterviewCategory>([
      ...turns.map((turn) => turn.category),
      ...(body.coveredSlots ?? []),
    ]);
    const nextIndex = slots.findIndex((slot) => !covered.has(slot));
    const isInterviewComplete = nextIndex === -1;
    const category = isInterviewComplete ? slots[slots.length - 1] : slots[nextIndex];
    const questionNumber = isInterviewComplete ? slots.length : nextIndex + 1;
    const progressPercentage = isInterviewComplete
      ? 100
      : Math.round((questionNumber / slots.length) * 100);
    const questionId = `q_${questionNumber}`;
    const languageName = LANGUAGE_NAMES[lang] ?? lang;

    if (isInterviewComplete) {
      return NextResponse.json(
        makeFallbackResponse(lang, category, questionId, progressPercentage, true)
      );
    }

    const priorAnswers = turns
      .map((turn) => `${turn.category}: ${turn.answer}`)
      .join("\n")
      .slice(-6_000);

    let clinicalContext = [] as Awaited<ReturnType<typeof retrieveClinicalContext>>;
    if (turns.length > 0) {
      const chiefComplaintEnglish = getChiefComplaintEnglish(
        rawTurns,
        body.chiefComplaintEnglish
      );
      clinicalContext = await retrieveClinicalContext(chiefComplaintEnglish, Boolean(ayushMode));
    }

    const mandatoryFollowUpQuestions = uniqueStrings(
      clinicalContext.flatMap((chunk) => chunk.mandatoryFollowUpQuestions)
    );
    const redFlagSymptoms = uniqueStrings(
      clinicalContext.flatMap((chunk) => chunk.redFlagSymptoms)
    );
    const ragSystemContext = clinicalContext.length > 0
      ? `

CLINICAL PROTOCOL CONTEXT (retrieved after the first chief-complaint turn):
- Use these mandatory follow-up areas when asking the selected category question:
${mandatoryFollowUpQuestions.map((question) => `  - ${question}`).join("\n")}
- Screen for these red-flag symptoms when they are relevant to the selected category:
${redFlagSymptoms.map((symptom) => `  - ${symptom}`).join("\n")}
- This protocol context is a safety checklist, not a diagnosis. Do not state a diagnosis or prescribe treatment.
`
      : "";

    const prompt = `Create the next ClinIQ pre-consultation interview question.

The server has already selected the only category you may use: ${category}.
The patient language is ${languageName} (ISO code: ${lang}).
This is question ${questionNumber} of ${slots.length}.

Previously recorded answers:
${priorAnswers || "No answers yet; warmly ask the patient to describe the main problem."}

${body.patientContext ? `Additional patient context:\n${body.patientContext.slice(0, 2000)}` : ""}

Return one JSON object with exactly these fields:
{
  "questionId": "${questionId}",
  "category": "${category}",
  "questionLocalized": "one short question in the patient's selected language",
  "questionEnglish": "the same question in concise medical English",
  "inputType": "single_select | multi_select | numeric_scale | free_text",
  "suggestedAnswers": ["exactly 4 short context-locked answer choices in the patient's language"],
  "curatingStatusText": "a short localized status message explaining that symptom analysis is in progress",
  "isInterviewComplete": false,
  "progressPercentage": ${progressPercentage}
}

Rules:
- Keep category, questionId, isInterviewComplete, and progressPercentage exactly as supplied.
- Ask only about ${category}; do not jump to another clinical slot.
- Use the patient's selected language for questionLocalized, suggestedAnswers, and curatingStatusText.
- Make all four suggestions specific to the question and the patient's prior answers. Do not use generic filler.
- Never diagnose, prescribe, or invent symptoms.
- Return JSON only, with no markdown fences or extra text.`;

    let modelResponse: unknown;
    try {
      // Deduplicate concurrent interview requests for same session+category
      // so rapid taps don't fire multiple parallel LLM calls.
      const sfKey = `interview:${body.sessionId ?? "anon"}:${category}:${turns.length}`;
      const content = await singleFlight(sfKey, async () => {
        const completion = await groqClient.chat.completions.create({
          model: CLINIQ_MODELS.INTERVIEW_FAST,
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: `You are a precise multilingual clinical intake question curator. Follow the requested JSON schema exactly. Ground relevant follow-up questions in the Indian clinical safety protocol context below while preserving the server-selected category.${ragSystemContext}`,
            },
            { role: "user", content: prompt },
          ],
        });
        return completion.choices[0]?.message?.content ?? null;
      });
      modelResponse = typeof content === "string" ? JSON.parse(content) : null;
    } catch (error) {
      console.warn("[api/interview] Groq JSON generation failed; using deterministic response:", error);
      return NextResponse.json(
        makeFallbackResponse(lang, category, questionId, progressPercentage, false)
      );
    }

    const candidate = modelResponse && typeof modelResponse === "object"
      ? modelResponse as Record<string, unknown>
      : {};
    const modelInputType = asText(candidate.inputType) as InterviewInputType;
    const inputType = ALLOWED_INPUT_TYPES.includes(modelInputType)
      ? modelInputType
      : DEFAULT_INPUT_TYPES[category];

    const response: InterviewResponse = {
      questionId,
      category,
      questionLocalized: asText(candidate.questionLocalized) || getFallbackQuestion(lang, category),
      questionEnglish: asText(candidate.questionEnglish) || getFallbackQuestion("en", category),
      inputType,
      suggestedAnswers: normalizeSuggestions(candidate.suggestedAnswers, lang, category),
      curatingStatusText: asText(candidate.curatingStatusText) || getStatusText(lang),
      isInterviewComplete: false,
      progressPercentage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[api/interview] request failed:", error);
    return NextResponse.json({ error: "Interview question generation failed" }, { status: 500 });
  }
}
