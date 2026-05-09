# Subscription Management Guide

## 🔄 Payment Failure Handling

### **What Stripe Does Automatically:**

1. **Payment fails** → Stripe retries automatically
2. **Retry schedule:**
   - Day 1: Immediate retry
   - Day 3: Second retry
   - Day 5: Third retry
   - Day 7: Fourth retry (final)
3. **After 4 failures** → Subscription cancelled

### **What We Do:**

Our webhook handles each stage:

```
Payment Failed (1st time)
├─ Status: ACTIVE → GRACE
├─ Email: "Payment failed, will retry"
└─ Member can still use service

Payment Failed (2nd time)
├─ Status: GRACE (still)
├─ Email: "Please update payment method"
└─ Member can still use service

Payment Failed (3rd time)
├─ Status: GRACE → LOCKED
├─ Email: "Service suspended"
└─ Member CANNOT use service

Payment Succeeds (after failure)
├─ Status: LOCKED → ACTIVE
├─ Email: "Welcome back!"
└─ Member can use service again
```

---

## 💳 Changing Payment Date

### **Option 1: Stripe Billing Anchor (Recommended)**

Stripe can align billing to a specific day of the month:

**Example:**
- User signs up: May 15th
- Wants to pay on: 1st of month
- Stripe prorates first payment
- Future payments: 1st of every month

**How to implement:**
```typescript
// When creating subscription
billing_cycle_anchor: Math.floor(Date.now() / 1000), // Specific timestamp
proration_behavior: 'create_prorations', // Prorate first payment
```

### **Option 2: Pause & Resume**

User can pause subscription and resume on preferred date:
- Pause on May 15th
- Resume on June 1st
- Billing continues from June 1st

**Limitations:**
- Can only pause 1 time per year (your rule)
- Must be ACTIVE to pause

---

## 🚫 Cancellation Rules

### **Your Requirements:**

1. ✅ **Minimum term:** 3 months
2. ✅ **Cannot cancel if negative balance**
3. ✅ **Make it slightly difficult** (not too easy)

### **Implementation:**

```typescript
// Cancellation rules
const canCancel = (member) => {
  // Check minimum term (3 months)
  const memberSince = new Date(member.member_since);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  if (memberSince > threeMonthsAgo) {
    return {
      allowed: false,
      reason: 'Minimum 3-month commitment required',
      canCancelAfter: new Date(memberSince.setMonth(memberSince.getMonth() + 3)),
    };
  }

  // Check negative balance
  if (member.current_credit_balance < 0) {
    return {
      allowed: false,
      reason: 'Please clear negative balance before cancelling',
      amountOwed: Math.abs(member.current_credit_balance),
    };
  }

  // Check if paused (must resume first)
  if (member.membership_status === 'PAUSED') {
    return {
      allowed: false,
      reason: 'Please resume subscription before cancelling',
    };
  }

  return { allowed: true };
};
```

### **Cancellation Flow:**

```
User clicks "Cancel"
├─ Check minimum term → ❌ "Must wait until [date]"
├─ Check negative balance → ❌ "Owe £X.XX"
├─ Show warning: "Are you sure?"
│  ├─ "You'll lose:"
│  │  ├─ £X.XX credit balance
│  │  ├─ Priority service
│  │  └─ Trust tier status
│  └─ "This cannot be undone"
├─ Require reason (dropdown)
│  ├─ Too expensive
│  ├─ Not using enough
│  ├─ Moving away
│  └─ Other (text field)
└─ Final confirmation → Cancel
```

---

## ⏸️ Pause Subscription

### **Rules:**
- ✅ 1 pause per calendar year
- ✅ Minimum 1 month, maximum 3 months
- ✅ Cannot pause if negative balance
- ✅ Credit freezes (doesn't expire)

### **How It Works:**

```
User pauses for 2 months
├─ Stripe subscription paused
├─ No charges during pause
├─ Credit balance frozen
├─ Resume date set
└─ Auto-resume on date
```

**Example:**
- Balance: £25.00
- Pause: June 1st - August 1st
- No charges in June/July
- Resume August 1st
- Balance still: £25.00
- Billing resumes

---

## 💰 Negative Balance Rules

### **Scenario: User owes money**

```
User has -£15.00 balance
├─ Cannot cancel → Must pay first
├─ Cannot pause → Must pay first
├─ Cannot change plan → Must pay first
├─ Can still use service (if ACTIVE)
└─ Next payment clears debt first
```

**Example:**
- Balance: -£15.00
- Plan: £25/month
- Next payment: £25.00
- After payment:
  - £15.00 clears debt
  - £10.00 added as credit
  - New balance: £10.00

---

## 📅 Payment Date Options

### **Option A: Fixed Day (Recommended)**

All members pay on same day (e.g., 1st of month):
- ✅ Easier to manage
- ✅ Predictable cash flow
- ✅ Stripe handles prorating
- ❌ User can't choose

### **Option B: Anniversary Date**

Members pay on signup anniversary:
- ✅ User chooses implicitly
- ✅ Spreads payments throughout month
- ❌ Harder to manage
- ❌ Less predictable

### **Option C: User Chooses**

Let user pick their billing day:
- ✅ Most flexible
- ✅ Aligns with payday
- ❌ Complex to implement
- ❌ Stripe charges for changes

**My Recommendation:** **Option B (Anniversary)** - simplest and fairest!

---

## 🔒 Making Cancellation "Difficult"

### **Ethical Ways to Reduce Churn:**

1. **Minimum Term** ✅
   - 3 months is fair
   - Industry standard

2. **Show Value** ✅
   - "You've saved £X.XX this year"
   - "You have £X.XX credit remaining"
   - "You'll lose your [TRUSTED] tier status"

3. **Offer Alternatives** ✅
   - "Pause instead?"
   - "Downgrade to cheaper plan?"
   - "We can adjust your billing date"

4. **Require Reason** ✅
   - Helps you improve
   - Makes user think twice
   - Not too annoying

5. **Confirmation Steps** ✅
   - Warning screen
   - Final confirmation
   - Email confirmation

### **What NOT to Do:**
- ❌ Hide cancel button
- ❌ Require phone call
- ❌ Make it take days
- ❌ Charge cancellation fee
- ❌ Dark patterns

---

## 📊 Recommended Settings

```typescript
const SUBSCRIPTION_RULES = {
  // Minimum commitment
  minimumTermMonths: 3,
  
  // Pause rules
  maxPausesPerYear: 1,
  minPauseDays: 30,
  maxPauseDays: 90,
  
  // Payment retries (Stripe default)
  maxRetries: 4,
  retrySchedule: [0, 3, 5, 7], // days
  
  // Grace period
  gracePeriodDays: 7, // Before locking account
  
  // Negative balance
  allowNegativeBalance: true, // Based on trust tier
  maxNegativeBalance: (trustTier) => {
    switch(trustTier) {
      case 'NEW': return 0;
      case 'BUILDING': return 10;
      case 'TRUSTED': return 25;
      case 'VALUED': return 50;
      default: return 0;
    }
  },
  
  // Cancellation
  requireCancellationReason: true,
  showRetentionOffer: true, // Pause or downgrade
  refundUnusedCredit: false, // Credits are non-refundable
};
```

---

## 🎯 Summary

### **Payment Failures:**
- ✅ Stripe handles retries automatically
- ✅ 7-day grace period
- ✅ Webhook updates status
- ✅ Emails sent at each stage

### **Billing Date:**
- ✅ Use anniversary date (simplest)
- ✅ Or let Stripe handle it
- ❌ Don't overcomplicate

### **Cancellation:**
- ✅ 3-month minimum term
- ✅ Cannot cancel with negative balance
- ✅ Show value before cancelling
- ✅ Offer pause/downgrade
- ✅ Require reason
- ✅ Fair and ethical

### **Apple Wallet:**
- ❌ Costs $99/year
- ❌ Complex setup
- ✅ Skip it for now!
- ✅ Download image works great

---

**Next:** Shall I implement the cancellation and pause management pages?
