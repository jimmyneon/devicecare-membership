import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/config';

export async function POST(request: Request) {
  try {
    const { reason } = await request.json();
    
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get member data
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if can cancel
    const memberSince = new Date(member.member_since);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (memberSince > threeMonthsAgo) {
      return NextResponse.json({
        error: 'Minimum 3-month commitment required',
        canCancelAfter: new Date(memberSince.setMonth(memberSince.getMonth() + 3)),
      }, { status: 400 });
    }

    if (member.current_credit_balance < 0) {
      return NextResponse.json({
        error: 'Please clear negative balance before cancelling',
        amountOwed: Math.abs(member.current_credit_balance),
      }, { status: 400 });
    }

    if (member.membership_status === 'PAUSED') {
      return NextResponse.json({
        error: 'Please resume subscription before cancelling',
      }, { status: 400 });
    }

    // Cancel Stripe subscription
    if (member.stripe_subscription_id) {
      await stripe.subscriptions.update(member.stripe_subscription_id, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason,
          cancelled_by: session.user.email,
          cancelled_at: new Date().toISOString(),
        },
      });
    }

    // Update member status
    await supabase
      .from('members')
      .update({
        membership_status: 'CANCELLED',
      })
      .eq('id', session.user.id);

    // Log cancellation
    await supabase
      .from('subscription_events')
      .insert({
        member_id: session.user.id,
        event_type: 'CANCELLED',
        reason,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
