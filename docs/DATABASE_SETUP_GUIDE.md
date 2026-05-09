# Database Setup Guide - DeviceCare Membership

## 🎯 Overview

This guide walks you through setting up the complete database schema in Supabase for the DeviceCare Membership system.

---

## 📋 Prerequisites

- Supabase account created
- Supabase project created
- Access to SQL Editor in Supabase dashboard

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Access SQL Editor

1. Go to your Supabase dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema

1. Open `/subscription/supabase/schema.sql`
2. Copy the **entire file** (all 757 lines)
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Installation

Run this query to check tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these 9 tables:
- ✅ `admin_settings`
- ✅ `credit_ledger`
- ✅ `credit_usage`
- ✅ `members`
- ✅ `pause_history`
- ✅ `payment_methods`
- ✅ `subscriptions`
- ✅ `topups`
- ✅ `trust_level_history`

---

## 🔍 Schema Highlights

### **1. Ledger-Based Credit System** 💰

The credit system uses an **immutable ledger** approach (like accounting):

```sql
-- Every credit transaction creates a permanent record
CREATE TABLE credit_ledger (
    transaction_type transaction_type NOT NULL,  -- ACCRUAL, USAGE, TOPUP, etc.
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    expires_at TIMESTAMPTZ,                      -- 12-month expiry
    remaining_amount DECIMAL(10, 2),             -- For FIFO tracking
    ...
);
```

**Why this matters:**
- ✅ Complete audit trail
- ✅ Can recalculate balance at any time
- ✅ Supports credit expiry (FIFO)
- ✅ Prevents data loss

### **2. FIFO Credit Usage** 🔄

Credits are used **oldest first** via the `use_credit()` function:

```sql
-- Automatically deducts from oldest credits
SELECT use_credit(
    p_member_id := 'uuid-here',
    p_amount := 25.00,
    p_usage_id := 'repair-uuid',
    p_description := 'Screen repair'
);
```

**How it works:**
1. Finds oldest unexpired credits
2. Deducts from them in order
3. Updates `remaining_amount` for each
4. Creates USAGE ledger entry
5. Updates member balance

### **3. Automatic Trust Tiers** 🏆

Trust levels auto-calculate based on payment history:

| Tier | Buffer | Requirements |
|------|--------|--------------|
| **NEW** | £0 | Default for new members |
| **TRUSTED** | £50 | 2+ months, 90%+ payment success |
| **GOLD** | £80 | 6+ months, 95%+ payment success |
| **RESTRICTED** | £0 | Manual flag (abuse cases) |

```sql
-- Auto-updates after each payment
SELECT update_trust_tier('member-uuid');
```

### **4. Credit Expiry System** ⏰

Credits expire after **12 months** automatically:

```sql
-- Run this daily via cron job
SELECT expire_old_credits();
-- Returns: number of credits expired
```

**What it does:**
1. Finds credits older than 12 months
2. Marks them as expired
3. Zeros out `remaining_amount`
4. Creates EXPIRY ledger entry
5. Updates member balance

### **5. Row Level Security (RLS)** 🔒

Every table has security policies:

```sql
-- Customers can only see their own data
CREATE POLICY "Users can view own member record" ON members
    FOR SELECT USING (auth.uid() = id);

-- Staff can see all members
CREATE POLICY "Staff can view all members" ON members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN')
        )
    );
```

**Security levels:**
- 👤 **CUSTOMER**: Own data only
- 👨‍💼 **STAFF**: All member data (read)
- 👑 **ADMIN**: Full access

---

## 🛠️ Key Database Functions

### 1. `calculate_credit_balance(member_id)`
Calculates total balance from ledger.

```sql
SELECT calculate_credit_balance('uuid-here');
-- Returns: 45.50
```

### 2. `get_available_credit(member_id)`
Gets unexpired credit only.

```sql
SELECT get_available_credit('uuid-here');
-- Returns: 40.00 (excludes expired credits)
```

### 3. `use_credit(member_id, amount, usage_id, description)`
Deducts credit using FIFO logic.

```sql
SELECT use_credit(
    'member-uuid',
    25.00,
    'repair-uuid',
    'iPhone screen repair'
);
-- Returns: TRUE (or raises exception if insufficient)
```

### 4. `add_credit(member_id, amount, type, ...)`
Adds credit from subscription or top-up.

```sql
SELECT add_credit(
    'member-uuid',
    25.00,
    'ACCRUAL',
    'subscription-uuid',
    'payment-intent-id',
    'Monthly credit for May 2026'
);
-- Returns: ledger entry UUID
```

### 5. `expire_old_credits()`
Expires credits older than 12 months.

```sql
SELECT expire_old_credits();
-- Returns: 3 (number of credits expired)
```

### 6. `calculate_trust_tier(member_id)`
Calculates appropriate trust tier.

```sql
SELECT calculate_trust_tier('member-uuid');
-- Returns: 'TRUSTED'
```

### 7. `update_trust_tier(member_id)`
Updates member's trust tier and limits.

```sql
SELECT update_trust_tier('member-uuid');
-- Updates member record automatically
```

---

## 📊 Understanding the Data Flow

### **New Member Signup**

1. User signs up via Stripe
2. Webhook creates `members` record
3. Webhook creates `subscriptions` record
4. First payment triggers `add_credit()`
5. Credit added to `credit_ledger`
6. Member can use credit immediately

### **Monthly Payment**

1. Stripe charges card automatically
2. Webhook receives `invoice.payment_succeeded`
3. Calls `add_credit()` with 'ACCRUAL' type
4. Credit expires in 12 months
5. Calls `update_trust_tier()` to check for upgrade

### **Repair Transaction**

1. Staff scans member QR code
2. Enters repair amount
3. API calls `use_credit()`
4. Function deducts from oldest credits (FIFO)
5. Creates `credit_usage` record
6. Updates member balance

### **Credit Expiry**

1. Cron job runs daily
2. Calls `expire_old_credits()`
3. Finds credits > 12 months old
4. Marks as expired
5. Creates EXPIRY ledger entries
6. Updates member balances

---

## 🔧 Post-Setup Configuration

### 1. Set Up Cron Job for Credit Expiry

In Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run daily at 2 AM
SELECT cron.schedule(
    'expire-old-credits',
    '0 2 * * *',
    $$SELECT expire_old_credits()$$
);
```

### 2. Create First Admin User

After your first login, manually set role to ADMIN:

```sql
UPDATE members 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

### 3. Verify RLS Policies

Test that RLS is working:

```sql
-- As customer, should only see own data
SELECT * FROM members;

-- As admin, should see all members
SELECT * FROM members;
```

---

## 🧪 Testing the Schema

### Test 1: Add Credit

```sql
-- Create test member (use real auth.users ID)
INSERT INTO members (id, email, full_name) 
VALUES ('your-auth-uuid', 'test@example.com', 'Test User');

-- Add £25 credit
SELECT add_credit(
    'your-auth-uuid',
    25.00,
    'ACCRUAL',
    NULL,
    NULL,
    'Test credit'
);

-- Check balance
SELECT current_credit_balance FROM members WHERE id = 'your-auth-uuid';
-- Should show: 25.00
```

### Test 2: Use Credit (FIFO)

```sql
-- Add more credit with different dates
SELECT add_credit('your-auth-uuid', 10.00, 'ACCRUAL', NULL, NULL, 'Old credit');
SELECT add_credit('your-auth-uuid', 15.00, 'ACCRUAL', NULL, NULL, 'New credit');

-- Use £12 (should take from oldest first)
SELECT use_credit('your-auth-uuid', 12.00, gen_random_uuid(), 'Test repair');

-- Check ledger
SELECT transaction_type, amount, remaining_amount, created_at 
FROM credit_ledger 
WHERE member_id = 'your-auth-uuid' 
ORDER BY created_at;
```

### Test 3: Credit Expiry

```sql
-- Manually expire a credit for testing
UPDATE credit_ledger 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE member_id = 'your-auth-uuid' 
LIMIT 1;

-- Run expiry function
SELECT expire_old_credits();

-- Check results
SELECT is_expired, remaining_amount FROM credit_ledger 
WHERE member_id = 'your-auth-uuid';
```

---

## 🚨 Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: Make sure you ran the entire schema file, not just parts of it.

### Issue: RLS policies blocking queries
**Solution**: Ensure you're authenticated as a user that exists in the `members` table.

### Issue: Functions not found
**Solution**: Check that all functions were created. Run:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### Issue: Triggers not firing
**Solution**: Verify triggers exist:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## 📈 Monitoring & Maintenance

### Check Credit Liability

```sql
-- Total outstanding credits across all members
SELECT SUM(current_credit_balance) as total_liability
FROM members
WHERE membership_status = 'ACTIVE';
```

### Check Expiring Credits (Next 30 Days)

```sql
SELECT 
    m.email,
    SUM(cl.remaining_amount) as expiring_amount
FROM credit_ledger cl
JOIN members m ON m.id = cl.member_id
WHERE cl.expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
    AND cl.is_expired = FALSE
    AND cl.remaining_amount > 0
GROUP BY m.email
ORDER BY expiring_amount DESC;
```

### Check Failed Payments

```sql
SELECT 
    m.email,
    s.failed_payment_count,
    s.last_payment_date,
    m.membership_status
FROM subscriptions s
JOIN members m ON m.id = s.member_id
WHERE s.failed_payment_count > 0
ORDER BY s.failed_payment_count DESC;
```

---

## ✅ Setup Complete!

Your database is now ready for the DeviceCare Membership app.

**Next steps:**
1. Configure `.env.local` with Supabase credentials
2. Run `npm install` in the subscription folder
3. Test the app with `npm run dev`

---

## 📞 Need Help?

- Check `README.md` for app setup
- Review `PROGRESS.md` for implementation status
- See `TESTING_CHECKLIST.md` for test scenarios
