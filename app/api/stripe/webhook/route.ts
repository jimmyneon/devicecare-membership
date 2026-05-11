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

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
    
    // Send magic link email to new member
    try {
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
      }).then(async ({ data, error }) => {
        if (error) {
          console.error('Failed to generate magic link:', error);
        } else if (data?.properties?.action_link) {
          // Send email with magic link
          console.log('Magic link generated for:', email);
          // Note: Supabase automatically sends the email
        }
      });
    } catch (emailError) {
      console.error('Error sending magic link:', emailError);
      // Don't throw - member is created, they can use password reset
    }
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
      // Check if auth user already exists
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      
      if (authUser?.user) {
        // User exists in auth, send magic link instead
        console.log('✅ Auth user exists, sending magic link');
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        });

        if (linkError) {
          console.error('❌ Failed to generate magic link:', linkError);
        } else if (linkData?.properties?.action_link) {
          console.log('✅ Magic link generated:', linkData.properties.action_link);
          // Supabase automatically sends the magic link email
        }
      } else {
        // New user, generate signup link
        console.log('✅ New auth user, generating signup link');
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
        }
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

  console.log('💳 Adding credit:', {
    member_id: subscription.member_id,
    amount: subscription.credit_amount,
    subscription_id: subscription.id,
    payment_intent: invoice.payment_intent,
  });

  const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('add_credit', {
    p_member_id: subscription.member_id,
    p_amount: subscription.credit_amount,
    p_transaction_type: 'ACCRUAL',
    p_subscription_id: subscription.id,
    p_stripe_payment_intent_id: invoice.payment_intent as string,
    p_notes: `Monthly credit for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
  });

  if (creditError) {
    console.error('❌ Failed to add credit:', creditError);
    throw new Error(`Credit addition failed: ${creditError.message}`);
  }

  console.log('✅ Credit added successfully. Ledger ID:', creditResult);

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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Check if this is a top-up payment
  if (session.metadata?.type !== 'topup') return;

  const memberId = session.metadata.member_id;
  const topupAmount = parseFloat(session.metadata.topup_amount || '0');

  if (!memberId || !topupAmount) {
    console.error('Missing metadata for top-up:', session.metadata);
    return;
  }

  console.log('💰 Processing top-up:', {
    member_id: memberId,
    amount: topupAmount,
    payment_intent: session.payment_intent,
  });

  // Create top-up record
  const { data: topupRecord, error: topupError } = await supabaseAdmin
    .from('topups')
    .insert({
      member_id: memberId,
      amount: topupAmount,
      stripe_payment_intent_id: session.payment_intent as string,
      payment_status: 'succeeded',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (topupError) {
    console.error('❌ Failed to create top-up record:', topupError);
    return;
  }

  // Add credit to member account
  const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('add_credit', {
    p_member_id: memberId,
    p_amount: topupAmount,
    p_transaction_type: 'TOPUP',
    p_subscription_id: null,
    p_stripe_payment_intent_id: session.payment_intent as string,
    p_notes: `Top-up: £${topupAmount.toFixed(2)}`,
  });

  if (creditError) {
    console.error('❌ Failed to add top-up credit:', creditError);
    return;
  }

  // Update topup record with ledger ID
  await supabaseAdmin
    .from('topups')
    .update({ credit_ledger_id: creditResult })
    .eq('id', topupRecord.id);

  console.log('✅ Top-up completed successfully. Ledger ID:', creditResult);
}
