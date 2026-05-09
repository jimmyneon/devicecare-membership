import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Member, CreditLedger } from '@/types';

export async function getAvailableCredit(memberId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('get_available_credit', {
    p_member_id: memberId,
  });

  if (error) {
    console.error('Error getting available credit:', error);
    throw new Error('Failed to get available credit');
  }

  return data || 0;
}

export async function calculateCreditBalance(memberId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('calculate_credit_balance', {
    p_member_id: memberId,
  });

  if (error) {
    console.error('Error calculating credit balance:', error);
    throw new Error('Failed to calculate credit balance');
  }

  return data || 0;
}

export async function canUseCreditAmount(
  memberId: string,
  amount: number
): Promise<{ canUse: boolean; reason?: string }> {
  const { data: member, error: memberError } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    return { canUse: false, reason: 'Member not found' };
  }

  if (member.membership_status === 'LOCKED') {
    return { canUse: false, reason: 'Account is locked' };
  }

  if (member.membership_status === 'CANCELLED') {
    return { canUse: false, reason: 'Membership is cancelled' };
  }

  if (member.membership_status === 'PAUSED') {
    return { canUse: false, reason: 'Membership is paused' };
  }

  const availableCredit = await getAvailableCredit(memberId);
  const totalAvailable = availableCredit + member.negative_balance_limit;

  if (amount > totalAvailable) {
    return {
      canUse: false,
      reason: `Insufficient credit. Available: £${totalAvailable.toFixed(2)} (including £${member.negative_balance_limit.toFixed(2)} buffer)`,
    };
  }

  return { canUse: true };
}

export async function getExpiringCredits(
  memberId: string,
  daysThreshold: number = 30
): Promise<CreditLedger[]> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const { data, error } = await supabaseAdmin
    .from('credit_ledger')
    .select('*')
    .eq('member_id', memberId)
    .in('transaction_type', ['ACCRUAL', 'TOPUP'])
    .eq('is_expired', false)
    .gt('remaining_amount', 0)
    .lte('expires_at', thresholdDate.toISOString())
    .order('expires_at', { ascending: true });

  if (error) {
    console.error('Error getting expiring credits:', error);
    throw new Error('Failed to get expiring credits');
  }

  return data || [];
}

export function calculateCreditExpiry(fromDate: Date = new Date()): Date {
  const expiryDate = new Date(fromDate);
  expiryDate.setMonth(expiryDate.getMonth() + 12);
  return expiryDate;
}

export function getCreditBreakdown(ledger: CreditLedger[]): {
  totalEarned: number;
  totalUsed: number;
  totalExpired: number;
  currentBalance: number;
} {
  let totalEarned = 0;
  let totalUsed = 0;
  let totalExpired = 0;

  for (const entry of ledger) {
    switch (entry.transaction_type) {
      case 'ACCRUAL':
      case 'TOPUP':
      case 'ADJUSTMENT':
      case 'REFUND':
        totalEarned += entry.amount;
        break;
      case 'USAGE':
        totalUsed += entry.amount;
        break;
      case 'EXPIRY':
        totalExpired += entry.amount;
        break;
    }
  }

  const currentBalance = totalEarned - totalUsed - totalExpired;

  return {
    totalEarned,
    totalUsed,
    totalExpired,
    currentBalance,
  };
}
