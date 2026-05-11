# Troubleshooting Common Issues

## Error After Changing Role to ADMIN

### **Problem:**
After changing your role to ADMIN in the database, you get:
```
Error: An error occurred in the Server Components render
```

### **Cause:**
Your browser session is cached with your old role (CUSTOMER). The app is trying to load admin pages but your session still thinks you're a customer.

### **Solution (Quick Fix):**

**Option 1: Clear Session (Recommended)**
1. Log out of the app
2. Close all browser tabs
3. Clear browser cache (Cmd+Shift+Delete on Mac)
4. Go to the app and log in again
5. Your admin role will now be active

**Option 2: Hard Refresh**
1. Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. This forces a full page reload
3. Log out and log back in

**Option 3: Incognito/Private Window**
1. Open an incognito/private browser window
2. Go to your app
3. Log in with your admin account
4. Should work immediately

### **Why This Happens:**
- Supabase caches your session in the browser
- When you change the role in the database, the session doesn't update automatically
- You need to create a new session (by logging out and back in)

---

## Other Common Issues

### **"Cannot read properties of null" Error**

**Cause:** Trying to access data before it's loaded

**Solution:**
- Add null checks: `if (!member) return null;`
- Use optional chaining: `member?.full_name`
- Add loading states

### **RLS Policy Errors**

**Cause:** Row Level Security blocking access

**Solution:**
- Check if user is authenticated
- Verify role is correct
- Check RLS policies in Supabase

### **Webhook Not Working**

**Cause:** Stripe can't reach your webhook endpoint

**Solution:**
1. Check webhook URL in Stripe dashboard
2. Verify webhook secret in `.env.local`
3. Check Stripe webhook logs for errors
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### **Credit Not Updating**

**Cause:** Webhook might not have fired or RPC function failed

**Solution:**
1. Check Stripe webhook logs
2. Check Supabase logs
3. Verify `add_credit` function exists
4. Check member's `stripe_subscription_id` matches

### **QR Code Not Showing**

**Cause:** Canvas not rendering or member ID missing

**Solution:**
1. Check browser console for errors
2. Verify member has an ID
3. Try refreshing the page
4. Check if `qrcode` package is installed

---

## Debugging Tips

### **Check Supabase Logs:**
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Filter by "Postgres Logs" or "API Logs"
4. Look for errors

### **Check Stripe Webhook Logs:**
1. Go to Stripe Dashboard
2. Developers → Webhooks
3. Click your webhook endpoint
4. View "Recent deliveries"
5. Check for failed events

### **Check Browser Console:**
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to "Console" tab
3. Look for red errors
4. Check "Network" tab for failed requests

### **Check Environment Variables:**
```bash
# In your terminal
cat .env.local

# Should have:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

---

## Getting Help

If you're still stuck:

1. **Check the error message** - Read it carefully
2. **Check browser console** - Look for specific errors
3. **Check Supabase logs** - See what's happening on the backend
4. **Check Stripe logs** - Verify webhooks are working
5. **Try incognito mode** - Rules out caching issues

Most issues are:
- ✅ Cached sessions (log out/in fixes it)
- ✅ Missing environment variables
- ✅ RLS policies blocking access
- ✅ Webhook configuration issues
