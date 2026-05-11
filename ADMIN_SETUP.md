# Admin Account Setup Guide

## Creating Your First Admin Account

### Step 1: Sign Up Normally
1. Go to `/login` and create an account
2. Complete the onboarding process
3. Note your email address

### Step 2: Set Admin Role in Database

Go to your Supabase dashboard and run this SQL:

```sql
-- Replace with your actual email
UPDATE members 
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

Or if you know your user ID:

```sql
UPDATE members 
SET role = 'ADMIN'
WHERE id = 'your-user-id-here';
```

### Step 3: Verify Admin Access

1. Log out and log back in
2. You should now have access to `/admin` routes
3. Check that you can see admin-only features

## Admin Roles

There are 3 roles in the system:

- **CUSTOMER** - Default for all members
- **STAFF** - Can scan QR codes, process repairs, view member details
- **ADMIN** - Full access to everything + settings

## Creating Additional Admin/Staff Accounts

Once you're an admin, you can promote other users:

```sql
-- Make someone STAFF
UPDATE members 
SET role = 'STAFF'
WHERE email = 'staff-member@example.com';

-- Make someone ADMIN
UPDATE members 
SET role = 'ADMIN'
WHERE email = 'another-admin@example.com';
```

## Security Notes

- Admin role bypasses RLS (Row Level Security) policies
- Staff can view all members but cannot modify system settings
- Keep admin accounts secure with strong passwords
- Consider enabling 2FA in Supabase for admin accounts
