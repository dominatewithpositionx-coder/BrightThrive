import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  const body = await req.json();
  const name    = String(body.name    ?? '').trim();
  const email   = String(body.email   ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'name, email, and message are required' },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from:    'BrytThrive <hello@brytthrive.com>',
      to:      'wayne@brytthrive.com',
      replyTo: email,
      subject: 'New Contact Form Submission',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 24px;color:#111827">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:80px">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827">
                <a href="mailto:${escapeHtml(email)}" style="color:#0d9488">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:600;color:#374151;vertical-align:top">Message</td>
              <td style="padding:10px 0;color:#111827;white-space:pre-wrap">${escapeHtml(message)}</td>
            </tr>
          </table>
        </div>
      `,
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
