-- Manual credit addition for jimmyneon@hotmail.com
-- Run this in Supabase SQL Editor to add the missing £25 initial credit

-- Add £25 credit for member d03b4213-027c-44b4-abf5-9fb465625d59
SELECT add_credit(
  'd03b4213-027c-44b4-abf5-9fb465625d59'::uuid,  -- p_member_id
  25.00,                                          -- p_amount
  'ACCRUAL',                                      -- p_transaction_type
  'sub_1TVsIRB11Tc1iEQiAoRNbo36',                -- p_subscription_id
  'pi_3TVsISB11Tc1iEQi1x4oJsue',                 -- p_stripe_payment_intent_id
  'Initial monthly credit - May 2026'            -- p_notes
);

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
