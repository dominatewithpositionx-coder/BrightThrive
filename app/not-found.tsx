import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-5">🔍</div>
      <h1 className="text-2xl font-bold text-navy mb-3">Page not found</h1>
      <p className="text-gray-600 text-sm max-w-sm leading-relaxed mb-8">
        We couldn't find what you were looking for. It may have moved, or the link might be incorrect.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
