export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-6">🌱</div>
      <h1 className="text-2xl font-bold text-navy mb-3">You&apos;re offline</h1>
      <p className="text-gray-500 max-w-xs mb-8 leading-relaxed">
        No internet right now — that&apos;s okay. BrightThrive will be right here when you reconnect.
      </p>
      <p className="text-sm text-gray-400">
        Tip: missions you already loaded are still visible.
      </p>
    </div>
  );
}
