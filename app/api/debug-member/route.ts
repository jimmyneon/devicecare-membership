import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return NextResponse.json({
      session: {
        user_id: session.user.id,
        email: session.user.email,
      },
      member: memberData,
      memberError: memberError,
      hasData: !!memberData,
      role: memberData?.role || 'NOT SET',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
