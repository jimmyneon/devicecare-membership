import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/config';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount } = await request.json();

    // Validate amount
    if (!amount || amount < 5 || amount > 500) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between £5 and £500' },
        { status: 400 }
      );
    }

    // Get member data
    const { data: member } = await supabase
      .from('members')
      .select('stripe_customer_id, email, full_name')
      .eq('id', session.user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: member.stripe_customer_id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'DeviceCare Credit Top-Up',
              description: `Add £${amount.toFixed(2)} credit to your account`,
            },
            unit_amount: Math.round(amount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/topup?cancelled=true`,
      metadata: {
        member_id: session.user.id,
        topup_amount: amount.toString(),
        type: 'topup',
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error('Top-up checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
