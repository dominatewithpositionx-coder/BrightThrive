'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Parent Login', href: '/login' },
  { label: 'Child Login', href: '/child' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Contact', href: '/contact' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col justify-center items-center w-11 h-11 gap-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <span
          className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`}
        />
        <span
          className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`}
        />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="font-bold text-navy text-lg">Menu</span>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3.5 rounded-xl text-base font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors min-h-[44px] flex items-center"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer CTA */}
        <div className="px-4 py-6 border-t border-gray-100">
          <Link
            href="/onboarding"
            onClick={() => setOpen(false)}
            className="block w-full text-center text-white font-semibold py-3.5 rounded-xl min-h-[44px] transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </>
  );
}
