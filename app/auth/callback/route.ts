import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  console.log('🔗 Auth callback - code:', code ? 'present' : 'missing', 'next:', next);

  if (code) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Failed to exchange code for session:', error);
      return NextResponse.redirect(new URL(`/login?error=${error.message}`, requestUrl.origin));
    }
    
    console.log('✅ Session exchanged successfully');
    console.log('🔍 Session object:', session ? 'exists' : 'null', 'user:', session?.user?.id);
    
    // Set session cookies manually
    if (session) {
      const cookieStore = cookies();
      cookieStore.set('sb-access-token', session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      cookieStore.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      console.log('🍪 Session cookies set');
    } else {
      console.error('❌ Session is null after exchange');
    }
    
    // Check if member record exists, create if missing (fallback if webhook failed)
    if (session?.user) {
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, profile_completed')
        .eq('id', session.user.id)
        .single();
      
      console.log('👤 Member check - exists:', !!member, 'profile_completed:', member?.profile_completed);
      
      if (!member) {
        console.log('⚠️ No member record found, creating fallback member');
        await supabaseAdmin.from('members').insert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || null,
          membership_status: 'LOCKED',
          current_plan_tier: 1,
          monthly_credit_amount: 0,
          current_credit_balance: 0,
          profile_completed: false,
          member_since: new Date().toISOString(),
        });
        console.log('✅ Fallback member created');
        return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin));
      } else if (!member.profile_completed) {
        console.log('📝 Profile not complete, redirecting to /complete-profile');
        return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin));
      }
    }
  } else {
    console.error('❌ No code in callback URL');
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  console.log('🔄 Redirecting to:', next);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
