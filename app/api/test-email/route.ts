import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/resend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  try {
    const result = await sendWelcomeEmail(
      email,
      'https://example.com/setup-account?token=test123',
      'Test User'
    );

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Email sent!' : 'Email failed',
      error: result.error || null,
      config: {
        apiKey: process.env.RESEND_API_KEY ? 'Set ✓' : 'Missing ✗',
        fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
