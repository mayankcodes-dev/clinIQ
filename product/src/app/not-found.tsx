"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🏥</div>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">Page not found</h1>
        <p className="text-neutral-500 text-sm mb-6">
          This page doesn&apos;t exist or has moved.
        </p>
        <button
          onClick={() => router.push("/patient/consent")}
          className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
        >
          Back to ClinIQ →
        </button>
      </div>
    </div>
  );
}
