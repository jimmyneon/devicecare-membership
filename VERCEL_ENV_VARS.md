# Vercel Environment Variables

Copy these to Vercel when deploying:

## Required Environment Variables

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (update after first deploy)
```

### App URL
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app (update after first deploy)
```

### Resend Email
```
RESEND_API_KEY=re_ME8VCSRD_JdvqAZqjxy6ufKxSFSrEifw5
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

## Deployment Steps

1. **Go to Vercel**: https://vercel.com
2. **Import Project**: Click "Add New" → "Project"
3. **Select Repository**: Choose `jimmyneon/devicecare-membership`
4. **Add Environment Variables**: Copy all variables above
5. **Deploy**: Click "Deploy"

---

## After First Deploy

### 1. Update NEXT_PUBLIC_APP_URL
- Copy your Vercel URL (e.g., `https://devicecare-membership.vercel.app`)
- Go to Vercel → Settings → Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
- Redeploy

### 2. Update Stripe Webhook
- Copy your Vercel URL
- Go to Stripe Dashboard → Developers → Webhooks
- Click "Add endpoint"
- URL: `https://your-app.vercel.app/api/stripe/webhook`
- Events to listen to:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Copy the webhook signing secret
- Update `STRIPE_WEBHOOK_SECRET` in Vercel
- Redeploy

### 3. Test the Flow
1. Sign up with test card: `4242 4242 4242 4242`
2. Check email (should arrive via Resend)
3. Complete profile
4. Access dashboard

---

## Quick Reference - Get Your Values

### Supabase Values
- Go to: https://supabase.com/dashboard
- Select your project
- Settings → API
- Copy `URL` and `service_role` key

### Stripe Values
- Go to: https://dashboard.stripe.com/test/apikeys
- Copy publishable and secret keys
- Webhook secret comes after creating webhook endpoint

---

## Troubleshooting

### Emails not sending?
- Check Resend dashboard logs
- Verify `RESEND_API_KEY` is correct
- Check webhook is triggering in Stripe dashboard

### Webhook not working?
- Verify webhook URL is correct
- Check webhook signing secret matches
- Look at Vercel function logs

### Database errors?
- Run the SQL fixes in Supabase SQL Editor:
  - `FIX_RLS_NO_RECURSION.sql`
  - `FIX_STORAGE_RLS.sql`
