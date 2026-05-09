import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/config';

export async function POST(request: Request) {
  try {
    const { months } = await request.json();
    
    if (months < 1 || months > 3) {
      return NextResponse.json({ error: 'Pause duration must be 1-3 months' }, { status: 400 });
    }

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

    // Check if can pause
    if (member.current_credit_balance < 0) {
      return NextResponse.json({
        error: 'Cannot pause with negative balance',
        amountOwed: Math.abs(member.current_credit_balance),
      }, { status: 400 });
    }

    if (member.membership_status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Can only pause active subscriptions',
      }, { status: 400 });
    }

    if (member.pause_count_this_year >= 1) {
      return NextResponse.json({
        error: 'You have already used your pause for this year',
      }, { status: 400 });
    }

    // Calculate resume date
    const resumeDate = new Date();
    resumeDate.setMonth(resumeDate.getMonth() + months);

    // Pause Stripe subscription
    if (member.stripe_subscription_id) {
      await stripe.subscriptions.update(member.stripe_subscription_id, {
        pause_collection: {
          behavior: 'void',
          resumes_at: Math.floor(resumeDate.getTime() / 1000),
        },
        metadata: {
          paused_by: session.user.email,
          paused_at: new Date().toISOString(),
          pause_months: months.toString(),
        },
      });
    }

    // Update member status
    await supabase
      .from('members')
      .update({
        membership_status: 'PAUSED',
        pause_count_this_year: member.pause_count_this_year + 1,
        last_pause_date: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    // Log pause
    await supabase
      .from('subscription_events')
      .insert({
        member_id: session.user.id,
        event_type: 'PAUSED',
        metadata: {
          months,
          resume_date: resumeDate.toISOString(),
        },
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      success: true,
      resumeDate: resumeDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Pause error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}
