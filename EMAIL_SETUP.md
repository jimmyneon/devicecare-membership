# Email Setup Guide - Fixing Rate Limits

## 🚨 Current Issue: Supabase Email Rate Limits

**Supabase Free Tier Limits:**
- **3 emails per hour** (very restrictive!)
- Designed for testing only
- Not suitable for production

---

## ✅ Current Workaround (Working Now)

**Flow:**
1. Payment succeeds → Account created
2. Success page shows → "Continue to Login" button
3. User clicks → Goes to `/login`
4. User enters email → Magic link sent
5. User clicks link → Completes profile

**This works because:**
- User manually requests the magic link
- Only 1 email per signup
- Avoids automatic email sending
- No rate limit issues

---

## 🎯 Production Solutions

### **Option 1: Resend (Recommended) 💚**

**Why Resend:**
- ✅ Modern, developer-friendly
- ✅ 3,000 emails/month FREE
- ✅ 100 emails/day FREE
- ✅ Easy setup (5 minutes)
- ✅ Beautiful email templates
- ✅ Great deliverability

**Pricing:**
- Free: 3,000 emails/month
- Pro: $20/month = 50,000 emails
- **Perfect for your needs!**

**Setup:**

```bash
npm install resend
```

```typescript
// lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, magicLink: string, name: string) {
  await resend.emails.send({
    from: 'DeviceCare <membership@yourdomain.com>',
    to: email,
    subject: 'Welcome to DeviceCare! Complete Your Profile',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining DeviceCare Membership.</p>
      <p>Click the button below to complete your profile:</p>
      <a href="${magicLink}" style="background: #009B4D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Complete Profile
      </a>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
```

**Environment Variable:**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

### **Option 2: SendGrid**

**Why SendGrid:**
- ✅ Industry standard
- ✅ 100 emails/day FREE
- ✅ Enterprise-grade
- ✅ Advanced analytics

**Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month = 50,000 emails

**Setup:**

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendWelcomeEmail(email: string, magicLink: string, name: string) {
  await sgMail.send({
    to: email,
    from: 'membership@yourdomain.com',
    subject: 'Welcome to DeviceCare!',
    html: `<h1>Welcome ${name}!</h1>...`,
  });
}
```

---

### **Option 3: AWS SES**

**Why AWS SES:**
- ✅ Extremely cheap
- ✅ $0.10 per 1,000 emails
- ✅ Highly scalable
- ❌ More complex setup

**Pricing:**
- $0.10 per 1,000 emails
- **Cheapest option!**

---

### **Option 4: Supabase Pro**

**Upgrade to Supabase Pro:**
- $25/month
- Unlimited emails
- Better performance
- More storage

**Worth it if:**
- You're already using Supabase heavily
- Want everything in one place
- Need other Pro features

---

## 📧 Email Templates Needed

### **1. Welcome Email (After Payment)**
```
Subject: Welcome to DeviceCare! Complete Your Profile

Hi [Name],

Thank you for joining DeviceCare Membership!

Click below to complete your profile and access your membership card:

[Complete Profile Button]

This link expires in 1 hour.

Questions? Reply to this email.

Best regards,
The DeviceCare Team
```

### **2. Payment Success**
```
Subject: Payment Successful - DeviceCare Membership

Hi [Name],

Your payment of £[amount] has been processed successfully.

Your next billing date: [date]
Current credit balance: £[balance]

[View Membership Card]

Thank you for being a member!
```

### **3. Payment Failed**
```
Subject: Payment Failed - Action Required

Hi [Name],

We couldn't process your payment for DeviceCare Membership.

Please update your payment method to continue your membership.

[Update Payment Method]

We'll retry in 3 days.
```

### **4. Subscription Cancelled**
```
Subject: Subscription Cancelled - We're Sorry to See You Go

Hi [Name],

Your DeviceCare Membership has been cancelled.

Your membership will remain active until [date].

We'd love to hear why you cancelled: [Feedback Form]

You can reactivate anytime!
```

---

## 🚀 Implementation Steps

### **Quick Start (Resend):**

1. **Sign up:** https://resend.com
2. **Get API key:** Dashboard → API Keys
3. **Verify domain:** Add DNS records
4. **Install package:** `npm install resend`
5. **Add to webhook:** Replace email sending code
6. **Test:** Send test payment

**Time:** 15 minutes

---

## 💡 Recommendation

**For Now:**
- ✅ Keep current workaround (works perfectly!)
- ✅ Users click "Continue to Login"
- ✅ No rate limit issues

**For Production:**
- ✅ Use **Resend** (best choice)
- ✅ 3,000 emails/month FREE
- ✅ Easy setup
- ✅ Great deliverability

**Cost Analysis:**
- 100 signups/month = 100 emails
- 100 members × 12 billing emails = 1,200 emails/year
- **Total: ~1,300 emails/year**
- **Resend Free Tier: 3,000/month = 36,000/year**
- **You won't need to pay!** 🎉

---

## 🔧 Where to Update Code

**File:** `/app/api/stripe/webhook/route.ts`

**Current (lines 168-200):**
```typescript
// Generate magic link for new members (don't send email due to rate limits)
```

**Replace with:**
```typescript
// Send welcome email with Resend
if (!existingMember) {
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/complete-profile`,
    },
  });

  if (linkData?.properties?.action_link) {
    await sendWelcomeEmail(
      email,
      linkData.properties.action_link,
      (customer as any).name || 'Member'
    );
  }
}
```

---

## ✅ Current Status

**Working Now:**
- ✅ Payment flow complete
- ✅ Account creation works
- ✅ Manual login works
- ✅ No rate limit issues
- ✅ Users can complete profile

**Ready to Add:**
- 📧 Resend integration (15 min)
- 📧 Email templates (30 min)
- 📧 Test and deploy (15 min)

**Total time to add emails: ~1 hour** 🚀

---

**The current workaround is perfectly fine for testing and even early production!** Add proper email service when you're ready to scale.
