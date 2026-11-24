'use client';

interface ClinIQLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  /** @deprecated unused — kept for API compatibility */
  steps?: string[];
}

export default function ClinIQLoader({
  message,
  size = 'md',
  fullScreen = false,
}: ClinIQLoaderProps) {
  const dim = size === 'sm' ? 44 : size === 'lg' ? 80 : 60;

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-white/95 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center gap-5 py-10';

  return (
    <div className={containerClass}>
      {/* Spinning teal ring with cross centre */}
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        {/* Spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"
          style={{ animationDuration: '1.1s' }}
        />
        {/* Static medical cross */}
        <svg viewBox="0 0 24 24" fill="none" width={dim * 0.44} height={dim * 0.44} aria-hidden="true">
          <rect x="10" y="3" width="4" height="18" rx="1.5" fill="#0d9488" />
          <rect x="3" y="10" width="18" height="4" rx="1.5" fill="#0d9488" />
        </svg>
      </div>

      {/* One line of text */}
      <p className="text-sm font-medium text-slate-600 text-center">
        {message ?? 'Please wait…'}
      </p>
    </div>
  );
}
