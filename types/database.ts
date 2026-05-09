export type MembershipStatus = 'ACTIVE' | 'GRACE' | 'LOCKED' | 'PAUSED' | 'CANCELLED';
export type TrustTier = 'NEW' | 'TRUSTED' | 'GOLD' | 'RESTRICTED';
export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type TransactionType = 'ACCRUAL' | 'USAGE' | 'TOPUP' | 'ADJUSTMENT' | 'EXPIRY' | 'REFUND';

export interface Member {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  membership_status: MembershipStatus;
  member_since: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_plan_tier: number | null;
  monthly_credit_amount: number | null;
  next_billing_date: string | null;
  current_credit_balance: number;
  lifetime_credits_earned: number;
  lifetime_credits_used: number;
  trust_tier: TrustTier;
  negative_balance_limit: number;
  is_trust_override: boolean;
  pause_count_this_year: number;
  last_pause_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  member_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan_tier: number;
  monthly_amount: number;
  credit_amount: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  last_payment_date: string | null;
  last_payment_status: string | null;
  failed_payment_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreditLedger {
  id: string;
  member_id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  expires_at: string | null;
  is_expired: boolean;
  remaining_amount: number | null;
  subscription_id: string | null;
  usage_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreditUsage {
  id: string;
  member_id: string;
  repair_amount: number;
  credit_used: number;
  cash_paid: number;
  parts_cost: number;
  parts_paid_separately: boolean;
  processed_by: string | null;
  repair_description: string | null;
  notes: string | null;
  created_at: string;
}

export interface Topup {
  id: string;
  member_id: string;
  amount: number;
  stripe_payment_intent_id: string | null;
  payment_status: string;
  credit_ledger_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentMethod {
  id: string;
  member_id: string;
  stripe_payment_method_id: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustLevelHistory {
  id: string;
  member_id: string;
  old_tier: TrustTier | null;
  new_tier: TrustTier;
  old_limit: number | null;
  new_limit: number;
  reason: string;
  is_manual: boolean;
  changed_by: string | null;
  created_at: string;
}

export interface AdminSettings {
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PauseHistory {
  id: string;
  member_id: string;
  paused_at: string;
  resumed_at: string | null;
  reason: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Member, 'id' | 'created_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>;
      };
      credit_ledger: {
        Row: CreditLedger;
        Insert: Omit<CreditLedger, 'id' | 'created_at'>;
        Update: Partial<Omit<CreditLedger, 'id' | 'created_at'>>;
      };
      credit_usage: {
        Row: CreditUsage;
        Insert: Omit<CreditUsage, 'id' | 'created_at'>;
        Update: Partial<Omit<CreditUsage, 'id' | 'created_at'>>;
      };
      topups: {
        Row: Topup;
        Insert: Omit<Topup, 'id' | 'created_at'>;
        Update: Partial<Omit<Topup, 'id' | 'created_at'>>;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentMethod, 'id' | 'created_at'>>;
      };
      trust_level_history: {
        Row: TrustLevelHistory;
        Insert: Omit<TrustLevelHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<TrustLevelHistory, 'id' | 'created_at'>>;
      };
      admin_settings: {
        Row: AdminSettings;
        Insert: AdminSettings;
        Update: Partial<AdminSettings>;
      };
      pause_history: {
        Row: PauseHistory;
        Insert: Omit<PauseHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<PauseHistory, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      calculate_credit_balance: {
        Args: { p_member_id: string };
        Returns: number;
      };
      get_available_credit: {
        Args: { p_member_id: string };
        Returns: number;
      };
      use_credit: {
        Args: {
          p_member_id: string;
          p_amount: number;
          p_usage_id: string;
          p_description?: string;
        };
        Returns: boolean;
      };
      add_credit: {
        Args: {
          p_member_id: string;
          p_amount: number;
          p_transaction_type: TransactionType;
          p_subscription_id?: string;
          p_stripe_payment_intent_id?: string;
          p_notes?: string;
        };
        Returns: string;
      };
      expire_old_credits: {
        Args: Record<string, never>;
        Returns: number;
      };
      calculate_trust_tier: {
        Args: { p_member_id: string };
        Returns: TrustTier;
      };
      update_trust_tier: {
        Args: { p_member_id: string };
        Returns: void;
      };
    };
  };
}
