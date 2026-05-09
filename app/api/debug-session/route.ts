import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  return NextResponse.json({
    hasSession: !!session,
    session: session ? {
      userId: session.user.id,
      email: session.user.email,
      accessToken: session.access_token ? 'present' : 'missing',
      refreshToken: session.refresh_token ? 'present' : 'missing',
    } : null,
    error: error?.message || null,
  });
}
