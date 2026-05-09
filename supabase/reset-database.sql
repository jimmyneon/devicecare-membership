-- ============================================================================
-- RESET DATABASE - Run this FIRST to clean everything
-- ============================================================================
-- WARNING: This will delete ALL data in the DeviceCare Membership database
-- ============================================================================

-- Drop all policies first
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own topups" ON topups;
DROP POLICY IF EXISTS "Users can view own topups" ON topups;
DROP POLICY IF EXISTS "Staff can view and insert credit usage" ON credit_usage;
DROP POLICY IF EXISTS "Users can view own credit usage" ON credit_usage;
DROP POLICY IF EXISTS "Staff can view all credit ledger" ON credit_ledger;
DROP POLICY IF EXISTS "Users can view own credit ledger" ON credit_ledger;
DROP POLICY IF EXISTS "Staff can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all members" ON members;
DROP POLICY IF EXISTS "Staff can view all members" ON members;
DROP POLICY IF EXISTS "Users can update own member record" ON members;
DROP POLICY IF EXISTS "Users can view own member record" ON members;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_members_updated_at ON members;

-- Drop all tables (CASCADE will drop foreign key constraints)
DROP TABLE IF EXISTS pause_history CASCADE;
DROP TABLE IF EXISTS trust_level_history CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS topups CASCADE;
DROP TABLE IF EXISTS credit_usage CASCADE;
DROP TABLE IF EXISTS credit_ledger CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_trust_tier(UUID);
DROP FUNCTION IF EXISTS calculate_trust_tier(UUID);
DROP FUNCTION IF EXISTS expire_old_credits();
DROP FUNCTION IF EXISTS add_credit(UUID, DECIMAL, transaction_type, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS use_credit(UUID, DECIMAL, UUID, TEXT);
DROP FUNCTION IF EXISTS get_available_credit(UUID);
DROP FUNCTION IF EXISTS calculate_credit_balance(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop all types (CASCADE will handle dependencies)
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS trust_tier CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database reset complete. Now run schema.sql';
END $$;
