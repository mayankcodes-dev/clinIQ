"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ── Dummy analytics data ────────────────────────────────────────────────────
const DUMMY = {
  today: {
    total: 42, allopathic: 31, ayush: 11,
    avgDuration: "4.2 min", avgWait: "12.3 min",
    severity: { mild: 25, moderate: 13, severe: 3, "very severe": 1 },
    languages: { hi: 28, en: 5, ta: 4, bn: 3, te: 2 },
    complaints: [
      { name: "Fever", count: 12 }, { name: "Cough & Cold", count: 8 },
      { name: "Abdominal Pain", count: 6 }, { name: "Headache", count: 5 },
      { name: "Joint Pain", count: 4 }, { name: "Skin Rash", count: 3 },
      { name: "Breathing Difficulty", count: 2 }, { name: "Chest Pain", count: 2 },
    ],
    redFlags: [
      { flag: "Chest pain radiating to arm", count: 2 },
      { flag: "Severe breathing difficulty", count: 1 },
      { flag: "Blood in stool", count: 1 },
    ],
  },
  week: {
    total: 187, allopathic: 142, ayush: 45,
    avgDuration: "3.8 min", avgWait: "14.1 min",
    severity: { mild: 102, moderate: 58, severe: 22, "very severe": 5 },
    languages: { hi: 118, en: 22, ta: 18, bn: 14, te: 8, mr: 4, gu: 3 },
    complaints: [
      { name: "Fever", count: 48 }, { name: "Cough & Cold", count: 32 },
      { name: "Abdominal Pain", count: 24 }, { name: "Headache", count: 22 },
      { name: "Joint Pain", count: 18 }, { name: "Skin Rash", count: 15 },
      { name: "Back Pain", count: 12 }, { name: "Breathing Difficulty", count: 8 },
    ],
    redFlags: [
      { flag: "Chest pain radiating to arm", count: 5 },
      { flag: "Severe breathing difficulty", count: 3 },
      { flag: "Blood in stool", count: 2 },
      { flag: "Sudden vision loss", count: 1 },
    ],
  },
  month: {
    total: 824, allopathic: 618, ayush: 206,
    avgDuration: "4.0 min", avgWait: "11.8 min",
    severity: { mild: 462, moderate: 248, severe: 89, "very severe": 25 },
    languages: { hi: 520, en: 98, ta: 72, bn: 56, te: 38, mr: 18, gu: 12, kn: 10 },
    complaints: [
      { name: "Fever", count: 198 }, { name: "Cough & Cold", count: 142 },
      { name: "Abdominal Pain", count: 108 }, { name: "Headache", count: 96 },
      { name: "Joint Pain", count: 78 }, { name: "Skin Rash", count: 64 },
      { name: "Back Pain", count: 52 }, { name: "Breathing Difficulty", count: 38 },
    ],
    redFlags: [
      { flag: "Chest pain radiating to arm", count: 18 },
      { flag: "Severe breathing difficulty", count: 12 },
      { flag: "Blood in stool", count: 8 },
      { flag: "Sudden vision loss", count: 3 },
      { flag: "Uncontrolled bleeding", count: 2 },
    ],
  },
};

const LANG_NAME: Record<string, string> = {
  hi: "Hindi", en: "English", ta: "Tamil", bn: "Bengali",
  te: "Telugu", mr: "Marathi", gu: "Gujarati", kn: "Kannada",
  ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
};

type Range = "today" | "week" | "month";

// ── Severity bar chart ──────────────────────────────────────────────────────
function SeverityBar({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const colors: Record<string, string> = {
    mild: "bg-green-400", moderate: "bg-amber-400",
    severe: "bg-red-400", "very severe": "bg-red-600",
  };
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([sev, count]) => (
        <div key={sev} className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-24 capitalize">{sev}</span>
          <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${colors[sev] ?? "bg-neutral-400"}`}
              initial={{ width: 0 }}
              animate={{ width: `${(count / total) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-bold text-neutral-700 w-10 text-right">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [range, setRange] = useState<Range>("today");

  // Check auth — redirect if not authed
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("dk_session_token") ?? ""
    : "";

  // If no token, show a simple "go to doctor login" screen
  if (typeof window !== "undefined" && !sessionToken) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-neutral-500">Please log in to view analytics.</p>
          <button
            onClick={() => router.push("/doctor")}
            className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-colors"
          >
            Go to Doctor Login
          </button>
        </div>
      </div>
    );
  }

  const d = DUMMY[range];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/doctor")}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              ← Dashboard
            </button>
            <h1 className="text-lg font-bold text-neutral-800">
              📊 Clinic Analytics
            </h1>
          </div>
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
            {(["today", "week", "month"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === r
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Sessions", value: d.total, icon: "🏥", color: "bg-brand-50 border-brand-200" },
            { label: "Allopathic", value: d.allopathic, icon: "💊", color: "bg-blue-50 border-blue-200" },
            { label: "AYUSH", value: d.ayush, icon: "🌿", color: "bg-green-50 border-green-200" },
            { label: "Avg. Duration", value: d.avgDuration, icon: "⏱️", color: "bg-amber-50 border-amber-200" },
            { label: "Avg. Wait", value: d.avgWait, icon: "⏳", color: "bg-purple-50 border-purple-200" },
          ].map((kpi) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl p-4 ${kpi.color}`}
            >
              <p className="text-2xl mb-1">{kpi.icon}</p>
              <p className="text-2xl font-black text-neutral-800">{kpi.value}</p>
              <p className="text-xs text-neutral-500 font-medium">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Top Complaints ────────────────────────────────── */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wide mb-4">
              🩺 Top Chief Complaints
            </h2>
            <div className="space-y-3">
              {d.complaints.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-400 w-5">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-sm text-neutral-700">{c.name}</span>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Severity Distribution ─────────────────────────── */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wide mb-4">
              ⚡ Severity Distribution
            </h2>
            <SeverityBar data={d.severity} />
          </div>

          {/* ── Language Distribution ─────────────────────────── */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wide mb-4">
              🗣️ Language Distribution
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(d.languages)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => {
                  const total = Object.values(d.languages).reduce((a, b) => a + b, 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div
                      key={lang}
                      className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-center"
                    >
                      <p className="text-sm font-bold text-neutral-800">
                        {LANG_NAME[lang] ?? lang}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {count} ({pct}%)
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ── Red Flags ─────────────────────────────────────── */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wide mb-4">
              🚨 Red Flags Triggered
            </h2>
            {d.redFlags.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">No red flags today</p>
            ) : (
              <div className="space-y-2">
                {d.redFlags.map((rf) => (
                  <div
                    key={rf.flag}
                    className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-red-800">{rf.flag}</span>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      ×{rf.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer note ──────────────────────────────────────── */}
        <div className="text-center py-4">
          <p className="text-xs text-neutral-400">
            📌 Analytics data is currently placeholder. Real-time analytics will be wired to the database in a future update.
          </p>
        </div>
      </main>
    </div>
  );
}
