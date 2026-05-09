import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ redirect: '/login' });
  }

  // Check if member record exists, create if missing
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id, profile_completed')
    .eq('id', session.user.id)
    .single();

  if (!member) {
    // Create fallback member
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
    return NextResponse.json({ redirect: '/complete-profile' });
  }

  if (!member.profile_completed) {
    return NextResponse.json({ redirect: '/complete-profile' });
  }

  return NextResponse.json({ redirect: '/dashboard' });
}
