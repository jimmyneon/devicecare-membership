-- Manual credit addition for jimmyneon@hotmail.com
-- Run this in Supabase SQL Editor to add the missing £25 initial credit

-- First, get the subscription UUID
DO $$
DECLARE
  v_subscription_id UUID;
BEGIN
  -- Get the subscription record UUID
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE member_id = 'd03b4213-027c-44b4-abf5-9fb465625d59'::uuid
  LIMIT 1;

  -- Add £25 credit
  PERFORM add_credit(
    'd03b4213-027c-44b4-abf5-9fb465625d59'::uuid,  -- p_member_id
    25.00,                                          -- p_amount
    'ACCRUAL',                                      -- p_transaction_type
    v_subscription_id,                              -- p_subscription_id (UUID from subscriptions table)
    'pi_3TVsISB11Tc1iEQi1x4oJsue',                 -- p_stripe_payment_intent_id
    'Initial monthly credit - May 2026'            -- p_notes
  );
  
  RAISE NOTICE 'Credit added successfully for subscription %', v_subscription_id;
END $$;

-- Verify the credit was added
SELECT 
  id,
  email,
  current_credit_balance,
  monthly_credit_amount,
  trust_tier,
  negative_balance_limit
FROM members
WHERE id = 'd03b4213-027c-44b4-abf5-9fb465625d59';

-- Check the credit ledger entry
SELECT *
FROM credit_ledger
WHERE member_id = 'd03b4213-027c-44b4-abf5-9fb465625d59'
ORDER BY created_at DESC
LIMIT 5;
