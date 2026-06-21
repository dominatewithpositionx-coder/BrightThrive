'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for debugging without exposing to user
    console.error('[BrightThrive error]', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-5">🌱</div>
      <h1 className="text-2xl font-bold text-navy mb-3">Something went wrong</h1>
      <p className="text-gray-600 text-sm max-w-sm leading-relaxed mb-2">
        Don't worry — your family's data is safe.
      </p>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-8">
        This was an unexpected hiccup on our end. Try refreshing the page, or head back to your dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-gray-400">Reference: {error.digest}</p>
      )}
    </div>
  );
}
