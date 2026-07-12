import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | BrytThrive',
  description: 'Get in touch with the BrytThrive team. We\'re a small team — you\'ll hear back from a real person.',
  alternates: { canonical: 'https://www.brytthrive.com/contact' },
  openGraph: {
    title: 'Contact Us | BrytThrive',
    description: 'Get in touch with the BrytThrive team.',
    url: 'https://www.brytthrive.com/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
