export * from './database';

export interface PlanTier {
  tier: number;
  name: string;
  price: number;
  credit: number;
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

export interface MemberWithStats extends Member {
  total_repairs?: number;
  avg_repair_value?: number;
  last_repair_date?: string;
}

export interface CreditTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  expires_at?: string;
}

export interface RepairTransaction {
  id: string;
  repair_amount: number;
  credit_used: number;
  cash_paid: number;
  parts_cost: number;
  description: string;
  processed_by_name?: string;
  created_at: string;
}

export interface DashboardStats {
  total_members: number;
  active_members: number;
  mrr: number;
  credit_liability: number;
  failed_payments: number;
  revenue_by_tier: Record<number, number>;
}

export interface MemberLookupResult {
  member: Member;
  available_credit: number;
  can_use_credit: boolean;
  reason?: string;
}

export type { Member, Subscription, CreditLedger, CreditUsage, Topup, PaymentMethod, TrustLevelHistory, AdminSettings, PauseHistory, MembershipStatus, TrustTier, UserRole, TransactionType, Database } from './database';
