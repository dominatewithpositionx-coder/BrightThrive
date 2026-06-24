'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

interface LogoProps {
  /** 'full' = horizontal logo+wordmark; 'mark' = icon only */
  variant?: 'full' | 'mark';
  /** Tailwind classes applied to the <img> element */
  className?: string;
  href?: string;
  priority?: boolean;
}

export default function Logo({
  variant = 'full',
  className = '',
  href = '/',
  priority = false,
}: LogoProps) {
  const img =
    variant === 'full' ? (
      <Image
        src={BRAND.logo}
        alt={BRAND.name}
        width={BRAND.logoWidth}
        height={BRAND.logoHeight}
        priority={priority}
        className={`object-contain ${className || 'w-[140px] sm:w-[180px] h-auto'}`}
      />
    ) : (
      <Image
        src={BRAND.mark}
        alt={BRAND.name}
        width={BRAND.markWidth}
        height={BRAND.markHeight}
        priority={priority}
        className={`object-contain ${className || 'w-[48px] h-[48px]'}`}
      />
    );

  return (
    <Link href={href} className="inline-flex items-center flex-shrink-0">
      {img}
    </Link>
  );
}
