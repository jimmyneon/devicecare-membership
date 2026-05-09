# Resend Email Configuration - Quick Start

## ✅ Already Done:
- ✅ Resend installed (`npm install resend`)
- ✅ API key added to `.env.local`
- ✅ New login page activated
- ✅ Email functions created

---

## 📧 Configure Sender Email (5 minutes)

### **Option 1: Use Resend Test Email (Quick Testing)**

**For immediate testing, use the default:**
```bash
# .env.local (already has RESEND_API_KEY)
RESEND_FROM_EMAIL=onboarding@resend.dev
```

This works immediately but shows "via resend.dev" in emails.

---

### **Option 2: Use Your Own Domain (Production)**

**For professional emails from your domain:**

#### **Step 1: Add Domain to Resend**
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `nfdrepairs.co.uk`)

#### **Step 2: Add DNS Records**
Resend will show you DNS records to add. Example:

```
Type: TXT
Name: @ (or nfdrepairs.co.uk)
Value: resend-verify=abc123...

Type: MX
Name: @ (or nfdrepairs.co.uk)
Priority: 10
Value: feedback-smtp.resend.com

Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
```

#### **Step 3: Wait for Verification**
- Usually takes 5-15 minutes
- Check status in Resend dashboard

#### **Step 4: Update Environment Variable**
```bash
# .env.local
RESEND_FROM_EMAIL=membership@nfdrepairs.co.uk
# or
RESEND_FROM_EMAIL=DeviceCare <membership@nfdrepairs.co.uk>
```

---

## 🧪 Test It Now!

### **Quick Test (Using Test Email):**

1. **Add test email to `.env.local`:**
   ```bash
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Test the flow:**
   - Go to homepage
   - Sign up for membership
   - Use test card: `4242 4242 4242 4242`
   - Check your email!

4. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - See your sent email
   - View delivery status

---

## 🎯 What Emails Will Be Sent?

### **1. Welcome Email (After Payment)**
- **From:** Your configured email
- **Subject:** "Welcome to DeviceCare! Complete Your Account Setup"
- **Contains:** Setup link to create password + complete profile

### **2. Password Reset (When Requested)**
- **From:** Your configured email
- **Subject:** "Reset Your DeviceCare Password"
- **Contains:** Magic link to reset password

### **3. Magic Link (Forgot Password)**
- **From:** Supabase (via Resend SMTP)
- **Subject:** "Sign in to DeviceCare"
- **Contains:** One-time login link

---

## 🔧 Configure Supabase to Use Resend SMTP

**This makes ALL Supabase emails use Resend (bypasses rate limits):**

### **Step 1: Go to Supabase Dashboard**
1. Open your project
2. Settings → Auth → SMTP Settings

### **Step 2: Enable Custom SMTP**
Toggle "Enable Custom SMTP"

### **Step 3: Enter Resend SMTP Details**
```
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_ME8VCSRD_JdvqAZqjxy6ufKxSFSrEifw5
Sender email: membership@nfdrepairs.co.uk (or onboarding@resend.dev for testing)
Sender name: DeviceCare Membership
```

### **Step 4: Test**
Click "Send Test Email" → Check your inbox

### **Step 5: Save**
Click "Save"

---

## 📊 Email Limits

### **Resend Free Tier:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ Unlimited domains
- ✅ Full analytics

### **Your Expected Usage:**
- Welcome emails: ~100/month
- Password resets: ~20/month
- Magic links: ~10/month
- **Total: ~130/month**
- **Well within free tier!** 🎉

---

## 🆘 Troubleshooting

### **"Invalid API key" error:**
- Check `.env.local` has correct key
- Restart dev server
- Key should start with `re_`

### **Emails not sending:**
1. Check Resend dashboard → Logs
2. Verify FROM_EMAIL is correct
3. Check spam folder
4. Try test email first (`onboarding@resend.dev`)

### **Domain not verified:**
1. Check DNS records are correct
2. Wait 15 minutes
3. Use test email (`onboarding@resend.dev`) while waiting

---

## ✅ Current Status

**What's working now:**
- ✅ Resend installed
- ✅ API key configured
- ✅ Email functions ready
- ✅ New login page active
- ✅ Webhook sends emails

**What you need to do:**
1. Add `RESEND_FROM_EMAIL` to `.env.local`
2. (Optional) Configure your domain in Resend
3. (Optional) Configure Supabase SMTP
4. Test the flow!

---

## 🚀 Quick Start Commands

```bash
# 1. Add to .env.local
echo 'RESEND_FROM_EMAIL=onboarding@resend.dev' >> .env.local

# 2. Restart server
npm run dev

# 3. Test!
# Go to http://localhost:3000 and sign up
```

---

**You're ready to test! The system will use `onboarding@resend.dev` by default, which works immediately.** 🎉

For production, add your own domain in Resend dashboard and update `RESEND_FROM_EMAIL`.
