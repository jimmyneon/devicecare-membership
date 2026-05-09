# DeviceCare Membership - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd subscription
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- Supabase
- Stripe
- Tailwind CSS
- TypeScript
- Lucide Icons

### 2. Set Up Environment Variables

Copy the example file:

```bash
cp env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (get from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create products first)
STRIPE_PRICE_ID_TIER_1=price_...
STRIPE_PRICE_ID_TIER_2=price_...
STRIPE_PRICE_ID_TIER_3=price_...
STRIPE_PRICE_ID_TIER_4=price_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and run in SQL Editor
5. Verify tables were created in Table Editor

### 4. Set Up Stripe Products

1. Go to Stripe Dashboard → Products
2. Create 4 subscription products:
   - **Starter**: £10/month
   - **Standard**: £25/month (mark as popular)
   - **Premium**: £50/month
   - **Elite**: £100/month
3. Copy each Price ID to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3001

You should see the DeviceCare homepage.

---

## 🧪 Testing the Setup

### Test 1: Homepage Loads
- Visit http://localhost:3001
- Should see forest green homepage with "DeviceCare Membership"

### Test 2: Database Connection
Create a test file `test-db.ts`:

```typescript
import { supabaseAdmin } from './lib/supabase/admin';

async function testConnection() {
  const { data, error } = await supabaseAdmin
    .from('admin_settings')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Database error:', error);
  } else {
    console.log('Database connected!', data);
  }
}

testConnection();
```

Run: `npx tsx test-db.ts`

### Test 3: Stripe Connection
Create `test-stripe.ts`:

```typescript
import { stripe } from './lib/stripe/config';

async function testStripe() {
  const products = await stripe.products.list({ limit: 5 });
  console.log('Stripe connected!', products.data.length, 'products');
}

testStripe();
```

Run: `npx tsx test-stripe.ts`

---

## 📁 Project Structure Overview

```
subscription/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Protected customer routes
│   ├── (staff)/           # Staff-only routes
│   ├── (admin)/           # Admin-only routes
│   ├── api/               # API endpoints
│   ├── onboarding/        # Signup flow
│   ├── login/             # Login page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utilities & configs
├── types/                 # TypeScript types
├── supabase/             # Database schema
└── docs/                 # Documentation
```

---

## 🎯 Next Development Steps

Follow these in order:

### Step 1: Authentication System
Create login with magic links:
- `app/login/page.tsx`
- `app/api/auth/callback/route.ts`
- `middleware.ts`

### Step 2: Onboarding Flow
Build signup process:
- Plan selection
- Stripe payment collection
- Account creation

### Step 3: Customer Dashboard
Member portal:
- Credit balance display
- Membership card with QR
- Transaction history

### Step 4: Stripe Webhooks
Handle subscription events:
- Payment success → add credit
- Payment failed → grace period
- Subscription cancelled → lock account

### Step 5: Staff Panel
QR scanning and repair processing:
- Scan member card
- Enter repair amount
- Deduct credit

### Step 6: Admin Dashboard
Management interface:
- View all members
- Adjust credits
- Generate reports

---

## 🐛 Common Issues

### Issue: "Cannot find module" errors
**Solution**: Run `npm install`

### Issue: Database connection fails
**Solution**: 
- Check Supabase URL and keys in `.env.local`
- Verify schema was run successfully
- Check RLS policies are enabled

### Issue: Stripe webhook not working
**Solution**:
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
- Verify webhook secret in `.env.local`

### Issue: TypeScript errors
**Solution**: 
- Run `npm run type-check`
- Ensure all dependencies installed
- Restart TypeScript server in IDE

---

## 📚 Key Documentation Files

- `README.md` - Full project overview
- `docs/IMPLEMENTATION_SUMMARY.md` - What's built and what's next
- `docs/PROJECT_CHECKLIST.md` - Implementation tracker
- `docs/TESTING_CHECKLIST.md` - Test scenarios
- `docs/QUICK_START.md` - This file

---

## 🆘 Getting Help

1. Check documentation in `docs/` folder
2. Review database schema in `supabase/schema.sql`
3. Check type definitions in `types/`
4. Review existing code patterns

---

## ✅ Verification Checklist

Before proceeding with development:

- [ ] `npm install` completed successfully
- [ ] `.env.local` configured with all variables
- [ ] Supabase database schema applied
- [ ] Stripe products created
- [ ] Dev server runs without errors
- [ ] Homepage loads at localhost:3001
- [ ] Database connection tested
- [ ] Stripe connection tested

---

**Ready to build!** Start with authentication system next.
