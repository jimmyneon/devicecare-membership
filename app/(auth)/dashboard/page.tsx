import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { User, ExternalLink, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import MembershipCardComponent from '@/components/MembershipCard';
import type { Database } from '@/types/database';

// Dashboard page for customer accounts (v2026-05-11)
export default async function DashboardPage() {
  console.log('[DASHBOARD] Starting dashboard page load');
  
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[DASHBOARD] Session check:', session ? 'Has session' : 'No session');

  if (!session) {
    console.log('[DASHBOARD] No session, redirecting to login');
    redirect('/login');
  }

  console.log('[DASHBOARD] Fetching member data for:', session.user.id);
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  console.log('[DASHBOARD] Member data:', memberData ? 'Found' : 'Not found', 'Error:', memberError);

  if (!memberData) {
    console.log('[DASHBOARD] No member data, redirecting to onboarding');
    redirect('/onboarding');
  }

  // Type assertion to fix Supabase type inference
  const member = memberData as any;
  console.log('[DASHBOARD] Member role:', member.role);

  // Only redirect if explicitly ADMIN or STAFF
  if (member.role === 'ADMIN' || member.role === 'STAFF') {
    console.log('[DASHBOARD] Admin/Staff detected, redirecting to /admin');
    redirect('/admin');
  }

  console.log('[DASHBOARD] Fetching recent transactions');
  const { data: recentTransactionsData, error: txError } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('member_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('[DASHBOARD] Recent transactions:', recentTransactionsData?.length || 0, 'Error:', txError);

  console.log('[DASHBOARD] Fetching expiring credits');
  const { data: expiringCreditsData, error: expError } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('member_id', session.user.id)
    .in('transaction_type', ['ACCRUAL', 'TOPUP'])
    .eq('is_expired', false)
    .gt('remaining_amount', 0)
    .lte('expires_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('expires_at', { ascending: true });

  console.log('[DASHBOARD] Expiring credits:', expiringCreditsData?.length || 0, 'Error:', expError);

  const recentTransactions = recentTransactionsData || [];
  const expiringCredits = expiringCreditsData || [];
  
  console.log('[DASHBOARD] About to render page');

  type Member = Database['public']['Tables']['members']['Row'];
  const typedMember = member as Member;

  const getPlanName = (tier: number) => {
    const plans = { 1: 'Starter', 2: 'Standard', 3: 'Premium', 4: 'Elite' };
    return plans[tier as keyof typeof plans] || 'Member';
  };

  const getMembershipDuration = () => {
    const days = Math.floor((Date.now() - new Date(member.member_since).getTime()) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hi {member.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-sm text-gray-600">
            {getPlanName(member.current_plan_tier)} Member • {getMembershipDuration()}
          </p>
        </div>
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <User className="w-6 h-6 text-gray-600" />
        </Link>
      </div>

      {/* Credit Balance - Big and Clear */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
        <p className="text-sm text-gray-600 mb-1">Available Credit</p>
        <p className="text-5xl font-bold text-gray-900 mb-3">
          {formatCurrency(member.current_credit_balance)}
        </p>
        
        {/* Trust Tier Buffer - Customer Friendly */}
        {member.negative_balance_limit > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4" />
              <span>Priority service active</span>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                What if I need more credit?
              </summary>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-blue-900">
                <p className="mb-2">
                  <strong>You may be able to use up to {formatCurrency(member.negative_balance_limit)} more</strong> than your current balance.
                </p>
                <p className="text-xs text-blue-700">
                  This is subject to staff approval at the time of repair. As a loyal member, we can often help you out when you need it.
                </p>
              </div>
            </details>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Check className="w-4 h-4" />
            <span>Priority service active</span>
          </div>
        )}
      </div>

      {/* Membership Card - Immediately Visible */}
      <div className="mb-4">
        <MembershipCardComponent member={typedMember} />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 mb-6">
        <Link
          href="https://newforestdevicerepairs.co.uk/contact"
          target="_blank"
          className="block bg-forest-700 hover:bg-forest-800 text-white rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Book a Repair</p>
              <p className="text-sm text-forest-100">Get priority service</p>
            </div>
            <ExternalLink className="w-5 h-5" />
          </div>
        </Link>

        <Link
          href="/topup"
          className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Top Up Credit</p>
              <p className="text-sm text-gray-600">Add credit for future repairs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          href="/settings/plan"
          className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Change Plan</p>
              <p className="text-sm text-gray-600">Currently on {getPlanName(member.current_plan_tier)}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>

    </div>
  );
}
