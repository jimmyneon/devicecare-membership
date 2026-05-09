import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  console.log('🔗 Auth callback - code:', code ? 'present' : 'missing', 'next:', next);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Failed to exchange code for session:', error);
      // Redirect to login with error
      return NextResponse.redirect(new URL(`/login?error=${error.message}`, requestUrl.origin));
    }
    
    console.log('✅ Session exchanged successfully');
  } else {
    console.error('❌ No code in callback URL');
    // Redirect to login with error
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  // Redirect to the next page or dashboard
  console.log('🔄 Redirecting to:', next);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
