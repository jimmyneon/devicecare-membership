import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email/resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Get the user
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate setup link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/setup-account`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ 
        error: 'Failed to generate link',
        details: linkError 
      }, { status: 500 });
    }

    // Send email
    const result = await sendWelcomeEmail(
      email,
      linkData.properties.action_link,
      user.user_metadata?.full_name || 'Member'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Setup email sent to ${email}`,
        setupLink: linkData.properties.action_link,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
