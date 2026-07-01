import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  const { name, email, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: 'BrytThrive Contact <notifications@resend.dev>',
      to: 'hello@brytthrive.com',
      replyTo: email,
      subject: `BrytThrive contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[contact] Resend error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
