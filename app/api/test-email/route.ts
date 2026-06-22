// app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brytthrive.com';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email, name } = await req.json();
    const recipient = email || process.env.NOTIFY_EMAIL;

    if (!recipient) {
      return NextResponse.json({ error: 'No recipient email provided.' }, { status: 400 });
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; background-color: #f9fafb; color: #111; margin: 0; padding: 20px; }
            .container { background: white; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }
            .cta { background-color: #22c55e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 24px; }
            .footer { font-size: 12px; color: #555; text-align: center; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to <strong>BrytThrive</strong>!</h1>
            <p>Hey ${name || 'Friend'},</p>
            <p>Thanks for joining — you're helping your family build healthy habits and calmer days.</p>
            <a href="${SITE_URL}/dashboard" class="cta">Go to your dashboard</a>
            <div class="footer">
              © ${new Date().getFullYear()} BrytThrive — Earn your play. Enjoy your day.
            </div>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: 'BrytThrive <notifications@resend.dev>',
      to: recipient,
      subject: `Welcome to BrytThrive${name ? `, ${name}` : ''}! 🎉`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Email sent to ${recipient}` });
  } catch (err: any) {
    console.error('Error sending test email:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
