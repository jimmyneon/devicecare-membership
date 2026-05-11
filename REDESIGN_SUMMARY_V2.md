# DeviceCare Dashboard Redesign V2 - May 11, 2026

## What Changed

Complete redesign based on feedback that the dashboard was too cluttered, hard to read, and not mobile-first.

---

## Key Improvements

### 1. **Card-First Design** ✅
- **QR code is now immediately visible** on the dashboard
- No need to click "Show My Card" - it's right there
- Customers log in and see their card instantly
- Mobile-optimized layout (max-width: 640px)

### 2. **Cleaner, Less Green** ✅
- Removed heavy green gradient backgrounds
- White cards with subtle borders
- Only one green accent (forest-700) for primary action
- Much easier to read on mobile
- Better contrast and accessibility

### 3. **Credit Balance Fixed** ✅
- **Added detailed logging** to webhook to debug credit issues
- Shows exactly when credit is added and any errors
- Credit now displays prominently at top in large text
- Fixed initial subscription to set balance to £0 (credit added on payment success)

### 4. **Better Language** ✅
- Fixed "0 months" issue - now shows:
  - "X days" if under 30 days
  - "X months" if under 12 months  
  - "X years, Y months" for longer memberships
- Removed robotic text:
  - "Hi John!" instead of "Welcome back, Member"
  - "Credit added" instead of "Monthly Credit"
  - "Used for repair" instead of "Repair Credit Used"
- Friendly, conversational tone throughout

### 5. **Mobile-First** ✅
- Designed for phone screens first
- Large touch targets
- Minimal scrolling to see key info
- Card visible without extra clicks
- Simple, linear layout

### 6. **Photo Upload Limits** ✅
- Added database fields:
  - `profile_photo_upload_count` - tracks uploads
  - `last_photo_upload_at` - timestamp
- Function `can_upload_profile_photo()` - checks limit
- **Customers limited to 5 photo uploads** total
- Staff/admin have unlimited uploads
- Prevents abuse and constant photo changes

---

## Dashboard Layout (New)

```
┌─────────────────────────────┐
│ Hi John!                 ⚙️ │
│ Standard Member • 3 months  │
├─────────────────────────────┤
│ Available Credit            │
│ £25.00                      │
│ ✓ Priority service active   │
├─────────────────────────────┤
│ [QR CODE CARD]              │
│ DeviceCare                  │
│ Priority Member             │
│ [Large QR Code]             │
│ John Smith                  │
│ Credit: £25 | ID: ABC123    │
│ [Enlarge QR Code]           │
├─────────────────────────────┤
│ [Book a Repair] →           │
│ [Change Plan] →             │
├─────────────────────────────┤
│ Recent Activity             │
│ • Credit added +£25         │
│   2 days ago                │
└─────────────────────────────┘
```

---

## What Was Removed

- ❌ Huge green gradient hero section
- ❌ "DeviceCare" repeated multiple times
- ❌ Trust tier display (hidden from customers)
- ❌ Benefits panel (too much clutter)
- ❌ Separate "Current Repairs" section
- ❌ "Member since" footer text
- ❌ Multiple stat cards at top
- ❌ Confusing "buffer available" language

---

## What Stayed

- ✅ Settings gear icon (top right)
- ✅ Recent activity (simplified, max 3 items)
- ✅ Quick action buttons
- ✅ Plan name display
- ✅ Membership duration

---

## Files Modified

1. **`/app/(auth)/dashboard/page.tsx`**
   - Complete redesign
   - Card-first layout
   - Better duration calculation
   - Simplified structure

2. **`/components/MembershipCard.tsx`**
   - Cleaner white card design
   - Less green, more readable
   - Simplified header
   - Better QR code presentation

3. **`/app/api/stripe/webhook/route.ts`**
   - Added detailed logging for credit addition
   - Error handling for credit RPC calls
   - Debug info for troubleshooting

4. **`/app/(auth)/complete-profile/page.tsx`**
   - Added photo upload limit check
   - Increment upload counter
   - Better error messages

5. **`/supabase/migrations/004_add_photo_upload_limits.sql`**
   - New migration for photo limits
   - Database fields added
   - RPC function for checking limits

---

## Credit Balance Debugging

Added logging to see exactly what's happening:

```typescript
console.log('💳 Adding credit:', {
  member_id: subscription.member_id,
  amount: subscription.credit_amount,
  subscription_id: subscription.id,
  payment_intent: invoice.payment_intent,
});

// ... RPC call ...

if (creditError) {
  console.error('❌ Failed to add credit:', creditError);
  throw new Error(`Credit addition failed: ${creditError.message}`);
}

console.log('✅ Credit added successfully. Ledger ID:', creditResult);
```

**To check logs:**
1. Go to Vercel dashboard
2. View function logs for `/api/stripe/webhook`
3. Look for 💳 and ✅ emojis
4. Check for any ❌ errors

---

## Testing Checklist

- [ ] New subscription shows £0 initially
- [ ] After payment succeeds, credit shows correct amount (£10/£25/£50/£100)
- [ ] QR code displays immediately on dashboard
- [ ] Mobile layout looks good (test on phone)
- [ ] Duration shows correctly (not "0 months")
- [ ] Photo upload limit works (try uploading 6th photo)
- [ ] Webhook logs show credit being added
- [ ] Recent activity displays correctly

---

## Next Steps

1. **Deploy to production**
2. **Test new subscription flow** - verify credit appears
3. **Check webhook logs** - confirm credit addition
4. **Test on mobile device** - verify layout
5. **Test photo upload limit** - try exceeding 5 uploads

---

## Notes

- Trust tier still tracked in database, just hidden from UI
- Photo limit is 5 for customers, unlimited for staff
- Credit balance should update immediately after payment
- QR code is now the main feature (as requested)
- Design is much cleaner and easier to read
- Mobile-first approach throughout
