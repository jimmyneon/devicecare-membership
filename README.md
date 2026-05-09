# DeviceCare Membership

A production-ready subscription-based repair credit system for New Forest Device Repairs.

## 🎯 Overview

DeviceCare Membership is a monthly subscription service that provides:
- **Repair credits** that accrue monthly
- **Priority access** to repair services
- **Reduced friction** - no upfront labour costs
- **Trust-based negative balance** for established members

This is NOT a loyalty program - it's a credit system that removes cost barriers while creating predictable revenue.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Links)
- **Payments**: Stripe (Subscriptions + Saved Cards)
- **Deployment**: Vercel

---

## 📋 Features

### Customer Features
- ✅ Magic link authentication
- ✅ Subscription plan selection (£10, £25, £50, £100/month)
- ✅ Digital membership card with QR code
- ✅ Real-time credit balance tracking
- ✅ Credit expiry management (12-month FIFO)
- ✅ Top-up system for additional credit
- ✅ Pause/cancel membership
- ✅ Usage history and analytics

### Staff Features
- ✅ QR code scanning for instant member lookup
- ✅ Quick repair amount entry (preset buttons)
- ✅ Credit usage confirmation
- ✅ Partial payment support (credit + cash)
- ✅ Real-time status indicators

### Admin Features
- ✅ Member management dashboard
- ✅ Manual credit adjustments
- ✅ Trust level overrides
- ✅ Payment status monitoring
- ✅ Credit liability reporting
- ✅ Account lock/unlock controls

---

## 💰 Credit System Rules

### Core Logic
- Credit accrues monthly based on subscription tier
- Credit expires after **12 months** (FIFO)
- Credit is **non-withdrawable** and **non-refundable**
- Credit covers **labour only** - parts always paid separately

### Negative Balance
- Allowed for **trusted members only**
- Typical buffer: £50-£80
- Cannot pause/cancel while negative
- Auto-calculated based on payment history

### Max Credit Cap
- Prevents excessive accumulation
- Default cap: £300
- Configurable per plan

---

## 🔐 Membership Status

| Status | Description | Credit Accrual | Perks | Can Use Credit |
|--------|-------------|----------------|-------|----------------|
| **ACTIVE** | Subscription current | ✅ Yes | ✅ All | ✅ Yes |
| **GRACE** | Payment failed, retry period | ❌ No | ⚠️ Limited | ✅ Yes |
| **LOCKED** | Payment failed >7 days | ❌ No | ❌ None | ❌ No |
| **PAUSED** | User-initiated pause | ❌ No | ❌ None | ❌ No |
| **CANCELLED** | Subscription ended | ❌ No | ❌ None | ❌ No |

---

## 🎨 Design Philosophy

**Color Palette**:
- Primary: Forest Green (#1f3d2b)
- Background: Warm Cream (#faf8f5)
- Accents: Natural earth tones

**UI Principles**:
- Staff speed > aesthetics
- Large, clear buttons
- Minimal typing required
- Obvious status indicators
- Local, trustworthy feel (not corporate SaaS)

---

## 📦 Project Structure

```
subscription/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-protected routes
│   │   ├── dashboard/     # Customer dashboard
│   │   ├── card/          # Membership card
│   │   └── settings/      # Account settings
│   ├── (staff)/           # Staff-only routes
│   │   └── scan/          # QR scanning interface
│   ├── (admin)/           # Admin-only routes
│   │   └── admin/         # Admin dashboard
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── stripe/        # Stripe webhooks
│   │   ├── members/       # Member operations
│   │   └── credits/       # Credit transactions
│   ├── onboarding/        # New member signup
│   └── login/             # Login page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── membership/       # Membership-specific
│   ├── staff/            # Staff panel components
│   └── admin/            # Admin components
├── lib/                  # Utilities
│   ├── supabase/         # Supabase clients
│   ├── stripe/           # Stripe utilities
│   ├── credits/          # Credit calculation logic
│   └── utils.ts          # Helpers
├── types/                # TypeScript types
├── supabase/             # Database schema & migrations
└── docs/                 # Documentation
```

---

## 🗄️ Database Schema

### Core Tables
- `members` - User accounts and membership data
- `subscriptions` - Stripe subscription tracking
- `credit_ledger` - All credit transactions (ledger system)
- `credit_usage` - Repair credit usage history
- `trust_levels` - Automatic trust tier calculation
- `admin_settings` - System configuration

See `supabase/schema.sql` for complete schema.

---

## 🔧 Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Supabase account
- Stripe account
- Vercel account (for deployment)

### 2. Install Dependencies
```bash
cd subscription
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Database Setup
Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.

### 5. Stripe Setup
1. Create subscription products in Stripe Dashboard
2. Copy product/price IDs to environment variables
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Add webhook events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`

### 6. Run Development Server
```bash
npm run dev
```

App runs on `http://localhost:3001`

---

## 🚢 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Post-Deployment
1. Update Stripe webhook URL to production domain
2. Test magic link emails
3. Verify Supabase RLS policies
4. Test subscription flow end-to-end

---

## 📊 Business Logic

### Credit Accrual
- Runs automatically via Stripe webhook on successful payment
- Credits added to ledger with 12-month expiry date
- Immediate availability

### Credit Expiry
- Background job checks for expired credits daily
- FIFO logic: oldest credits used first
- Expired credits marked in ledger, balance recalculated

### Trust Level Calculation
Automatic tiers based on:
- Payment success rate
- Months subscribed
- Total value used
- Manual admin overrides

| Tier | Buffer | Requirements |
|------|--------|--------------|
| New | £0 | < 2 months |
| Trusted | £50 | 2+ months, 90%+ payment success |
| Gold | £80 | 6+ months, 95%+ payment success |
| Restricted | £0 | Manual flag (abuse/chargebacks) |

### Failed Payment Flow
1. **Day 0**: Payment fails → Status: GRACE
2. **Day 3**: Auto-retry #1
3. **Day 5**: Auto-retry #2
4. **Day 7**: Status: LOCKED, perks disabled
5. **On Success**: Auto-unlock, resume perks

---

## 🎯 Key Metrics

Track in admin dashboard:
- Monthly Recurring Revenue (MRR)
- Active members by tier
- Credit liability (total outstanding credits)
- Average credit usage per member
- Churn rate
- Failed payment recovery rate

---

## 🔒 Security Considerations

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ API routes protected with auth checks
- ✅ Staff/admin routes require role verification
- ✅ Stripe webhook signature verification
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation on all forms
- ✅ Secure session handling via Supabase

---

## 🧪 Testing Checklist

See `docs/TESTING_CHECKLIST.md` for comprehensive test scenarios.

---

## 📞 Support

For issues or questions:
- Check `docs/` folder for detailed guides
- Review `docs/TROUBLESHOOTING.md`
- Contact: support@newforestdevicerepairs.co.uk

---

## 📄 License

Proprietary - New Forest Device Repairs © 2026
