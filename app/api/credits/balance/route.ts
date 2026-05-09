import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableCredit } from '@/lib/credits/calculator';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const availableCredit = await getAvailableCredit(session.user.id);

    return NextResponse.json({
      currentBalance: member.current_credit_balance,
      availableCredit,
      negativeBalanceLimit: member.negative_balance_limit,
      totalAvailable: availableCredit + member.negative_balance_limit,
      lifetimeEarned: member.lifetime_credits_earned,
      lifetimeUsed: member.lifetime_credits_used,
    });
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
