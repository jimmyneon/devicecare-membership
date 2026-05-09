import { NextResponse } from 'next/server';
import { stripe, PLAN_TIERS } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email, fullName, phone, planTier } = await request.json();

    if (!email || !fullName || !planTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = PLAN_TIERS[planTier as keyof typeof PLAN_TIERS];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan tier' },
        { status: 400 }
      );
    }

    let customer;
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name: fullName,
        phone,
        metadata: {
          plan_tier: planTier.toString(),
        },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe!.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment?tier=${planTier}`,
      metadata: {
        plan_tier: planTier.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
