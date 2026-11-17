import { describe, it, expect } from "vitest";
import { buildSummaryFromMessages, type ChatSummaryMessage } from "@/lib/buildSummary";

describe("buildSummaryFromMessages", () => {
  it("extracts patient messages by stage", () => {
    const messages: ChatSummaryMessage[] = [
      { role: "ai", text: "What brings you in today?" },
      { role: "patient", text: "Severe abdominal pain since yesterday", stage: "chief_complaint" },
      { role: "ai", text: "How long has this been going on?" },
      { role: "patient", text: "Started after dinner, getting sharper", stage: "hpi" },
      { role: "ai", text: "Any past conditions?" },
      { role: "patient", text: "Type 2 Diabetes", stage: "past_history" },
    ];

    const summary = buildSummaryFromMessages(messages);
    expect(summary.chiefComplaint).toBe("Severe abdominal pain since yesterday");
    expect(summary.hpi).toBe("Started after dinner, getting sharper");
    expect(summary.pastHistory).toBe("Type 2 Diabetes");
    expect(summary.drugAllergy).toBe("Not reported");
  });

  it("detects cardiac red flags in English and Hindi", () => {
    const messagesEn: ChatSummaryMessage[] = [
      { role: "patient", text: "I have sharp chest pain and palpitations", stage: "chief_complaint" },
    ];
    const summaryEn = buildSummaryFromMessages(messagesEn);
    expect(summaryEn.redFlags.some((f) => f.includes("Chest pain"))).toBe(true);

    const messagesHi: ChatSummaryMessage[] = [
      { role: "patient", text: "मुझे सीने में दर्द हो रहा है", stage: "chief_complaint" },
    ];
    const summaryHi = buildSummaryFromMessages(messagesHi);
    expect(summaryHi.redFlags.some((f) => f.includes("Chest pain"))).toBe(true);
  });

  it("detects stroke red flags", () => {
    const messages: ChatSummaryMessage[] = [
      { role: "patient", text: "Patient has facial droop and slurred speech", stage: "chief_complaint" },
    ];
    const summary = buildSummaryFromMessages(messages);
    expect(summary.redFlags.some((f) => f.includes("Stroke"))).toBe(true);
  });

  it("builds AYUSH note when AYUSH parameters are reported", () => {
    const messages: ChatSummaryMessage[] = [
      { role: "patient", text: "Vata", stage: "ayush_prakriti" },
      { role: "patient", text: "Pitta", stage: "ayush_vikriti" },
      { role: "patient", text: "Tikshnagni", stage: "ayush_agni" },
    ];
    const summary = buildSummaryFromMessages(messages);
    expect(summary.prakriti).toBe("Vata");
    expect(summary.vikriti).toBe("Pitta");
    expect(summary.agniType).toBe("Tikshnagni");
    expect(summary.ayushNote).toContain("Prakriti: Vata");
  });
});
