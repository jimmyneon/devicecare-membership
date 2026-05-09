# Resend + Custom SMTP Setup Guide

## 🎯 New Authentication Flow

### **Better UX Flow:**
1. **Payment succeeds** → Email sent with setup link
2. **User clicks link** → Set password + complete profile (one page!)
3. **Future logins** → Email + password (instant!)
4. **Forgot password?** → Magic link backup

### **Why This Is Better:**
- ✅ **Fast logins** - no waiting for emails
- ✅ **Reliable** - not dependent on email delivery speed
- ✅ **Familiar** - users know email/password
- ✅ **Backup** - magic link for forgotten passwords
- ✅ **Professional** - like every major service

---

## 📧 Step 1: Set Up Resend (15 minutes)

### **1. Sign Up for Resend**
1. Go to https://resend.com
2. Sign up (free account)
3. Verify your email

### **2. Add Your Domain**
1. Dashboard → Domains → Add Domain
2. Enter: `yourdomain.com`
3. Add DNS records (provided by Resend):

```
Type: TXT
Name: @ (or yourdomain.com)
Value: [Resend verification code]

Type: MX
Name: @ (or yourdomain.com)
Priority: 10
Value: feedback-smtp.resend.com

Type: TXT  
Name: _dmarc
Value: v=DMARC1; p=none;

Type: TXT
Name: resend._domainkey
Value: [Resend DKIM key]
```

### **3. Get API Key**
1. Dashboard → API Keys
2. Create API Key
3. Copy the key (starts with `re_`)

### **4. Add to Environment Variables**
```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **5. Install Resend Package**
```bash
npm install resend
```

---

## 🔧 Step 2: Configure Supabase Custom SMTP

### **Why Use Custom SMTP?**
- Bypasses Supabase's 3 emails/hour limit
- Uses your Resend account for ALL emails
- Includes password resets, magic links, etc.

### **Setup:**

1. **Go to Supabase Dashboard**
   - Project Settings → Auth → SMTP Settings

2. **Enable Custom SMTP**
   - Toggle "Enable Custom SMTP"

3. **Enter Resend SMTP Details:**
   ```
   Host: smtp.resend.com
   Port: 465 (or 587 for TLS)
   Username: resend
   Password: [Your Resend API Key]
   Sender email: membership@yourdomain.com
   Sender name: DeviceCare Membership
   ```

4. **Test Email**
   - Click "Send Test Email"
   - Check your inbox

5. **Save Settings**

---

## 📝 Step 3: Update Email Templates in Supabase

### **1. Confirm Signup Template**

Go to: Authentication → Email Templates → Confirm signup

```html
<h2>Welcome to DeviceCare!</h2>
<p>Click the link below to complete your account setup:</p>
<p><a href="{{ .ConfirmationURL }}">Complete Account Setup</a></p>
<p>This link expires in 24 hours.</p>
```

### **2. Magic Link Template**

Go to: Authentication → Email Templates → Magic Link

```html
<h2>Sign in to DeviceCare</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link expires in 1 hour.</p>
```

### **3. Reset Password Template**

Go to: Authentication → Email Templates → Reset Password

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your DeviceCare password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

---

## 🚀 Step 4: Deploy New Files

### **Files Created:**
1. ✅ `/lib/email/resend.ts` - Email sending functions
2. ✅ `/app/(auth)/setup-account/page.tsx` - Password + profile setup
3. ✅ `/app/login/page-new.tsx` - New login with password support

### **To Deploy:**

1. **Replace old login page:**
```bash
mv app/login/page.tsx app/login/page-old.tsx
mv app/login/page-new.tsx app/login/page.tsx
```

2. **Update webhook** (already done)
   - Sends email via Resend
   - Includes setup link

3. **Test locally:**
```bash
npm run dev
```

4. **Deploy to production:**
```bash
git add .
git commit -m "Add Resend email + password auth"
git push
```

---

## 🧪 Step 5: Test the Complete Flow

### **Test Signup:**

1. Go to homepage
2. Click "Get Started"
3. Choose a plan
4. Enter details
5. Pay with test card: `4242 4242 4242 4242`
6. **Check email** (should arrive instantly!)
7. Click "Complete Account Setup"
8. Set password
9. Upload photo + add details
10. Access dashboard

### **Test Login:**

1. Go to `/login`
2. Enter email + password
3. Click "Sign In"
4. Should redirect to dashboard instantly!

### **Test Forgot Password:**

1. Go to `/login`
2. Click "Forgot password? Use magic link instead"
3. Enter email
4. Check email for magic link
5. Click link → Sign in

---

## 💰 Pricing Comparison

### **Supabase Free Tier:**
- ❌ 3 emails per hour
- ❌ ~30 emails per day
- ❌ Not suitable for production

### **Resend Free Tier:**
- ✅ 3,000 emails per month
- ✅ 100 emails per day
- ✅ Perfect for production!

### **Your Usage:**
- 100 signups/month = 100 emails
- 100 members × 1 billing email/month = 100 emails
- Password resets = ~20 emails/month
- **Total: ~220 emails/month**
- **Resend Free: 3,000/month**
- **You're covered!** 🎉

---

## 🎯 What You Get

### **Before (Magic Link Only):**
- ❌ Slow (wait for email every time)
- ❌ Unreliable (email delays)
- ❌ Rate limits (3/hour)
- ❌ Annoying UX

### **After (Password + Resend):**
- ✅ Fast logins (instant!)
- ✅ Reliable (Resend = 99.9% uptime)
- ✅ No rate limits (3,000/month)
- ✅ Professional UX
- ✅ Magic link backup for forgot password

---

## 📋 Checklist

- [ ] Sign up for Resend
- [ ] Add domain to Resend
- [ ] Add DNS records
- [ ] Get Resend API key
- [ ] Add API key to `.env.local`
- [ ] Install `npm install resend`
- [ ] Configure Supabase Custom SMTP
- [ ] Update Supabase email templates
- [ ] Replace login page
- [ ] Test signup flow
- [ ] Test login with password
- [ ] Test forgot password
- [ ] Deploy to production

---

## 🆘 Troubleshooting

### **Emails not sending?**
1. Check Resend API key is correct
2. Verify domain DNS records
3. Check Supabase SMTP settings
4. Look at Resend logs (Dashboard → Logs)

### **Setup link not working?**
1. Check link hasn't expired (24 hours)
2. Verify redirect URL in Supabase
3. Check browser console for errors

### **Password login failing?**
1. Verify user has set a password
2. Check Supabase auth logs
3. Try magic link as backup

---

## 🎉 You're Done!

**Your membership system now has:**
- ✅ Professional email + password auth
- ✅ Reliable email delivery (Resend)
- ✅ No rate limits
- ✅ Magic link backup
- ✅ Beautiful setup flow
- ✅ Fast user experience

**Time to implement: ~30 minutes**
**Cost: FREE (Resend free tier)**

🚀 **Ready to launch!**
