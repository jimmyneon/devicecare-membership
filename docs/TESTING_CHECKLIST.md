# DeviceCare Membership - Testing Checklist

Comprehensive testing scenarios for production deployment.

---

## ✅ Authentication Flow

### Magic Link Login
- [ ] User enters email
- [ ] Magic link email sent successfully
- [ ] Link opens app and authenticates user
- [ ] Invalid/expired links show error
- [ ] Already authenticated users redirect to dashboard

### Session Management
- [ ] Session persists across page refreshes
- [ ] Session expires after timeout
- [ ] Logout clears session completely
- [ ] Protected routes redirect to login

---

## ✅ Onboarding Flow

### New Member Signup
- [ ] User selects subscription plan
- [ ] Email validation works
- [ ] Stripe payment method collection
- [ ] Card validation (test cards)
- [ ] Subscription created in Stripe
- [ ] Member record created in database
- [ ] Initial credit NOT added (first payment triggers it)
- [ ] Welcome email sent
- [ ] Redirect to dashboard

### Edge Cases
- [ ] Duplicate email shows error
- [ ] Invalid card declined
- [ ] Network error during signup
- [ ] User abandons mid-flow
- [ ] Stripe webhook delayed

---

## ✅ Subscription Management

### Plan Selection
- [ ] All 4 tiers display correctly
- [ ] Prices match Stripe configuration
- [ ] Credit amounts shown clearly
- [ ] Plan comparison visible

### Plan Changes
- [ ] Upgrade to higher tier
- [ ] Downgrade to lower tier
- [ ] Proration calculated correctly
- [ ] Credit adjustment on change
- [ ] Stripe subscription updated
- [ ] Database reflects change

### Pause Membership
- [ ] Pause button available
- [ ] Pause count tracked
- [ ] Max 2 pauses per year enforced
- [ ] Status changes to PAUSED
- [ ] Credit accrual stops
- [ ] Perks disabled
- [ ] Resume button works
- [ ] Cannot pause if negative balance

### Cancel Membership
- [ ] Cancel button accessible (not prominent)
- [ ] Confirmation modal shown
- [ ] Credit forfeiture warning displayed
- [ ] Status changes to CANCELLED
- [ ] Stripe subscription cancelled
- [ ] Credit balance zeroed
- [ ] Perks immediately disabled
- [ ] Cannot cancel if negative balance

---

## ✅ Payment Processing

### Successful Payments
- [ ] Stripe webhook received
- [ ] Subscription status updated
- [ ] Credit added to ledger
- [ ] Credit expires in 12 months
- [ ] Member balance updated
- [ ] Next billing date set
- [ ] Payment confirmation email sent

### Failed Payments
- [ ] Day 0: Status → GRACE
- [ ] Day 3: Auto-retry #1
- [ ] Day 5: Auto-retry #2
- [ ] Day 7: Status → LOCKED
- [ ] Perks disabled when locked
- [ ] Credit usage blocked
- [ ] Email notifications sent
- [ ] Successful retry unlocks account

### Webhook Handling
- [ ] Signature verification
- [ ] Idempotency (duplicate webhooks)
- [ ] All event types handled:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`

---

## ✅ Credit System

### Credit Accrual
- [ ] Monthly credit added on payment
- [ ] Correct amount based on tier
- [ ] Expiry date set to +12 months
- [ ] Ledger entry created
- [ ] Balance updated
- [ ] Lifetime earned incremented

### Credit Usage (FIFO)
- [ ] Oldest credits used first
- [ ] Multiple credit sources handled
- [ ] Partial deductions work
- [ ] Ledger entries accurate
- [ ] Balance updated correctly
- [ ] Lifetime used incremented

### Credit Expiry
- [ ] Cron job runs daily
- [ ] Expired credits identified
- [ ] Remaining amount zeroed
- [ ] Expiry ledger entry created
- [ ] Member balance updated
- [ ] Email notification sent

### Negative Balance
- [ ] NEW tier: £0 buffer (no negative)
- [ ] TRUSTED tier: £50 buffer allowed
- [ ] GOLD tier: £80 buffer allowed
- [ ] RESTRICTED tier: £0 buffer
- [ ] Cannot pause/cancel when negative
- [ ] Balance constraint enforced

### Max Credit Cap
- [ ] Default £300 cap enforced
- [ ] Accrual stops at cap
- [ ] Warning shown to user
- [ ] Admin can override

---

## ✅ Top-Up System

### Purchase Flow
- [ ] Amount selection (£10/£25/£50/custom)
- [ ] Stripe payment intent created
- [ ] Card charged successfully
- [ ] Credit added to ledger
- [ ] Expiry date set (+12 months)
- [ ] Balance updated
- [ ] Receipt email sent

### Edge Cases
- [ ] Payment declined
- [ ] Network error
- [ ] Duplicate submission prevented
- [ ] Minimum amount enforced (£5)
- [ ] Maximum amount enforced (£500)

---

## ✅ Trust System

### Automatic Tier Calculation
- [ ] NEW: < 2 months subscribed
- [ ] TRUSTED: 2+ months, 90%+ success rate
- [ ] GOLD: 6+ months, 95%+ success rate
- [ ] Tier updated after each payment
- [ ] Negative balance limit set correctly
- [ ] History logged

### Manual Overrides
- [ ] Admin can set tier manually
- [ ] Override flag prevents auto-update
- [ ] Custom limits can be set
- [ ] RESTRICTED tier blocks credit use
- [ ] History logged with admin ID

---

## ✅ Customer Dashboard

### Display Elements
- [ ] Membership status badge
- [ ] Current credit balance (large, clear)
- [ ] Available buffer shown
- [ ] Next billing date
- [ ] Plan tier name
- [ ] Member since date
- [ ] Lifetime value used
- [ ] Recent transactions list

### Actions
- [ ] View full transaction history
- [ ] Change plan
- [ ] Add payment method
- [ ] Update profile
- [ ] Pause membership
- [ ] Cancel membership
- [ ] Top-up credit

---

## ✅ Membership Card

### Display
- [ ] Large, clear card UI
- [ ] QR code generated correctly
- [ ] QR code scans to member ID
- [ ] Status indicator (active/locked)
- [ ] Credit balance visible
- [ ] Member name shown
- [ ] Plan tier displayed

### Functionality
- [ ] QR code scannable by staff app
- [ ] NFC URL endpoint works
- [ ] Locked status prevents usage
- [ ] Real-time status updates

### Printable Version
- [ ] Print-friendly layout
- [ ] High-quality QR code
- [ ] Business branding
- [ ] Clear instructions

---

## ✅ Staff Panel

### Member Lookup
- [ ] QR code scanning works
- [ ] Manual search by email/phone
- [ ] Member loads instantly
- [ ] All details visible:
  - [ ] Name
  - [ ] Status
  - [ ] Credit balance
  - [ ] Buffer available
  - [ ] Trust tier

### Repair Processing
- [ ] Enter repair amount
- [ ] Quick buttons (£20/£40/£60)
- [ ] Credit usage option
- [ ] Partial payment (credit + cash)
- [ ] Parts cost separate field
- [ ] Insufficient credit warning
- [ ] Negative balance allowed (if trusted)
- [ ] Confirmation screen
- [ ] Receipt generated

### Edge Cases
- [ ] Locked member cannot use credit
- [ ] Negative balance exceeds limit
- [ ] Zero credit balance
- [ ] Parts-only transaction
- [ ] Cash-only option available

---

## ✅ Admin Dashboard

### Member Management
- [ ] View all members
- [ ] Search/filter functionality
- [ ] Sort by various fields
- [ ] Member detail view
- [ ] Edit member details
- [ ] Lock/unlock accounts
- [ ] Adjust credit manually
- [ ] Override trust tier

### Financial Overview
- [ ] Total active members
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Credit liability (outstanding credits)
- [ ] Average credit usage
- [ ] Revenue by tier
- [ ] Failed payment count

### Reports
- [ ] Export member list (CSV)
- [ ] Export transactions (CSV)
- [ ] Monthly revenue report
- [ ] Credit expiry forecast
- [ ] Churn analysis

### Manual Actions
- [ ] Add credit to member
- [ ] Deduct credit (with reason)
- [ ] Change trust tier
- [ ] Lock account
- [ ] Unlock account
- [ ] Refund transaction
- [ ] Cancel subscription

---

## ✅ Email Notifications

### Transactional Emails
- [ ] Welcome email (signup)
- [ ] Payment success
- [ ] Payment failed
- [ ] Account locked
- [ ] Credit expiring soon (30 days)
- [ ] Credit expired
- [ ] Top-up receipt
- [ ] Subscription cancelled
- [ ] Subscription paused
- [ ] Subscription resumed

### Email Content
- [ ] Correct branding
- [ ] Clear subject lines
- [ ] Mobile-responsive
- [ ] Unsubscribe link (where applicable)
- [ ] Support contact info

---

## ✅ Security

### Authentication
- [ ] Magic links expire after 1 hour
- [ ] One-time use only
- [ ] Session tokens secure
- [ ] HTTPS enforced
- [ ] CSRF protection

### Authorization
- [ ] RLS policies enforced
- [ ] Customers see only own data
- [ ] Staff see all members
- [ ] Admins have full access
- [ ] API routes protected

### Data Protection
- [ ] PCI compliance (Stripe handles cards)
- [ ] No card numbers stored
- [ ] Personal data encrypted
- [ ] Audit logs for sensitive actions
- [ ] GDPR compliance

---

## ✅ Performance

### Load Times
- [ ] Dashboard < 2s
- [ ] Membership card < 1s
- [ ] Staff lookup < 1s
- [ ] Admin dashboard < 3s

### Database
- [ ] Indexes on key fields
- [ ] Query optimization
- [ ] Connection pooling
- [ ] No N+1 queries

### Caching
- [ ] Member data cached
- [ ] Static assets cached
- [ ] API responses cached (where safe)

---

## ✅ Mobile Responsiveness

### Customer App
- [ ] Dashboard mobile-friendly
- [ ] Membership card full-screen
- [ ] Forms easy to fill
- [ ] Buttons large enough
- [ ] Text readable

### Staff App
- [ ] QR scanner works on mobile
- [ ] Quick actions accessible
- [ ] Amount entry easy
- [ ] Confirmation clear

---

## ✅ Edge Cases & Error Handling

### Network Issues
- [ ] Offline detection
- [ ] Retry logic for failed requests
- [ ] User-friendly error messages
- [ ] Data not lost on error

### Concurrent Actions
- [ ] Multiple staff using same member
- [ ] Simultaneous credit usage
- [ ] Race conditions handled
- [ ] Optimistic locking where needed

### Data Integrity
- [ ] Credit balance always matches ledger
- [ ] No orphaned records
- [ ] Foreign key constraints enforced
- [ ] Transaction rollback on error

---

## ✅ Deployment

### Pre-Deployment
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Stripe products configured
- [ ] Webhook endpoint registered
- [ ] DNS configured
- [ ] SSL certificate valid

### Post-Deployment
- [ ] Health check endpoint responds
- [ ] Database connections work
- [ ] Stripe webhooks received
- [ ] Email sending works
- [ ] Logs accessible
- [ ] Monitoring active

### Rollback Plan
- [ ] Previous version tagged
- [ ] Rollback procedure documented
- [ ] Database backup recent
- [ ] Downtime window communicated

---

## ✅ User Acceptance Testing

### Customer Journey
- [ ] Signup → First payment → Dashboard
- [ ] Use credit for repair
- [ ] Top-up credit
- [ ] Pause membership
- [ ] Resume membership
- [ ] Cancel membership

### Staff Journey
- [ ] Scan member QR
- [ ] Process repair
- [ ] Handle partial payment
- [ ] Deal with locked member

### Admin Journey
- [ ] View dashboard
- [ ] Adjust member credit
- [ ] Lock account
- [ ] Generate report

---

## 📊 Success Criteria

- [ ] All critical paths tested
- [ ] No P0/P1 bugs remaining
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Stakeholder approval
- [ ] Documentation complete

---

## 🐛 Known Issues

Document any known issues here with severity and workaround:

1. **Issue**: [Description]
   - **Severity**: P0/P1/P2/P3
   - **Workaround**: [Steps]
   - **Fix ETA**: [Date]

---

## 📝 Test Results

| Test Category | Pass | Fail | Notes |
|---------------|------|------|-------|
| Authentication | - | - | |
| Onboarding | - | - | |
| Payments | - | - | |
| Credit System | - | - | |
| Staff Panel | - | - | |
| Admin Dashboard | - | - | |
| Security | - | - | |
| Performance | - | - | |

**Last Updated**: [Date]  
**Tested By**: [Name]  
**Environment**: [Dev/Staging/Production]
