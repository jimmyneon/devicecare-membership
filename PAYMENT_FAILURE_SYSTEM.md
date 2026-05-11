# Payment Failure System - How It Works

## **Automatic Protection Against Non-Payment**

The system has **3 levels of protection** when payments fail:

---

## **The 3-Strike System**

### **Strike 1: First Failed Payment**
**Status:** `GRACE` (Grace Period)

**What Happens:**
- ✅ Member can still use their credit
- ✅ Card still works
- ⚠️ Status shows as "GRACE" (yellow badge)
- 🔔 Stripe automatically retries payment

**Why:** Give them benefit of the doubt - could be a temporary card issue

---

### **Strike 2: Second Failed Payment**
**Status:** Still `GRACE`

**What Happens:**
- ✅ Member can still use their credit
- ⚠️ Status still shows "GRACE"
- 🔔 Stripe retries again
- 📧 Stripe sends payment failure emails

**Why:** Card might need updating, give them time to fix it

---

### **Strike 3: Third Failed Payment**
**Status:** `LOCKED` 🔒

**What Happens:**
- ❌ **Account is LOCKED**
- ❌ **Cannot use credit** (even if they have balance)
- ❌ Card shows as "LOCKED" (red badge)
- ❌ Cannot book repairs
- 🛑 System blocks all credit usage

**Why:** 3 failed payments = serious issue, protect the business

---

## **How the System Enforces This**

### **1. Stripe Webhook (Automatic)**
When Stripe detects a failed payment, it sends a webhook to:
```
/api/stripe/webhook
```

The webhook automatically:
1. Increments `failed_payment_count`
2. Sets `last_payment_status` to 'failed'
3. Changes `membership_status`:
   - Failures 1-2: `GRACE`
   - Failures 3+: `LOCKED`

### **2. Credit Usage Check (Enforced)**
File: `/lib/credits/calculator.ts`

Before allowing ANY credit usage:
```typescript
if (member.membership_status === 'LOCKED') {
  return { canUse: false, reason: 'Account is locked' };
}
```

**This means:**
- ❌ Cannot use credit in-store
- ❌ Cannot book repairs
- ❌ QR scanner will show "LOCKED"
- ❌ Staff cannot process repairs for them

---

## **What Staff See**

### **On QR Scanner:**
When scanning a LOCKED member's card:

```
┌─────────────────────────────┐
│ John Smith                  │
│ john@example.com            │
│ Status: 🔴 LOCKED           │
├─────────────────────────────┤
│ ⚠️ ACCOUNT LOCKED           │
│ Payment failed 3 times      │
│                             │
│ Action Required:            │
│ - Update payment method     │
│ - Contact member            │
└─────────────────────────────┘
```

### **On Admin Dashboard:**
- LOCKED members show with red badge
- Can filter to see all LOCKED accounts
- Shows failed payment count
- Shows last payment date

---

## **How Members Get Unlocked**

### **Automatic Unlock:**
When Stripe successfully processes a payment:
1. Webhook receives `invoice.payment_succeeded`
2. Resets `failed_payment_count` to 0
3. Changes status back to `ACTIVE`
4. Member can use credit again immediately

### **Manual Unlock (Admin Only):**
If member pays in cash or resolves issue:
```sql
UPDATE members 
SET membership_status = 'ACTIVE'
WHERE id = 'member-id-here';

UPDATE subscriptions
SET failed_payment_count = 0,
    last_payment_status = 'succeeded'
WHERE member_id = 'member-id-here';
```

---

## **Stripe's Automatic Retry Schedule**

Stripe automatically retries failed payments:
- **Day 1:** First attempt fails
- **Day 3:** Retry #1
- **Day 5:** Retry #2
- **Day 7:** Retry #3
- **Day 10:** Final retry

After all retries fail → Subscription cancelled by Stripe

---

## **Grace Period Settings**

In the database (`admin_settings` table):
```sql
'grace_period_days' = '7'
```

This means:
- Members have 7 days to fix payment issues
- After 3 failed attempts, account locks
- Stripe keeps trying for ~10 days total

---

## **Staff Monitoring Dashboard**

### **What Staff Need to See:**
1. **List of GRACE members** (payment issues)
2. **List of LOCKED members** (need attention)
3. **Failed payment count** per member
4. **Last payment date**

### **Recommended Actions:**
- **GRACE:** Contact member, remind to update card
- **LOCKED:** Contact urgently, cannot use service
- **3+ failures:** Consider cancellation

---

## **Customer Communication**

### **What Customers See:**

**GRACE Status:**
- Dashboard shows: "⚠️ Payment Issue - Please update your card"
- Can still use credit (for now)
- Link to update payment method

**LOCKED Status:**
- Dashboard shows: "🔒 Account Locked - Payment Required"
- Cannot use credit
- Cannot book repairs
- Must update payment method to unlock

---

## **Testing the System**

### **To Test Payment Failure:**
1. Use Stripe test mode
2. Use test card: `4000 0000 0000 0341` (always declines)
3. Wait for Stripe to process
4. Check webhook logs
5. Verify member status changed to GRACE
6. Trigger 2 more failures
7. Verify status changed to LOCKED
8. Try to use credit → Should be blocked

---

## **Security Features**

✅ **Automatic enforcement** - No manual intervention needed
✅ **Cannot be bypassed** - Credit usage checks status
✅ **Webhook-driven** - Real-time updates from Stripe
✅ **Staff visibility** - Can see who has payment issues
✅ **Grace period** - Fair to customers (7 days)
✅ **Hard lock** - Protects business after 3 failures

---

## **Summary**

**The system is fully automated and secure:**

1. ✅ Payment fails → Status changes to GRACE
2. ✅ Payment fails 3 times → Status changes to LOCKED
3. ✅ LOCKED members **cannot use credit** (enforced in code)
4. ✅ Staff can see LOCKED status when scanning QR
5. ✅ Payment succeeds → Automatically unlocks
6. ✅ Stripe handles all retries automatically

**You don't need to do anything manually** - the system protects you automatically!
