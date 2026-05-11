# User Roles Explained

## The 3 Roles in DeviceCare

### **CUSTOMER** (Default)
- **Who:** All paying members
- **Access:**
  - Their own dashboard
  - View their credit balance
  - View their membership card (QR code)
  - Top up credit
  - Change their plan
  - View their transaction history
  - Update profile
- **Cannot:**
  - See other members
  - Access admin pages
  - Scan QR codes
  - Process repairs
  - Change system settings

### **STAFF**
- **Who:** Shop employees, repair technicians
- **Access:**
  - Everything CUSTOMER can do (if they also have a membership)
  - `/admin` dashboard
  - `/admin/scan` - QR code scanner
  - View all members
  - Process credit usage (deduct for repairs)
  - View member details (credit, status, history)
- **Cannot:**
  - Change system settings
  - Modify trust tiers manually
  - Access sensitive admin functions
  - Delete members

### **ADMIN**
- **Who:** Business owners, managers
- **Access:**
  - Everything STAFF can do
  - Full system access
  - Can manually override trust tiers
  - Can modify member accounts
  - Can access all settings
  - Can promote users to STAFF/ADMIN
  - Full database access via RLS bypass

---

## How It Works Technically

### Database Column
```sql
role user_role NOT NULL DEFAULT 'CUSTOMER'
```

Where `user_role` is an enum:
```sql
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');
```

### Row Level Security (RLS)
- **CUSTOMER:** Can only see their own data
- **STAFF:** Can see all members (read-only mostly)
- **ADMIN:** Bypasses most RLS policies (full access)

### Middleware Protection
Routes are protected in the app:
- `/dashboard` - All authenticated users
- `/admin/*` - STAFF and ADMIN only
- `/admin/settings/*` - ADMIN only (future)

---

## Common Scenarios

### Scenario 1: New Member Signs Up
1. Creates account → Role = **CUSTOMER**
2. Can access their dashboard
3. Can view their card
4. Can top up credit

### Scenario 2: Hiring a New Employee
1. Employee signs up as normal (gets CUSTOMER role)
2. Admin runs SQL:
   ```sql
   UPDATE members 
   SET role = 'STAFF'
   WHERE email = 'employee@example.com';
   ```
3. Employee logs out and back in
4. Now has access to `/admin` and scanner

### Scenario 3: Promoting to Admin
1. Staff member needs full access
2. Admin runs SQL:
   ```sql
   UPDATE members 
   SET role = 'ADMIN'
   WHERE email = 'manager@example.com';
   ```
3. They now have full system access

---

## Best Practices

### For Security:
1. **Minimize ADMIN accounts** - Only 1-2 trusted people
2. **Most employees should be STAFF** - They don't need full access
3. **Never give customers STAFF/ADMIN** - Even if they ask nicely!

### For Your Shop:
- **You:** ADMIN
- **Manager/Partner:** ADMIN (if fully trusted)
- **Repair Technicians:** STAFF
- **Counter Staff:** STAFF
- **Paying Members:** CUSTOMER

---

## Changing Roles

### Via Supabase Dashboard:
1. Go to Table Editor → `members`
2. Find the user by email
3. Edit the `role` column
4. Save

### Via SQL:
```sql
-- Make someone STAFF
UPDATE members 
SET role = 'STAFF'
WHERE email = 'their-email@example.com';

-- Make someone ADMIN
UPDATE members 
SET role = 'ADMIN'
WHERE email = 'their-email@example.com';

-- Demote back to CUSTOMER
UPDATE members 
SET role = 'CUSTOMER'
WHERE email = 'their-email@example.com';
```

---

## What Each Role Sees

### CUSTOMER Dashboard:
- Hi John!
- Available Credit: £25.00
- Membership Card (QR code)
- Book a Repair
- Top Up Credit
- Change Plan

### STAFF Dashboard:
- Admin Dashboard link appears
- Can scan QR codes
- Can view all members
- Can process repairs
- Still has their own customer dashboard if they're also a member

### ADMIN Dashboard:
- Everything STAFF sees
- Plus: System settings (future)
- Plus: Can override trust tiers
- Plus: Full member management

---

## Future Enhancements

Potential additional roles:
- **MANAGER** - Between STAFF and ADMIN (can view reports but not change settings)
- **READONLY** - Can view but not modify (for accountants, etc.)

For now, the 3-role system is simple and covers all needs.
