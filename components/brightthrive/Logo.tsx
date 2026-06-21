'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  href?: string;
}

export default function Logo({ variant = 'full', className = '', href = '/' }: LogoProps) {
  const img =
    variant === 'full' ? (
      <Image
        src="/brand/BrightThrive.png"
        alt="BrightThrive"
        width={200}
        height={54}
        priority
        className={`h-10 w-auto object-contain ${className}`}
      />
    ) : (
      <Image
        src="/brand/BrightThrive.png"
        alt="BrightThrive"
        width={40}
        height={40}
        priority
        className={`h-10 w-10 object-contain ${className}`}
      />
    );

  return (
    <Link href={href} className="flex items-center flex-shrink-0">
      {img}
    </Link>
  );
}
