'use client';

import { useEffect, useState } from 'react';

interface ClinIQLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function ClinIQLoader({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}: ClinIQLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sizeMap = { sm: 48, md: 80, lg: 120 };
  const r = sizeMap[size];
  const stroke = size === 'sm' ? 3 : 4;
  const circumference = 2 * Math.PI * (r / 2 - stroke * 2);

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center gap-4 py-8';

  return (
    <div className={containerClass}>
      {/* Animated logo ring */}
      <div className="relative" style={{ width: r, height: r }}>
        <svg
          width={r}
          height={r}
          viewBox={`0 0 ${r} ${r}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={r / 2}
            cy={r / 2}
            r={r / 2 - stroke * 2}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Animated teal arc */}
          <circle
            cx={r / 2}
            cy={r / 2}
            r={r / 2 - stroke * 2}
            stroke="#0d9488"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            className="animate-spin"
            style={{ animationDuration: '1.4s', transformOrigin: 'center' }}
          />
        </svg>
        {/* ClinIQ text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{
              fontSize: r * 0.16,
              color: '#1a365d',
            }}
          >
            Clin<span style={{ color: '#0d9488' }}>IQ</span>
          </span>
        </div>
      </div>
      {/* Message */}
      {message && (
        <p className="text-sm text-slate-500 font-medium tracking-wide">
          {message}{dots}
        </p>
      )}
    </div>
  );
}
