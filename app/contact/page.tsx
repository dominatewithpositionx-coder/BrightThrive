export const metadata = {
  title: 'Contact | BrytThrive',
  description: "Have a question or want to share how BrytThrive is working for your family? Get in touch — you'll hear back from a real person.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in touch</h1>
        <p className="text-gray-600 leading-relaxed mb-10">
          Have a question, a thought, or just want to share how BrytThrive is working for your family?
          We&apos;d love to hear from you. We&apos;re a small team — you&apos;ll hear back from a real person.
        </p>

        <form
          action="mailto:hello@brytthrive.com"
          method="POST"
          encType="text/plain"
          className="space-y-6"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="What's on your mind?"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors min-h-[44px]"
          >
            Send message
          </button>
        </form>

        <p className="mt-10 text-sm text-gray-500">
          Prefer email? Reach us at{' '}
          <a href="mailto:hello@brytthrive.com" className="text-teal-600 underline hover:text-teal-700">
            hello@brytthrive.com
          </a>
        </p>
      </div>
    </main>
  );
}
