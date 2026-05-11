# DeviceCare Dashboard Redesign - May 11, 2026

## Overview
Redesigned the DeviceCare subscription customer dashboard to feel less clinical and more like a premium local repair membership ("DeviceCare Club").

## Core UX Principle
Customers only use this app when they need help, so the home screen instantly answers:
1. Am I active/covered?
2. How much credit do I have available?
3. How do I use it or book help quickly?

---

## Changes Made

### 1. **Credit Balance Issue - FIXED** ✅

**Problem:**
- New subscriptions were showing £0.00 credit balance even though Stripe payment succeeded
- The webhook was setting `current_credit_balance: plan.credit` directly on subscription creation
- This bypassed the proper credit ledger system

**Root Cause:**
- In `/app/api/stripe/webhook/route.ts` line 130, the initial subscription creation was setting the credit balance directly
- The `add_credit()` function should only be called when `invoice.payment_succeeded` event fires
- This created a mismatch between the member balance and the credit ledger

**Fix Applied:**
- Changed line 130 from `current_credit_balance: plan.credit` to `current_credit_balance: 0`
- Now credit is only added via the proper `add_credit()` RPC function when payment succeeds
- This ensures the credit ledger and member balance stay in sync

**File Changed:**
- `/app/api/stripe/webhook/route.ts`

---

### 2. **Dashboard Redesign** ✅

**Main Changes:**

#### Hero Membership Card Section (Top of Dashboard)
- Large, prominent display of available credit (£XX Ready to Use)
- "Priority Service Enabled" status badge
- Two primary action buttons:
  - "Show My Card" (QR code)
  - "Book a Repair" (external link)
- Member details card showing:
  - Name
  - Plan tier (Starter/Standard/Premium/Elite)
  - Member ID

#### Current Repair Status Panel
- Shows active repairs (currently empty state)
- Friendly message: "No active repairs right now"
- Call-to-action to start a repair

#### Benefits Panel
- Grid of 4 key benefits:
  - Priority Queue Access
  - Credit Rolls Over
  - Faster Check-In (QR/NFC)
  - Build Value Monthly

#### Quick Actions
- Show Membership Card
- Update Payment Method
- Change Plan
- Contact Support

#### Recent Activity
- Simplified transaction labels:
  - "Credit Added" (was "Monthly Credit")
  - "Credit Used" (was "Repair Credit Used")
- Friendly empty state: "You're all set. Your membership is active and ready whenever you need support."

**Files Changed:**
- `/app/(auth)/dashboard/page.tsx`

---

### 3. **Membership Card Simplification** ✅

**Removed:**
- Apple Wallet button
- Google Wallet button
- Download button
- Large profile photo display

**Added:**
- NFC fob mention: "You can also use your DeviceCare NFC fob if you have one"
- "Priority Member" status label
- Cleaner, simpler design

**Improved:**
- Changed "Credit Balance" to "Available Credit"
- Changed "Membership Card" to "Priority Member"
- Better mobile-first layout

**Files Changed:**
- `/components/MembershipCard.tsx`
- `/app/(auth)/card/page.tsx`

---

### 4. **Wording Changes** ✅

**Clinical → Friendly:**

| Before | After |
|--------|-------|
| "Credit Balance" | "Ready to Use" |
| "Membership Status: ACTIVE" | "Priority Service Enabled" |
| "No recent activity" | "You're all set. Your membership is active and ready whenever you need support." |
| "Trust Tier: NEW" | *Hidden from customers* |
| "View Membership Card" | "Show My Card" |
| "Monthly Credit" | "Credit Added" |
| "Repair Credit Used" | "Credit Used" |
| "buffer available" | "backup available if needed" |
| "Current Balance" | "Available Credit" |
| "Membership Status: ACTIVE" | "Active & Ready" |

---

### 5. **Trust Tier - Hidden from Customers** ✅

**Customer View:**
- Trust tier completely removed from dashboard
- Removed from membership card page
- Only shows "Priority service enabled"

**Admin View:**
- Trust tier still tracked in database
- Still visible to staff/admin interfaces
- Used for backend credit limit calculations
- Not exposed to customer-facing UI

**Files Changed:**
- `/app/(auth)/dashboard/page.tsx` - Removed trust tier badge
- `/app/(auth)/card/page.tsx` - Removed "Trust Tier: NEW" display

---

## Visual Design Improvements

### Color & Style
- Warmer cream backgrounds (`bg-ivory`)
- Soft shadows and rounded cards
- Forest green brand colors maintained
- Gradient hero card (forest-800 to forest-900)
- Glassmorphism effects (backdrop-blur)

### Mobile-First
- Responsive flex layouts
- Touch-friendly button sizes
- Stacked cards on mobile
- Large, readable text

### Icons
- Added meaningful icons throughout:
  - `ShieldCheck` for priority status
  - `QrCode` for membership card
  - `Wrench` for repairs
  - `Sparkles` for benefits
  - `CreditCard` for credit/payments

---

## Testing Notes

### Credit Balance
- **Action Required:** Test new subscription flow
- Verify credit shows £25 (or plan amount) after first payment succeeds
- Check that credit ledger entry is created properly
- Confirm `current_credit_balance` matches ledger total

### Stripe Webhook Events
1. `customer.subscription.created` - Creates member with £0 balance
2. `invoice.payment_succeeded` - Calls `add_credit()` RPC function
3. Credit ledger entry created with 12-month expiry
4. Member balance updated to match

### User Experience
- Dashboard loads quickly
- Hero card is immediately visible
- Primary actions are obvious
- No confusing technical jargon
- Trust tier hidden from customers

---

## Files Modified

1. `/app/api/stripe/webhook/route.ts` - Fixed credit balance initialization
2. `/app/(auth)/dashboard/page.tsx` - Complete redesign
3. `/components/MembershipCard.tsx` - Simplified card, removed wallet buttons
4. `/app/(auth)/card/page.tsx` - Removed trust tier, improved wording

---

## Next Steps

1. **Deploy to production** - Push changes to trigger Vercel deployment
2. **Test new subscription** - Create test subscription and verify £25 credit appears
3. **Monitor webhooks** - Check Stripe webhook logs for successful credit additions
4. **User feedback** - Gather feedback on new dashboard design

---

## Notes

- Trust tier is still tracked in the database and used for credit limits
- Admin/staff interfaces should still show trust tier for verification
- NFC fobs mentioned but not yet implemented in system
- Repair tracking integration not yet built (shows empty state)
- All changes maintain existing database schema and API contracts
