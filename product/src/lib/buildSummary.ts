// src/lib/buildSummary.ts
// Deterministic clinical history summary builder from conversation turns/messages.
// Used as fallback when LLM summary is unavailable, and for pre-consultation triage.

import type { StructuredSummary } from "@/app/api/history/chat/route";

export interface ChatSummaryMessage {
  role: "ai" | "patient";
  text: string;
  stage?: string;
}

export function buildSummaryFromMessages(messages: ChatSummaryMessage[]): StructuredSummary {
  const byStage = (stg: string): string => {
    const msgs = messages.filter((m) => m.role === "patient" && m.stage === stg);
    return msgs.map((m) => m.text).join("; ") || "Not reported";
  };

  const cc = byStage("chief_complaint");
  const hpi = byStage("hpi");
  const past = byStage("past_history");
  const drug = byStage("drug_allergy");
  const family = byStage("family_history");
  const personal = byStage("personal_history");
  const ros = byStage("review_of_systems");

  // AYUSH parameters
  const prakriti = byStage("ayush_prakriti");
  const vikriti = byStage("ayush_vikriti");
  const agni = byStage("ayush_agni");
  const koshtha = byStage("ayush_koshtha");
  const ahara = byStage("ayush_ahara_vihara");
  const nidana = byStage("ayush_nidana");
  const samprapti = byStage("ayush_samprapti");
  const sara = byStage("ayush_sara");
  const samhanana = byStage("ayush_samhanana");
  const satmya = byStage("ayush_satmya");
  const pramana = byStage("ayush_pramana");
  const sattva = byStage("ayush_sattva");
  const aharaShakti = byStage("ayush_ahara_shakti");
  const vyayamaShakti = byStage("ayush_vyayama_shakti");
  const vaya = byStage("ayush_vaya");

  const allText = messages.map((m) => m.text).join(" ").toLowerCase();
  const redFlags: string[] = [];

  // ------ EMERGENCY: Cardiac ------
  if (
    /chest pain|------------ --------- ------------|------------ --------- ------------|------------------ ---------|--------------- ------------------|--------------- ---------------|------------------ ---------------|--------------------- ------------------|------------ ------------|------------------------------|---------- ------ ------/.test(
      allText
    )
  ) {
    redFlags.push("---- EMERGENCY: Chest pain - possible cardiac event, urgent triage required");
  }
  if (/palpitation|---------------|------------------------|---------------------|------------/.test(allText)) {
    redFlags.push("------ Palpitations reported - cardiac evaluation recommended");
  }

  // ------ EMERGENCY: Stroke (FAST) ------
  if (
    /stroke|facial droop|face drooping|------------|---------------------------|------------------------|arm weakness|------------------|slurred speech|------------ ---------------------------|sudden headache|--------------- ---------------------|paralysis|---------------------/.test(
      allText
    )
  ) {
    redFlags.push("---- EMERGENCY: Stroke symptoms (FAST) - immediate neurological triage");
  }

  // ------ URGENT: Breathing ------
  if (
    /breathless|breath|dyspn[oe]a|------------ ---------------|------------------------------------------|--------------- ------------------------|------ ---------------|---------------------------------|wheezing|asthma attack/.test(
      allText
    )
  ) {
    redFlags.push("------ URGENT: Breathing difficulty - assess SpO2 and respiratory status");
  }

  // ------ EMERGENCY: Bleeding ------
  if (
    /blood|---------|bleeding|------------|---------------------|---------------|---------------------------|hematemesis|melena|hematuria/.test(
      allText
    )
  ) {
    redFlags.push("---- Bleeding reported - assess volume and urgency");
  }

  // ------ EMERGENCY: Consciousness ------
  if (
    /unconscious|seizure|convulsion|---------------|------------------|---------------------|---------------|---------------|fitting|fainting|---------------/.test(
      allText
    )
  ) {
    redFlags.push("---- EMERGENCY: Altered consciousness / seizure - immediate triage");
  }

  // ------ High fever ------
  if (
    /high fever|104|105|--------- ---------------|------------ ---------------------------|------------------------ ---------------|--------- ---------|--------------- ---------/.test(
      allText
    )
  ) {
    redFlags.push("------ High fever reported - assess for infection source and hydration");
  }

  // ------ Suicidal ideation ------
  if (/suicid|self.harm|---------------------------|--------- ------------ ------ ---------------|--------- ------------/.test(allText)) {
    redFlags.push("---- EMERGENCY: Self-harm risk - immediate psychiatric consultation");
  }

  // ------ Severe abdominal pain ------
  if (/severe.*abdomen|severe.*stomach|--------- --------- --------- ------------|------------------------ ---------------------------------/.test(allText)) {
    redFlags.push("------ Severe abdominal pain - assess for surgical emergency");
  }

  const hasAyush = [
    prakriti, vikriti, agni, koshtha, ahara, nidana, samprapti,
    sara, samhanana, satmya, pramana, sattva, aharaShakti, vyayamaShakti, vaya
  ].some((v) => v !== "Not reported");

  return {
    chiefComplaint: cc,
    hpi,
    pastHistory: past,
    drugAllergy: drug,
    familyHistory: family,
    personalHistory: personal,
    reviewOfSystems: ros,
    currentMedications: drug !== "Not reported" ? drug : "None reported",
    suggestedICD10: "",
    redFlags,
    ayushNote: hasAyush
      ? `Prakriti: ${prakriti}. Vikriti: ${vikriti}. Agni: ${agni}. Koshtha: ${koshtha}. Ahara-Vihara: ${ahara}. Nidana: ${nidana}. Samprapti: ${samprapti}.`
      : "",
    ...(hasAyush
      ? {
          prakriti,
          vikriti,
          agniType: agni,
          koshtha,
          aharaVihara: ahara,
          nidana,
          samprapti,
          sara,
          samhanana,
          satmya,
          pramana,
          sattva,
          aharaShakti,
          vyayamaShakti,
          vaya,
        }
      : {}),
  };
}
