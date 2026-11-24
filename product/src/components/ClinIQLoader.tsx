'use client';

import { useEffect, useState } from 'react';
import { Stethoscope, FileText, Brain, CheckCircle2 } from 'lucide-react';

interface ClinIQLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  /** Override the step list shown during loading */
  steps?: string[];
}

const DEFAULT_STEPS = [
  'Preparing your questions...',
  'Setting up the interview...',
  'Almost ready...',
];

/** Contextual icon — hoisted outside ClinIQLoader to avoid "component created during render" lint error */
function ContextIcon({ message, iconSize }: { message: string; iconSize: number }) {
  const msg = message.toLowerCase();
  if (msg.includes('report') || msg.includes('document') || msg.includes('record')) {
    return <FileText size={iconSize * 0.5} strokeWidth={1.5} className="text-teal-600" />;
  }
  if (msg.includes('analys') || msg.includes('structur') || msg.includes('generat')) {
    return <Brain size={iconSize * 0.5} strokeWidth={1.5} className="text-teal-600" />;
  }
  return <Stethoscope size={iconSize * 0.5} strokeWidth={1.5} className="text-teal-600" />;
}

export default function ClinIQLoader({
  message,
  size = 'md',
  fullScreen = false,
  steps,
}: ClinIQLoaderProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const displaySteps = steps ?? DEFAULT_STEPS;

  // Tick through steps automatically
  useEffect(() => {
    setActiveStep(0);
    setDone([]);
    const timer = setInterval(() => {
      setDone((prev) => {
        const next = [...prev, activeStep];
        return next;
      });
      setActiveStep((prev) => Math.min(prev + 1, displaySteps.length - 1));
    }, 900);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySteps.length]);

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center gap-6 py-10';

  const iconSize = size === 'sm' ? 36 : size === 'lg' ? 72 : 56;

  return (
    <div className={containerClass}>
      {/* Pulsing icon ring */}
      <div
        className="relative flex items-center justify-center rounded-full bg-teal-50 border-2 border-teal-100"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Spinning arc */}
        <svg
          className="absolute inset-0 -rotate-90 animate-spin"
          style={{ animationDuration: '1.4s', width: iconSize, height: iconSize }}
          viewBox={`0 0 ${iconSize} ${iconSize}`}
        >
          <circle
            cx={iconSize / 2}
            cy={iconSize / 2}
            r={iconSize / 2 - 2}
            stroke="#0d9488"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * (iconSize - 4) * 0.25} ${Math.PI * (iconSize - 4) * 0.75}`}
          />
        </svg>
        <ContextIcon message={message ?? ''} iconSize={iconSize} />
      </div>

      {/* Heading */}
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-slate-800">
          {message ?? 'Please wait...'}
        </p>
        <p className="text-xs text-slate-400">ClinIQ is working</p>
      </div>

      {/* Step checklist */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {displaySteps.map((step, i) => {
          const isDone = done.includes(i);
          const isActive = activeStep === i && !isDone;
          return (
            <div
              key={i}
              className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
                isDone
                  ? 'text-teal-600'
                  : isActive
                  ? 'text-slate-800 font-medium'
                  : 'text-slate-300'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
              ) : isActive ? (
                <div className="h-4 w-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0" />
              )}
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
