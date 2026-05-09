import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  // Exchange code for session using admin client
  const { data: { session }, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

  if (error || !session) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
  }

  // Set cookies manually with correct Supabase cookie names
  const cookieStore = cookies();
  const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
  
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  
  response.cookies.set(cookieName, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
  }), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  return response;
}
