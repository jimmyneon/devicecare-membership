# DeviceCare Membership - Complete Testing Guide

## 🎯 Overview
This guide will walk you through testing the entire subscription system in Stripe's **TEST MODE** before going live.

---

## ✅ Prerequisites Checklist

- [x] Stripe account created
- [x] Test mode enabled in Stripe Dashboard
- [x] 4 products created in Stripe with Price IDs in `.env.local`
- [ ] Stripe CLI installed
- [ ] Webhook configured

---

## 📋 Step-by-Step Testing Instructions

### **Step 1: Verify Your Stripe Products**

1. Go to https://dashboard.stripe.com/test/products
2. Confirm you have 4 products:
   - DeviceCare Starter (£10/month)
   - DeviceCare Standard (£25/month)
   - DeviceCare Premium (£50/month)
   - DeviceCare Elite (£100/month)
3. Click on each product and copy the **Price ID** (starts with `price_...`)

### **Step 2: Update Environment Variables**

Open `.env.local` and ensure you have:

```bash
# Stripe Keys (from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs (from your products)
STRIPE_PRICE_ID_TIER_1=price_...  # £10 plan
STRIPE_PRICE_ID_TIER_2=price_...  # £25 plan
STRIPE_PRICE_ID_TIER_3=price_...  # £50 plan
STRIPE_PRICE_ID_TIER_4=price_...  # £100 plan

# Webhook Secret (you'll get this in Step 3)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### **Step 3: Set Up Local Webhooks**

Webhooks allow Stripe to notify your app when payments succeed.

**Option A: Using Stripe CLI (Recommended for testing)**

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```
   This will open your browser - click "Allow access"

3. Start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

4. **IMPORTANT:** Copy the webhook signing secret that appears (starts with `whsec_...`)

5. Add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. **Keep this terminal window open** while testing!

**Option B: Skip webhooks for now**
- You can test payments without webhooks
- Member accounts won't be created automatically
- You'll need to add webhooks before going live

### **Step 4: Start Your Dev Server**

In a **new terminal window**:

```bash
cd /Users/johnhopwood/nfdrepairs/subscription
npm run dev
```

Server should start at: http://localhost:3001

### **Step 5: Test the Complete Flow**

1. **Open the app**: http://localhost:3001

2. **Click "Get Started"**

3. **Choose a plan** (e.g., Standard - £25/month)

4. **Fill in the payment form**:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 07123456789
   - Check "I agree to terms"

5. **Click "Continue to Payment"**
   - You should be redirected to Stripe Checkout

6. **Enter test card details**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Test User
   - Postcode: Any (e.g., SO43 7AA)

7. **Click "Subscribe"**

8. **You should be redirected to success page**
   - URL: http://localhost:3001/onboarding/success?session_id=...

### **Step 6: Verify Everything Worked**

**Check Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/test/subscriptions
2. You should see your new subscription
3. Status should be "Active"

**Check Webhook Events (if using Stripe CLI):**
1. Look at the terminal where `stripe listen` is running
2. You should see events like:
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
   - `checkout.session.completed`

**Check Supabase Database:**
1. Go to your Supabase project
2. Open SQL Editor
3. Run:
   ```sql
   SELECT * FROM members WHERE email = 'test@example.com';
   SELECT * FROM subscriptions WHERE stripe_customer_id IS NOT NULL;
   ```
4. You should see your new member and subscription

**Check Server Logs:**
1. Look at your dev server terminal
2. You should see: "Successfully created/updated member: test@example.com"

---

## 🧪 Test Scenarios

### **Test 1: Different Plan Tiers**
- Repeat the flow for each tier (£10, £25, £50, £100)
- Use different email addresses
- Verify correct credit amounts in database

### **Test 2: Failed Payment**
- Use card: `4000 0000 0000 0002` (decline)
- Should show error message
- No subscription should be created

### **Test 3: 3D Secure**
- Use card: `4000 0027 6000 3184`
- Complete 3D Secure challenge
- Payment should succeed

### **Test 4: Subscription Cancellation**
1. Go to Stripe Dashboard → Subscriptions
2. Click on a subscription
3. Click "Cancel subscription"
4. Check database - membership_status should update to 'CANCELLED'

---

## 🐛 Troubleshooting

### **"No checkout URL received"**
- Check that all 4 Price IDs are in `.env.local`
- Restart dev server after changing `.env.local`
- Check server logs for errors

### **"Payment not completed"**
- Make sure you used a test card (4242...)
- Check Stripe Dashboard for failed payments
- Look at webhook events for errors

### **Member not created in database**
- Make sure Stripe CLI is running (`stripe listen`)
- Check webhook secret is correct in `.env.local`
- Look at server logs for webhook errors
- Verify Supabase connection is working

### **"Invalid signature" webhook error**
- Webhook secret is wrong
- Copy the `whsec_...` from Stripe CLI output
- Update `.env.local` and restart server

---

## 🚀 Going Live

Once everything works in test mode:

### **Step 1: Create Live Products**
1. Switch to **Live mode** in Stripe Dashboard (toggle in top right)
2. Create the same 4 products with live prices
3. Copy the new **live** Price IDs

### **Step 2: Update Environment Variables**
Replace test keys with live keys:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_TIER_1=price_live_...
# etc...
```

### **Step 3: Set Up Production Webhooks**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add to production `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

### **Step 4: Deploy**
1. Deploy your app to production
2. Update `NEXT_PUBLIC_APP_URL` to your live domain
3. Test with a real card (or test card in live mode)

---

## 📞 Support

If you get stuck:
1. Check server logs for errors
2. Check Stripe Dashboard → Events for webhook errors
3. Check Supabase logs for database errors
4. Verify all environment variables are set correctly

---

## ✨ Success Checklist

- [ ] Can complete payment with test card
- [ ] Redirected to success page
- [ ] Subscription appears in Stripe Dashboard
- [ ] Member created in Supabase database
- [ ] Subscription record created in database
- [ ] Webhooks receiving events (if configured)
- [ ] Can test all 4 plan tiers
- [ ] Failed payments handled correctly

**When all boxes are checked, you're ready to go live! 🎉**
