import Link from 'next/link';

export const metadata = {
  title: 'Contact — BrytThrive',
  description: 'Get in touch with the BrytThrive team.',
};

export default function ContactPage() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="text-5xl mb-5">💬</div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">Get in touch</h1>
        <p className="text-base text-gray-600 leading-relaxed mb-8">
          Questions, feedback, or just want to say hi? We&apos;d love to hear from you.
          We read every message and usually reply within a day.
        </p>
        <a
          href="mailto:hello@brytthrive.com"
          className="inline-flex items-center justify-center w-full md:w-auto text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition-opacity hover:opacity-90 min-h-[44px]"
          style={{ background: 'linear-gradient(90deg, #22C55E 0%, #14B8A6 100%)' }}
        >
          Email us
        </a>
        <p className="mt-6 text-sm text-gray-500">
          Or head back{' '}
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium underline">
            home
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
