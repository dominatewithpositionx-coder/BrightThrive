import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | BrytThrive',
  description: 'Read the BrytThrive privacy policy to understand how we protect your family\'s data.',
  alternates: { canonical: 'https://www.brytthrive.com/privacy' },
  openGraph: {
    title: 'Privacy Policy | BrytThrive',
    url: 'https://www.brytthrive.com/privacy',
  },
};

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: June 29, 2026</p>

        <p className="text-gray-700 leading-relaxed mb-10">
          BrytThrive Inc. (&ldquo;BrytThrive&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting the privacy
          of every family that uses our platform. This Privacy Policy explains what personal information we collect,
          how we use it, and the choices you have regarding your data. By using BrytThrive, you agree to the
          practices described below.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
          <p className="text-gray-700 leading-relaxed">
            BrytThrive is a family screen-time and mission platform designed to help parents and children build
            healthier digital habits together. Our registered office is located in Canada. All personal data
            is stored and processed in Canada unless otherwise disclosed in this policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We collect only what is necessary to provide and improve the BrytThrive service:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Account information:</strong> Parent email address and password (hashed) used to create and authenticate your account.</li>
            <li><strong>Child profiles:</strong> First name, age range, and optional PIN set by the parent. We do not collect a child&rsquo;s email address or any government-issued identifier.</li>
            <li><strong>Mission and activity data:</strong> Missions assigned, completion status, BrytCoins earned, mood check-ins, and streak information.</li>
            <li><strong>Usage data:</strong> Pages visited, features used, and session timing, collected to improve the product and diagnose issues.</li>
            <li><strong>Device information:</strong> Browser type, operating system, and approximate time zone, collected automatically when you access the service.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            We do <strong>not</strong> collect payment card details directly — payments are handled by our third-party payment processor, which maintains its own PCI-DSS compliance.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>To create and manage your family account and child profiles.</li>
            <li>To generate personalised daily mission packs based on each child&rsquo;s mood, goals, and activity history.</li>
            <li>To track progress, award BrytCoins, and maintain streaks.</li>
            <li>To send transactional emails (account verification, password reset). We will only send marketing emails if you opt in.</li>
            <li>To analyse aggregate, anonymised usage patterns and improve the platform.</li>
            <li>To comply with legal obligations and enforce our Terms of Service.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Children&rsquo;s Privacy</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            BrytThrive takes children&rsquo;s privacy seriously and complies with Canada&rsquo;s <em>Personal Information Protection and
            Electronic Documents Act</em> (PIPEDA) and applicable provincial laws, as well as the Children&rsquo;s Online Privacy
            Protection Act (COPPA) where applicable.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Child profiles are created and controlled exclusively by the parent or legal guardian.</li>
            <li>We do not require children to provide any personal contact information.</li>
            <li>We do not display advertising to children.</li>
            <li>We do not sell, share, or disclose children&rsquo;s personal data to third parties for marketing purposes.</li>
            <li>Parents may review, modify, or delete their child&rsquo;s profile at any time from the parent dashboard.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing and Disclosure</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We do <strong>not</strong> sell your personal information. We may share data only in the following limited circumstances:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Service providers:</strong> Trusted third-party vendors (e.g., cloud hosting, email delivery, analytics) who process data on our behalf under strict data processing agreements.</li>
            <li><strong>Legal requirements:</strong> If required by law, court order, or governmental authority.</li>
            <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, subject to the same privacy protections.</li>
            <li><strong>Safety:</strong> To protect the rights, property, or safety of BrytThrive, our users, or the public.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Storage and Residency</h2>
          <p className="text-gray-700 leading-relaxed">
            All personal data is stored on servers located in Canada. We use Supabase (with Canadian data residency
            configured) as our primary database and authentication provider. Backups and disaster-recovery copies
            remain within Canadian jurisdiction. If your data must ever be transferred outside Canada, we will
            notify you and ensure appropriate safeguards are in place.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
          <p className="text-gray-700 leading-relaxed">
            We retain your account data for as long as your account is active or as needed to provide services.
            If you delete your account, we will delete or anonymise your personal data within 30 days, except
            where we are required to retain it for legal or regulatory purposes. Aggregated, non-identifiable
            analytics data may be retained indefinitely.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We implement industry-standard technical and organisational measures to protect your data, including
            TLS encryption in transit, bcrypt-hashed passwords, row-level security policies on our database, and
            regular security reviews. No method of transmission or storage is 100% secure; however, we are
            committed to maintaining appropriate safeguards.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Your Rights</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Under PIPEDA and applicable provincial privacy laws, you have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access the personal information we hold about you or your child.</li>
            <li>Correct inaccurate or incomplete information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent for non-essential data processing at any time.</li>
            <li>Lodge a complaint with the Office of the Privacy Commissioner of Canada.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:privacy@brytthrive.com" className="text-teal-600 underline">privacy@brytthrive.com</a>.
            We will respond within 30 days.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo;
            date at the top of this page and, for material changes, notify you by email or in-app notification.
            Your continued use of BrytThrive after the effective date of any changes constitutes your acceptance
            of the updated policy.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            If you have questions or concerns about this Privacy Policy or our data practices, please contact:
          </p>
          <div className="mt-4 text-gray-700">
            <p className="font-semibold">BrytThrive Inc. — Privacy Officer</p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@brytthrive.com" className="text-teal-600 underline">privacy@brytthrive.com</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
