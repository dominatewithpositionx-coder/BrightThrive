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
        className={`w-auto object-contain ${className || 'h-[120px] sm:h-[144px]'}`}
      />
    ) : (
      <Image
        src={BRAND.mark}
        alt={BRAND.name}
        width={BRAND.markWidth}
        height={BRAND.markHeight}
        priority={priority}
        className={`object-contain ${className || 'h-10 w-10'}`}
      />
    );

  return (
    <Link href={href} className="inline-flex items-center flex-shrink-0">
      {img}
    </Link>
  );
}
