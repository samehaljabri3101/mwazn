'use client';

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold text-slate-800">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-xl bg-brand-700 px-5 py-2 text-sm text-white hover:bg-brand-800"
      >
        Try again
      </button>
    </div>
  );
}
