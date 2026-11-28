import { NextRequest, NextResponse } from "next/server";

import { CLINIQ_MODELS, groqChatWithFallback } from "@/lib/groq";
import type {
  ClinIQClinicalReport,
  InterviewTurn,
} from "@/lib/sessionStore";
import { retrieveClinicalContext } from "@/lib/rag/clinicalRetriever";
import { singleFlight } from "@/lib/singleflight";

export const runtime = "nodejs";

export interface ReportRequest {
  sessionId?: string;
  patientName?: string;
  patientAge?: string | number;
  patientGender?: string;
  language?: string;
  ayushMode?: boolean;
  interviewTurns?: Array<Partial<InterviewTurn>>;
  scannedDocuments?: Array<Record<string, unknown>>;
  chiefComplaintEnglish?: string;
}

const LOCALIZED_PATIENT_SUMMARY: Record<string, string> = {
  en: "Your health information has been organized for the doctor.",
  hi: "आपकी स्वास्थ्य जानकारी डॉक्टर के लिए व्यवस्थित कर दी गई है।",
  bn: "আপনার স্বাস্থ্য তথ্য ডাক্তারের জন্য গুছিয়ে রাখা হয়েছে।",
  ta: "உங்கள் சுகாதாரத் தகவல் மருத்துவருக்காகத் தொகுக்கப்பட்டுள்ளது.",
  te: "మీ ఆరోగ్య సమాచారం డాక్టర్ కోసం సిద్ధం చేయబడింది.",
  mr: "तुमची आरोग्य माहिती डॉक्टरांसाठी व्यवस्थित केली आहे.",
  gu: "તમારી આરોગ્ય માહિતી ડૉક્ટર માટે ગોઠવવામાં આવી છે.",
  kn: "ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ವೈದ್ಯರಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.",
  ml: "നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങൾ ഡോക്ടർക്കായി ക്രമീകരിച്ചിരിക്കുന്നു.",
  pa: "ਤੁਹਾਡੀ ਸਿਹਤ ਜਾਣਕਾਰੀ ਡਾਕਟਰ ਲਈ ਤਿਆਰ ਕੀਤੀ ਗਈ ਹੈ।",
  ur: "آپ کی صحت کی معلومات ڈاکٹر کے لیے ترتیب دے دی گئی ہیں۔",
};

function asText(value: unknown, fallback = "Not reported"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function optionalText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getChiefComplaintEnglish(
  turns: Array<Partial<InterviewTurn>>,
  explicitChiefComplaint?: string
): string {
  if (optionalText(explicitChiefComplaint)) return optionalText(explicitChiefComplaint);
  const chiefComplaintTurn = turns.find((turn) => turn.category === "chief_complaint");
  if (!chiefComplaintTurn) return "";
  return optionalText(chiefComplaintTurn.answer)
    || optionalText(chiefComplaintTurn.questionEnglish)
    || optionalText(chiefComplaintTurn.questionLocalized);
}

async function callGeminiForReport(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(55_000),
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8_000, responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const object = item as Record<string, unknown>;
          const code = typeof object.code === "string" ? object.code.trim() : "";
          const description = typeof object.description === "string"
            ? object.description.trim()
            : typeof object.name === "string" ? object.name.trim() : "";
          return code && description ? `${code} -- ${description}` : code || description;
        }
        return "";
      })
      .filter(Boolean);
  }

  const text = asText(value, "");
  return text ? [text] : [];
}

function stripMarkdownFences(raw: string): string {
  const withoutFences = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");

  return start >= 0 && end > start
    ? withoutFences.slice(start, end + 1)
    : withoutFences;
}

function normalizeReport(
  candidate: Record<string, unknown>,
  language: string
): ClinIQClinicalReport {
  return {
    chiefComplaint: asText(candidate.chiefComplaint),
    historyOfPresentIllness: asText(candidate.historyOfPresentIllness),
    pastMedicalHistory: asText(candidate.pastMedicalHistory),
    medications: asStringList(candidate.medications),
    allergies: asStringList(candidate.allergies),
    familyAndSocialHistory: asText(candidate.familyAndSocialHistory),
    reviewOfSystems: asText(candidate.reviewOfSystems),
    keyLabFindings: asStringList(candidate.keyLabFindings),
    redFlags: asStringList(candidate.redFlags),
    differentialConsiderations: asStringList(candidate.differentialConsiderations),
    icd10Suggestions: asStringList(candidate.icd10Suggestions),
    patientSummaryLocalized: asText(
      candidate.patientSummaryLocalized,
      LOCALIZED_PATIENT_SUMMARY[language] ?? LOCALIZED_PATIENT_SUMMARY.en
    ),
  };
}

export async function POST(req: NextRequest) {
  // Guard: both LLM keys absent → 503 so the UI can show a friendly message
  // instead of an unhandled internal error. If even one key is set we proceed.
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Report generation is unavailable: no AI API key is configured. Set GROQ_API_KEY or GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as ReportRequest;
    const interviewTurns = Array.isArray(body.interviewTurns) ? body.interviewTurns : [];
    const scannedDocuments = Array.isArray(body.scannedDocuments) ? body.scannedDocuments : [];

    if (interviewTurns.length === 0 && scannedDocuments.length === 0) {
      return NextResponse.json({ error: "NO_PATIENT_DATA" }, { status: 400 });
    }

    // Deduplicate concurrent report requests for the same session via flight-shield.
    const sfKey = `report:${body.sessionId ?? "anon"}:${interviewTurns.length}`;
    const result = await singleFlight(sfKey, async () => {

    const language = body.language ?? "en";
    const chiefComplaintEnglish = getChiefComplaintEnglish(
      interviewTurns,
      body.chiefComplaintEnglish
    );
    const clinicalContext = await retrieveClinicalContext(
      chiefComplaintEnglish,
      Boolean(body.ayushMode)
    );
    const ragRedFlagSymptoms = uniqueStrings(
      clinicalContext.flatMap((chunk) => chunk.redFlagSymptoms)
    );
    const ragICD10Mappings = clinicalContext.flatMap((chunk) => chunk.icd10Mappings);
    const uniqueRagICD10Mappings = ragICD10Mappings.filter((mapping, index, mappings) =>
      mappings.findIndex((candidate) => candidate.code === mapping.code) === index
    );
    const ragProtocolContext = `

INDIAN CLINICAL PROTOCOL CONTEXT (retrieved by ClinIQ Hybrid Clinical RAG):
- Relevant red-flag symptoms to actively look for in the supplied history/documents:
${ragRedFlagSymptoms.map((symptom) => `  - ${symptom}`).join("\n") || "  - None specifically retrieved; use the general safety rules."}
- Verified ICD-10 suggestions to consider only when supported by the patient data:
${uniqueRagICD10Mappings.map((mapping) => `  - ${mapping.code} -- ${mapping.description}`).join("\n") || "  - None specifically mapped."}
- Use this as a protocol checklist. Do not convert a red flag or an ICD-10 suggestion into a confirmed diagnosis without supporting patient data.
`;
    const patientDetails = {
      sessionId: body.sessionId ?? "unknown",
      patientName: body.patientName ?? "Not provided",
      patientAge: body.patientAge ?? "Not provided",
      patientGender: body.patientGender ?? "Not provided",
      language,
      ayushMode: Boolean(body.ayushMode),
    };

    const systemPrompt = `You are ClinIQ's physician-facing clinical documentation engine.
Generate a concise, structured SOAP-style pre-consultation note from the supplied patient interview and scanned OCR data.

INTERVIEW TURN CATEGORY GUIDE (use to map each turn to the correct SOAP section):
- chief_complaint -> chiefComplaint
- hpi_opqrst, symptom_duration, symptom_modifiers -> historyOfPresentIllness (onset, quality, radiation, severity, timing, modifiers)
- associated_symptoms, review_of_systems -> reviewOfSystems
- past_history, past_surgeries -> pastMedicalHistory
- medications_allergies, drug_allergy, allergies, medicines_taken -> medications and allergies lists
- habits (smoking, alcohol, tobacco, diet, exercise) -> familyAndSocialHistory social section
- family_history, family_disease_history -> familyAndSocialHistory family section
- personal_history -> familyAndSocialHistory personal/social section
- ayush_prakriti, ayush_vikriti, ayush_agni, ayush_koshtha, ayush_ahara_vihara, ayush_nidana,
  ayush_samprapti, ayush_sara, ayush_samhanana, ayush_satmya, ayush_pramana, ayush_sattva,
  ayush_ahara_shakti, ayush_vyayama_shakti, ayush_vaya -> incorporate into relevant clinical sections when AYUSH mode is enabled

LANGUAGE AND SAFETY RULES:
- The physician-facing fields chiefComplaint, historyOfPresentIllness, pastMedicalHistory, medications, allergies, familyAndSocialHistory, reviewOfSystems, keyLabFindings, redFlags, differentialConsiderations, and icd10Suggestions MUST be written in professional medical English.
- Do not copy Hindi, Bengali, Tamil, Telugu, or any other patient-language text into those physician-facing fields. Translate patient answers into professional medical English.
- patientSummaryLocalized MUST be written only in the patient's selected language (${language}). It is shown to the patient for DPDP Act 2023 consent verification.
- Never invent symptoms, examination findings, lab values, diagnoses, medications, allergies, or red flags. Use "Not reported" for missing narrative data and [] for missing list data.
- Differential considerations and ICD-10 suggestions are clinical aids for physician review, not definitive diagnoses.
- AYUSH mode is ${patientDetails.ayushMode ? "enabled" : "disabled"}; include relevant AYUSH information in the appropriate English clinical sections when it is present in the source.
${ragProtocolContext}

Return JSON only with exactly this shape:
{
  "chiefComplaint": "professional medical English",
  "historyOfPresentIllness": "professional medical English SOAP subjective history",
  "pastMedicalHistory": "professional medical English",
  "medications": ["professional medical English medication entries"],
  "allergies": ["professional medical English allergy entries"],
  "familyAndSocialHistory": "professional medical English",
  "reviewOfSystems": "professional medical English",
  "keyLabFindings": ["professional medical English findings from OCR documents"],
  "redFlags": ["professional medical English urgent findings, or empty array"],
  "differentialConsiderations": ["professional medical English physician considerations"],
  "icd10Suggestions": ["ICD-10 code -- professional medical description"],
  "patientSummaryLocalized": "short consent-verification summary in the selected patient language"
}`;

    const sourcePrompt = `PATIENT DETAILS:
${JSON.stringify(patientDetails)}

INTERVIEW TURNS:
${JSON.stringify(interviewTurns).slice(0, 10_000)}

SCANNED OCR DOCUMENTS:
${JSON.stringify(scannedDocuments).slice(0, 15_000)}`;

    let raw: string;
    try {
      const completion = await groqChatWithFallback({
        model: CLINIQ_MODELS.INTERVIEW_FAST,
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4_096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: sourcePrompt },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? "";
      if (!raw.trim()) throw new Error("EMPTY_RESPONSE");
    } catch {
      // Groq failed — fall back to Gemini REST
      const geminiRaw = await callGeminiForReport(systemPrompt + "\n\nUSER:\n" + sourcePrompt);
      if (!geminiRaw) throw new Error("REPORT_GENERATION_FAILED");
      raw = geminiRaw;
    }
    if (!raw.trim()) {
      throw new Error("REPORT_GENERATION_FAILED");
    }

    const parsed = JSON.parse(stripMarkdownFences(raw)) as unknown;
    const report = normalizeReport(
      parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {},
      language
    );

    return {
      report,
      metadata: {
        ragGrounded: true,
        retrievalMethod: [...new Set(clinicalContext.map((chunk) => chunk.retrievalMethod ?? "local"))],
        guidelineChunkIds: clinicalContext.map((chunk) => chunk.id),
      },
    };
    }); // end singleFlight

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/report] generation failed:", error);
    return NextResponse.json({ error: "REPORT_GENERATION_FAILED" }, { status: 502 });
  }
}
