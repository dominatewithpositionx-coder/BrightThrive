'use client';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ShareModalProps {
  onClose: () => void;
}

export default function ShareModal({ onClose }: ShareModalProps) {
  const shareText = encodeURIComponent(
    "🚀 I just joined the BrightThrive waitlist — a smarter way to help kids balance screen time, focus, and thrive every day! Join me 👇"
  );
  const shareUrl = encodeURIComponent('https://brightthrive.com/');

  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const emailUrl = `mailto:?subject=Join BrightThrive&body=${shareText}%0A${shareUrl}`;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative border border-gray-100"
      >
        <button
          onClick={onClose}
          aria-label="Close share modal"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mb-5">
          <Image
            src="/icons/icon-96x96.png"
            alt="BrightThrive"
            width={56}
            height={56}
            className="rounded-2xl mb-3"
          />
          <Image
            src="/brand/BrightThrive.png"
            alt="BrightThrive"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>

        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
          Share the excitement!
        </h2>

        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Let your friends know you're on the <strong>BrightThrive</strong> waitlist!
          The more families that join, the sooner we can help kids everywhere thrive smarter.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1DA1F2] text-white py-2 rounded-md font-medium hover:bg-[#1A91DA] transition"
          >
            Share on Twitter
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0077B5] text-white py-2 rounded-md font-medium hover:bg-[#006097] transition"
          >
            Share on LinkedIn
          </a>
          <a
            href={emailUrl}
            className="bg-gray-700 text-white py-2 rounded-md font-medium hover:bg-gray-800 transition"
          >
            Share via Email
          </a>
        </div>

        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full opacity-80 blur-sm" />
      </motion.div>
    </motion.div>
  );
}
