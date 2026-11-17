// src/lib/ocrUtils.ts
// Utility functions for OCR text sanitization and dosage correction

/**
 * Fixes common OCR letter-for-number substitutions in dosage strings.
 * e.g., "5OOmg" -> "500mg", "OO5mg" -> "005mg"
 */
export function fixOcrDosage(dose: string): string {
  if (!dose) return dose;
  return dose
    .replace(/(\d)[Oo]+/g, (match) => match.replace(/[Oo]/g, "0"))
    .replace(/^[Oo]+(\d)/, (match) => match.replace(/[Oo]/g, "0"));
}
