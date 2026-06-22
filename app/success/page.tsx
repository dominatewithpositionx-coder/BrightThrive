'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function SuccessPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    const timer = setTimeout(() => setShowModal(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-3xl font-bold mb-2">🎉 You're on the list!</h1>

      <p className="text-gray-700 mb-6 max-w-lg">
        Thanks for joining the <strong>BrytThrive</strong> waitlist!
        We'll notify you as soon as early access opens — stay tuned,
        and get ready to help your family build healthy screen habits.
      </p>

      <div className="flex gap-3">
        <button
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
          onClick={() => router.push('/')}
        >
          Back to Home
        </button>

        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          Share the Excitement
        </button>
      </div>

      <footer className="mt-12 text-xs text-gray-500">
        © {new Date().getFullYear()} BrytThrive. All rights reserved.
      </footer>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-[90%] max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-3">🚀 Share the excitement!</h2>
            <p className="text-gray-600 mb-6">
              Let your friends know you're on the <strong>BrytThrive</strong> waitlist.
              The more people that join, the sooner we launch early access!
            </p>

            <div className="flex justify-center gap-4">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just joined the BrytThrive waitlist! Join me to help families build healthier tech habits 📱 https://brytthrive.com")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 transition"
              >
                Twitter
              </a>

              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fbrytthrive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0077B5] text-white px-4 py-2 rounded-md hover:bg-[#005582] transition"
              >
                LinkedIn
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent("Join me on the BrytThrive waitlist!")}&body=${encodeURIComponent("I just joined the BrytThrive waitlist — a new app helping families balance screen time and real-world wins! Join me at https://brytthrive.com")}`}
                className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
