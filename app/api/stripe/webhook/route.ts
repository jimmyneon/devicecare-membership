import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, PLAN_TIERS } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        // Only send welcome email on creation, not updates
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, true);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, false);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, isNewSubscription: boolean = false) {
  const customerId = subscription.customer as string;
  const customer = await stripe!.customers.retrieve(customerId);
  
  if (customer.deleted) return;

  const email = customer.email;
  if (!email) return;

  // Get price ID and determine plan tier
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = Object.entries(PLAN_TIERS).find(
    ([_, plan]) => plan.stripePriceId === priceId
  )?.[0];

  if (!planTier) {
    console.error('No matching plan tier for price ID:', priceId);
    return;
  }

  const plan = PLAN_TIERS[parseInt(planTier) as keyof typeof PLAN_TIERS];

  // Create auth user if doesn't exist
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  let userId = authUsers.users.find(u => u.email === email)?.id;

  if (!userId) {
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: (customer as any).name || null,
      },
    });

    if (authError || !newUser) {
      console.error('Failed to create auth user:', authError);
      return;
    }

    userId = newUser.user.id;
  }

  // Check if member exists
  const { data: existingMember } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  const memberData = {
    id: userId,
    email,
    full_name: (customer as any).name || null,
    phone: (customer as any).phone || null,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    current_plan_tier: parseInt(planTier),
    monthly_credit_amount: plan.credit,
    current_credit_balance: 0,
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    membership_status: subscription.status === 'active' ? 'ACTIVE' : 
                      subscription.status === 'past_due' ? 'GRACE' : 'LOCKED',
  };

  if (existingMember) {
    await supabaseAdmin
      .from('members')
      .update(memberData)
      .eq('stripe_customer_id', customerId);
  } else {
    console.log('Attempting to insert member:', memberData);
    const { error: insertError, data: insertData } = await supabaseAdmin
      .from('members')
      .insert(memberData)
      .select();
    
    if (insertError) {
      console.error('Failed to create member:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      throw new Error(`Member insert failed: ${insertError.message}`);
    }
    console.log('Member created successfully:', insertData);
  }

  // Upsert subscription record
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      member_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_tier: parseInt(planTier),
      monthly_amount: plan.price,
      credit_amount: plan.credit,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'stripe_subscription_id',
    });
  
  console.log('Successfully created/updated member:', email);
  
  // Send welcome email ONLY for new subscriptions (not updates)
  console.log('🔍 Email check - existingMember:', !!existingMember, 'isNewSubscription:', isNewSubscription);
  
  if (!existingMember && isNewSubscription) {
    console.log('📧 Attempting to send welcome email to:', email);
    try {
      // Generate a secure token for account setup
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/setup-account`,
        },
      });

      if (linkError) {
        console.error('❌ Failed to generate setup link:', linkError);
      } else if (linkData?.properties?.action_link) {
        console.log('✅ Setup link generated:', linkData.properties.action_link);
        
        // Send email via Resend
        const { sendWelcomeEmail } = await import('@/lib/email/resend');
        const result = await sendWelcomeEmail(
          email,
          linkData.properties.action_link,
          (customer as any).name || 'Member'
        );

        if (result.success) {
          console.log('✅ Welcome email sent successfully to:', email);
        } else {
          console.error('❌ Failed to send welcome email via Resend:', result.error);
        }
      } else {
        console.error('❌ No action link in response');
      }
    } catch (emailError) {
      console.error('❌ Exception sending welcome email:', emailError);
      // Don't throw - member is created, email is optional
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!member) return;

  await supabaseAdmin
    .from('members')
    .update({
      membership_status: 'CANCELLED',
      current_credit_balance: 0,
    })
    .eq('id', member.id);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*, members(*)')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      last_payment_date: new Date().toISOString(),
      last_payment_status: 'succeeded',
      failed_payment_count: 0,
    })
    .eq('id', subscription.id);

  await supabaseAdmin
    .from('members')
    .update({
      membership_status: 'ACTIVE',
    })
    .eq('id', subscription.member_id);

  await supabaseAdmin.rpc('add_credit', {
    p_member_id: subscription.member_id,
    p_amount: subscription.credit_amount,
    p_transaction_type: 'ACCRUAL',
    p_subscription_id: subscription.id,
    p_stripe_payment_intent_id: invoice.payment_intent as string,
    p_notes: `Monthly credit for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
  });

  await supabaseAdmin.rpc('update_trust_tier', {
    p_member_id: subscription.member_id,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  const failedCount = (subscription.failed_payment_count || 0) + 1;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      last_payment_date: new Date().toISOString(),
      last_payment_status: 'failed',
      failed_payment_count: failedCount,
    })
    .eq('id', subscription.id);

  let newStatus = 'GRACE';
  if (failedCount >= 3) {
    newStatus = 'LOCKED';
  }

  await supabaseAdmin
    .from('members')
    .update({
      membership_status: newStatus,
    })
    .eq('id', subscription.member_id);
}
