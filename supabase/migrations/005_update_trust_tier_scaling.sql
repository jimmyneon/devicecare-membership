-- Update trust tier calculation to scale buffer with plan tier
-- Higher paying members get higher buffers (reduces risk)

-- Drop and recreate the function with new logic
DROP FUNCTION IF EXISTS update_trust_tier(UUID);

CREATE OR REPLACE FUNCTION update_trust_tier(p_member_id UUID)
RETURNS VOID AS $$
DECLARE
    v_old_tier trust_tier;
    v_new_tier trust_tier;
    v_old_limit DECIMAL(10, 2);
    v_new_limit DECIMAL(10, 2);
    v_is_override BOOLEAN;
    v_plan_tier INTEGER;
    v_monthly_credit DECIMAL(10, 2);
BEGIN
    -- Get current tier and plan info
    SELECT trust_tier, negative_balance_limit, is_trust_override, current_plan_tier, monthly_credit_amount
    INTO v_old_tier, v_old_limit, v_is_override, v_plan_tier, v_monthly_credit
    FROM members
    WHERE id = p_member_id;
    
    -- Don't update if manually overridden
    IF v_is_override THEN
        RETURN;
    END IF;
    
    -- Calculate new tier
    v_new_tier := calculate_trust_tier(p_member_id);
    
    -- Set limit based on tier AND plan tier (scales with monthly payment)
    -- This reduces risk - buffer is proportional to monthly payment
    -- 
    -- NEW members (< 2 months): £0 buffer regardless of plan
    -- TRUSTED members (2+ months, 90%+ success): 2x their monthly credit
    --   - Starter £10/mo → £20 buffer
    --   - Standard £25/mo → £50 buffer
    --   - Premium £50/mo → £100 buffer
    --   - Elite £100/mo → £200 buffer
    -- 
    -- GOLD members (6+ months, 95%+ success): 3x their monthly credit
    --   - Starter £10/mo → £30 buffer
    --   - Standard £25/mo → £75 buffer
    --   - Premium £50/mo → £150 buffer
    --   - Elite £100/mo → £300 buffer
    
    v_new_limit := CASE v_new_tier
        WHEN 'NEW' THEN 0.00
        WHEN 'TRUSTED' THEN v_monthly_credit * 2
        WHEN 'GOLD' THEN v_monthly_credit * 3
        WHEN 'RESTRICTED' THEN 0.00
    END;
    
    -- Update if changed
    IF v_old_tier != v_new_tier OR v_old_limit != v_new_limit THEN
        UPDATE members
        SET trust_tier = v_new_tier,
            negative_balance_limit = v_new_limit,
            updated_at = NOW()
        WHERE id = p_member_id;
        
        -- Log the change
        INSERT INTO trust_level_history (member_id, old_tier, new_tier, old_limit, new_limit)
        VALUES (p_member_id, v_old_tier, v_new_tier, v_old_limit, v_new_limit);
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_trust_tier IS 'Update member trust tier and buffer (scales with monthly payment to reduce risk)';

-- Update all existing members to use new scaling
-- This will recalculate buffers based on their current plan tier
DO $$
DECLARE
    member_record RECORD;
BEGIN
    FOR member_record IN SELECT id FROM members WHERE role = 'CUSTOMER' LOOP
        PERFORM update_trust_tier(member_record.id);
    END LOOP;
END $$;
