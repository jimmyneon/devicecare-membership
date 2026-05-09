import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe!.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const customer = session.customer as any;
    const subscription = session.subscription as any;

    // The webhook will handle creating the member record
    // This just confirms the payment was successful
    console.log('Payment verified for customer:', customer.email);

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}
