-- DeviceCare Membership Database Schema
-- Production-ready schema for subscription-based repair credit system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CLEANUP - Drop existing objects if they exist
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS update_trust_tier(UUID);
DROP FUNCTION IF EXISTS calculate_trust_tier(UUID);
DROP FUNCTION IF EXISTS expire_old_credits();
DROP FUNCTION IF EXISTS add_credit(UUID, DECIMAL, transaction_type, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS use_credit(UUID, DECIMAL, UUID, TEXT);
DROP FUNCTION IF EXISTS get_available_credit(UUID);
DROP FUNCTION IF EXISTS calculate_credit_balance(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop existing types (will recreate them)
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS trust_tier CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE membership_status AS ENUM ('ACTIVE', 'GRACE', 'LOCKED', 'PAUSED', 'CANCELLED');
CREATE TYPE trust_tier AS ENUM ('NEW', 'TRUSTED', 'GOLD', 'RESTRICTED');
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');
CREATE TYPE transaction_type AS ENUM ('ACCRUAL', 'USAGE', 'TOPUP', 'ADJUSTMENT', 'EXPIRY', 'REFUND');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Members table (extends Supabase auth.users)
CREATE TABLE members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    
    -- Profile information
    profile_photo_url TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postcode TEXT,
    profile_completed BOOLEAN DEFAULT FALSE,
    profile_completed_at TIMESTAMPTZ,
    
    -- Membership details
    membership_status membership_status NOT NULL DEFAULT 'ACTIVE',
    member_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Current subscription
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    current_plan_tier INTEGER CHECK (current_plan_tier IN (1, 2, 3, 4)),
    monthly_credit_amount DECIMAL(10, 2),
    next_billing_date TIMESTAMPTZ,
    
    -- Credit tracking
    current_credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_credits_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_credits_used DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Trust system
    trust_tier trust_tier NOT NULL DEFAULT 'NEW',
    negative_balance_limit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_trust_override BOOLEAN DEFAULT FALSE,
    
    -- Pause tracking
    pause_count_this_year INTEGER NOT NULL DEFAULT 0,
    last_pause_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_credit_balance CHECK (current_credit_balance >= -negative_balance_limit),
    CONSTRAINT valid_plan_tier CHECK (current_plan_tier IS NULL OR current_plan_tier BETWEEN 1 AND 4)
);

-- Subscriptions table (tracks Stripe subscription lifecycle)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    
    -- Plan details
    plan_tier INTEGER NOT NULL CHECK (plan_tier IN (1, 2, 3, 4)),
    monthly_amount DECIMAL(10, 2) NOT NULL,
    credit_amount DECIMAL(10, 2) NOT NULL,
    
    -- Status tracking
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    
    -- Payment tracking
    last_payment_date TIMESTAMPTZ,
    last_payment_status TEXT,
    failed_payment_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit ledger (immutable transaction log)
CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    
    -- Credit lifecycle (for ACCRUAL and TOPUP)
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT FALSE,
    remaining_amount DECIMAL(10, 2),
    
    -- References
    subscription_id UUID REFERENCES subscriptions(id),
    usage_id UUID,
    stripe_payment_intent_id TEXT,
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT expiry_for_accrual CHECK (
        (transaction_type IN ('ACCRUAL', 'TOPUP') AND expires_at IS NOT NULL) OR
        (transaction_type NOT IN ('ACCRUAL', 'TOPUP') AND expires_at IS NULL)
    )
);

-- Credit usage (repair transactions)
CREATE TABLE credit_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Transaction details
    repair_amount DECIMAL(10, 2) NOT NULL,
    credit_used DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cash_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Parts tracking (always paid separately)
    parts_cost DECIMAL(10, 2) DEFAULT 0.00,
    parts_paid_separately BOOLEAN DEFAULT TRUE,
    
    -- Staff tracking
    processed_by UUID REFERENCES members(id),
    
    -- Metadata
    repair_description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_payment CHECK (credit_used + cash_paid = repair_amount),
    CONSTRAINT positive_amounts CHECK (
        repair_amount >= 0 AND 
        credit_used >= 0 AND 
        cash_paid >= 0 AND 
        parts_cost >= 0
    )
);

-- Top-ups (one-time credit purchases)
CREATE TABLE topups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    payment_status TEXT NOT NULL,
    
    -- Credit tracking
    credit_ledger_id UUID REFERENCES credit_ledger(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Payment methods (Stripe saved cards)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trust level history (audit trail)
CREATE TABLE trust_level_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Change details
    old_tier trust_tier,
    new_tier trust_tier NOT NULL,
    old_limit DECIMAL(10, 2),
    new_limit DECIMAL(10, 2) NOT NULL,
    
    -- Reason
    reason TEXT NOT NULL,
    is_manual BOOLEAN DEFAULT FALSE,
    changed_by UUID REFERENCES members(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin settings (system configuration)
CREATE TABLE admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES members(id)
);

-- Membership pause history
CREATE TABLE pause_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Pause period
    paused_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resumed_at TIMESTAMPTZ,
    
    -- Metadata
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Members
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_stripe_customer ON members(stripe_customer_id);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_role ON members(role);

-- Subscriptions
CREATE INDEX idx_subscriptions_member ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Credit ledger
CREATE INDEX idx_ledger_member ON credit_ledger(member_id);
CREATE INDEX idx_ledger_type ON credit_ledger(transaction_type);
CREATE INDEX idx_ledger_expires ON credit_ledger(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ledger_created ON credit_ledger(created_at DESC);

-- Credit usage
CREATE INDEX idx_usage_member ON credit_usage(member_id);
CREATE INDEX idx_usage_created ON credit_usage(created_at DESC);
CREATE INDEX idx_usage_processed_by ON credit_usage(processed_by);

-- Top-ups
CREATE INDEX idx_topups_member ON topups(member_id);
CREATE INDEX idx_topups_stripe_intent ON topups(stripe_payment_intent_id);

-- Payment methods
CREATE INDEX idx_payment_methods_member ON payment_methods(member_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(member_id, is_default) WHERE is_default = TRUE;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate member credit balance from ledger
CREATE OR REPLACE FUNCTION calculate_credit_balance(p_member_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    v_balance DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type IN ('ACCRUAL', 'TOPUP', 'ADJUSTMENT', 'REFUND') THEN amount
            WHEN transaction_type IN ('USAGE', 'EXPIRY') THEN -amount
            ELSE 0
        END
    ), 0.00)
    INTO v_balance
    FROM credit_ledger
    WHERE member_id = p_member_id;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Get available credit (excluding expired)
CREATE OR REPLACE FUNCTION get_available_credit(p_member_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    v_available DECIMAL(10, 2);
BEGIN
    -- Sum all unexpired accruals/topups minus usage
    SELECT COALESCE(SUM(remaining_amount), 0.00)
    INTO v_available
    FROM credit_ledger
    WHERE member_id = p_member_id
        AND transaction_type IN ('ACCRUAL', 'TOPUP')
        AND is_expired = FALSE
        AND remaining_amount > 0;
    
    RETURN v_available;
END;
$$ LANGUAGE plpgsql;

-- Use credit (FIFO logic)
CREATE OR REPLACE FUNCTION use_credit(
    p_member_id UUID,
    p_amount DECIMAL(10, 2),
    p_usage_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_remaining DECIMAL(10, 2) := p_amount;
    v_credit_record RECORD;
    v_to_deduct DECIMAL(10, 2);
    v_new_balance DECIMAL(10, 2);
BEGIN
    -- Check available credit
    IF get_available_credit(p_member_id) < p_amount THEN
        RAISE EXCEPTION 'Insufficient credit available';
    END IF;
    
    -- Deduct from oldest credits first (FIFO)
    FOR v_credit_record IN
        SELECT id, remaining_amount
        FROM credit_ledger
        WHERE member_id = p_member_id
            AND transaction_type IN ('ACCRUAL', 'TOPUP')
            AND is_expired = FALSE
            AND remaining_amount > 0
        ORDER BY created_at ASC
    LOOP
        v_to_deduct := LEAST(v_remaining, v_credit_record.remaining_amount);
        
        UPDATE credit_ledger
        SET remaining_amount = remaining_amount - v_to_deduct
        WHERE id = v_credit_record.id;
        
        v_remaining := v_remaining - v_to_deduct;
        
        EXIT WHEN v_remaining <= 0;
    END LOOP;
    
    -- Record usage in ledger
    v_new_balance := calculate_credit_balance(p_member_id) - p_amount;
    
    INSERT INTO credit_ledger (
        member_id,
        transaction_type,
        amount,
        balance_after,
        usage_id,
        notes
    ) VALUES (
        p_member_id,
        'USAGE',
        p_amount,
        v_new_balance,
        p_usage_id,
        p_description
    );
    
    -- Update member balance
    UPDATE members
    SET current_credit_balance = v_new_balance,
        lifetime_credits_used = lifetime_credits_used + p_amount,
        updated_at = NOW()
    WHERE id = p_member_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add credit (from subscription or top-up)
CREATE OR REPLACE FUNCTION add_credit(
    p_member_id UUID,
    p_amount DECIMAL(10, 2),
    p_transaction_type transaction_type,
    p_subscription_id UUID DEFAULT NULL,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_ledger_id UUID;
    v_new_balance DECIMAL(10, 2);
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Set expiry date (12 months from now)
    v_expires_at := NOW() + INTERVAL '12 months';
    
    -- Calculate new balance
    v_new_balance := calculate_credit_balance(p_member_id) + p_amount;
    
    -- Insert into ledger
    INSERT INTO credit_ledger (
        member_id,
        transaction_type,
        amount,
        balance_after,
        expires_at,
        remaining_amount,
        subscription_id,
        stripe_payment_intent_id,
        notes
    ) VALUES (
        p_member_id,
        p_transaction_type,
        p_amount,
        v_new_balance,
        v_expires_at,
        p_amount,
        p_subscription_id,
        p_stripe_payment_intent_id,
        p_notes
    ) RETURNING id INTO v_ledger_id;
    
    -- Update member balance
    UPDATE members
    SET current_credit_balance = v_new_balance,
        lifetime_credits_earned = lifetime_credits_earned + p_amount,
        updated_at = NOW()
    WHERE id = p_member_id;
    
    RETURN v_ledger_id;
END;
$$ LANGUAGE plpgsql;

-- Expire old credits
CREATE OR REPLACE FUNCTION expire_old_credits()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_credit_record RECORD;
BEGIN
    FOR v_credit_record IN
        SELECT id, member_id, remaining_amount
        FROM credit_ledger
        WHERE transaction_type IN ('ACCRUAL', 'TOPUP')
            AND is_expired = FALSE
            AND expires_at < NOW()
            AND remaining_amount > 0
    LOOP
        -- Mark as expired
        UPDATE credit_ledger
        SET is_expired = TRUE,
            remaining_amount = 0
        WHERE id = v_credit_record.id;
        
        -- Record expiry transaction
        INSERT INTO credit_ledger (
            member_id,
            transaction_type,
            amount,
            balance_after,
            notes
        ) VALUES (
            v_credit_record.member_id,
            'EXPIRY',
            v_credit_record.remaining_amount,
            calculate_credit_balance(v_credit_record.member_id) - v_credit_record.remaining_amount,
            'Credit expired after 12 months'
        );
        
        -- Update member balance
        UPDATE members
        SET current_credit_balance = calculate_credit_balance(v_credit_record.member_id)
        WHERE id = v_credit_record.member_id;
        
        v_expired_count := v_expired_count + 1;
    END LOOP;
    
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Calculate trust tier
CREATE OR REPLACE FUNCTION calculate_trust_tier(p_member_id UUID)
RETURNS trust_tier AS $$
DECLARE
    v_months_subscribed INTEGER;
    v_payment_success_rate DECIMAL(5, 2);
    v_total_payments INTEGER;
    v_successful_payments INTEGER;
    v_is_restricted BOOLEAN;
BEGIN
    -- Check if manually restricted
    SELECT trust_tier = 'RESTRICTED' AND is_trust_override
    INTO v_is_restricted
    FROM members
    WHERE id = p_member_id;
    
    IF v_is_restricted THEN
        RETURN 'RESTRICTED';
    END IF;
    
    -- Calculate months subscribed
    SELECT EXTRACT(MONTH FROM AGE(NOW(), member_since))
    INTO v_months_subscribed
    FROM members
    WHERE id = p_member_id;
    
    -- Calculate payment success rate
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE last_payment_status = 'succeeded')
    INTO v_total_payments, v_successful_payments
    FROM subscriptions
    WHERE member_id = p_member_id
        AND last_payment_date IS NOT NULL;
    
    IF v_total_payments > 0 THEN
        v_payment_success_rate := (v_successful_payments::DECIMAL / v_total_payments) * 100;
    ELSE
        v_payment_success_rate := 100;
    END IF;
    
    -- Determine tier
    IF v_months_subscribed >= 6 AND v_payment_success_rate >= 95 THEN
        RETURN 'GOLD';
    ELSIF v_months_subscribed >= 2 AND v_payment_success_rate >= 90 THEN
        RETURN 'TRUSTED';
    ELSE
        RETURN 'NEW';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update trust tier and limits
CREATE OR REPLACE FUNCTION update_trust_tier(p_member_id UUID)
RETURNS VOID AS $$
DECLARE
    v_old_tier trust_tier;
    v_new_tier trust_tier;
    v_old_limit DECIMAL(10, 2);
    v_new_limit DECIMAL(10, 2);
    v_is_override BOOLEAN;
BEGIN
    -- Get current tier
    SELECT trust_tier, negative_balance_limit, is_trust_override
    INTO v_old_tier, v_old_limit, v_is_override
    FROM members
    WHERE id = p_member_id;
    
    -- Skip if manual override
    IF v_is_override THEN
        RETURN;
    END IF;
    
    -- Calculate new tier
    v_new_tier := calculate_trust_tier(p_member_id);
    
    -- Set limit based on tier
    v_new_limit := CASE v_new_tier
        WHEN 'NEW' THEN 0.00
        WHEN 'TRUSTED' THEN 50.00
        WHEN 'GOLD' THEN 80.00
        WHEN 'RESTRICTED' THEN 0.00
    END;
    
    -- Update if changed
    IF v_old_tier != v_new_tier OR v_old_limit != v_new_limit THEN
        UPDATE members
        SET trust_tier = v_new_tier,
            negative_balance_limit = v_new_limit,
            updated_at = NOW()
        WHERE id = p_member_id;
        
        -- Log change
        INSERT INTO trust_level_history (
            member_id,
            old_tier,
            new_tier,
            old_limit,
            new_limit,
            reason,
            is_manual
        ) VALUES (
            p_member_id,
            v_old_tier,
            v_new_tier,
            v_old_limit,
            v_new_limit,
            'Automatic tier calculation',
            FALSE
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_level_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pause_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Users can view own member record" ON members
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own member record" ON members
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff can view all members" ON members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN')
        )
    );

CREATE POLICY "Admins can update all members" ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Staff can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN')
        )
    );

-- Credit ledger policies
CREATE POLICY "Users can view own credit ledger" ON credit_ledger
    FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Staff can view all credit ledger" ON credit_ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN')
        )
    );

-- Credit usage policies
CREATE POLICY "Users can view own credit usage" ON credit_usage
    FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Staff can view and insert credit usage" ON credit_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN')
        )
    );

-- Top-ups policies
CREATE POLICY "Users can view own topups" ON topups
    FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Users can insert own topups" ON topups
    FOR INSERT WITH CHECK (member_id = auth.uid());

-- Payment methods policies
CREATE POLICY "Users can manage own payment methods" ON payment_methods
    FOR ALL USING (member_id = auth.uid());

-- Admin settings policies
CREATE POLICY "Admins can manage settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
    ('max_credit_cap', '300.00', 'Maximum credit balance allowed per member'),
    ('max_pause_per_year', '2', 'Maximum number of pauses allowed per year'),
    ('grace_period_days', '7', 'Days before locking account after failed payment'),
    ('credit_expiry_months', '12', 'Months before credit expires'),
    ('plan_tiers', '{
        "1": {"name": "Starter", "price": 10.00, "credit": 10.00},
        "2": {"name": "Standard", "price": 25.00, "credit": 25.00},
        "3": {"name": "Premium", "price": 50.00, "credit": 50.00},
        "4": {"name": "Elite", "price": 100.00, "credit": 100.00}
    }', 'Subscription plan tiers configuration')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE members IS 'Core member accounts and membership data';
COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking and lifecycle';
COMMENT ON TABLE credit_ledger IS 'Immutable ledger of all credit transactions';
COMMENT ON TABLE credit_usage IS 'Repair transactions using member credit';
COMMENT ON TABLE topups IS 'One-time credit purchases';
COMMENT ON TABLE payment_methods IS 'Saved payment methods from Stripe';
COMMENT ON TABLE trust_level_history IS 'Audit trail of trust tier changes';
COMMENT ON TABLE admin_settings IS 'System-wide configuration';

COMMENT ON FUNCTION calculate_credit_balance IS 'Calculate total credit balance from ledger';
COMMENT ON FUNCTION get_available_credit IS 'Get available credit excluding expired';
COMMENT ON FUNCTION use_credit IS 'Deduct credit using FIFO logic';
COMMENT ON FUNCTION add_credit IS 'Add credit from subscription or top-up';
COMMENT ON FUNCTION expire_old_credits IS 'Mark expired credits and update balances';
COMMENT ON FUNCTION calculate_trust_tier IS 'Calculate appropriate trust tier for member';
COMMENT ON FUNCTION update_trust_tier IS 'Update member trust tier and limits';
