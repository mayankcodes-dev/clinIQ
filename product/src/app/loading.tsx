// src/app/loading.tsx
// Next.js App Router built-in loading UI —
// shown automatically as a Suspense fallback during page transitions.

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-5">
      {/* Icon mark */}
      <div
        className="flex items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg"
        style={{ width: 64, height: 64 }}
      >
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <rect x="10" y="3" width="4" height="18" rx="1.5" fill="white" />
          <rect x="3" y="10" width="18" height="4" rx="1.5" fill="white" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="text-center">
        <p className="text-2xl font-extrabold">
          <span className="text-slate-800">Clin</span>
          <span className="text-teal-600">IQ</span>
        </p>
        <p className="text-sm text-slate-400 mt-1">AI Clinical History Platform</p>
      </div>

      {/* Pulse dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-teal-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "700ms" }}
          />
        ))}
      </div>
    </div>
  );
}
