// src/lib/singleflight.ts
// ClinIQ - request deduplication using flight-shield
//
// Wraps the report and interview API handlers with SingleFlight so that
// concurrent requests for the same session ID are coalesced into one upstream
// LLM call. Prevents thundering-herd on the /api/report and /api/interview
// endpoints when multiple browser tabs or retries fire simultaneously.
//
// flight-shield: https://github.com/mayankcodes-dev/flight-shield

import { SingleFlight } from "flight-shield";

// One shared SingleFlight instance per Node.js process (Edge: one per isolate)
const sf = new SingleFlight();

/**
 * Run `fn` exactly once per unique `key` within a concurrent burst.
 * Callers that arrive while a call is in-flight receive the same result.
 *
 * @param key   Deduplication key (e.g. `report:${sessionId}:${turns.length}`)
 * @param fn    Async factory — receives an AbortSignal from flight-shield
 */
export function singleFlight<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // flight-shield passes an AbortSignal to the factory; we ignore it here
  // because the underlying fetch/groq calls don't support abort yet.
  return sf.do<T>(key, (_signal) => fn());
}
