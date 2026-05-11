import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { Settings, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import MembershipCardComponent from '@/components/MembershipCard';
import type { Database } from '@/types/database';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!memberData) {
    redirect('/onboarding');
  }

  // Type assertion to fix Supabase type inference
  const member = memberData as any;

  const { data: recentTransactionsData } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('member_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: expiringCreditsData } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('member_id', session.user.id)
    .in('transaction_type', ['ACCRUAL', 'TOPUP'])
    .eq('is_expired', false)
    .gt('remaining_amount', 0)
    .lte('expires_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('expires_at', { ascending: true });

  const recentTransactions = recentTransactionsData as any;
  const expiringCredits = expiringCreditsData as any;

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
        <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-6 h-6 text-gray-600" />
        </Link>
      </div>

      {/* Credit Balance - Big and Clear */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
        <p className="text-sm text-gray-600 mb-1">Available Credit</p>
        <p className="text-5xl font-bold text-gray-900 mb-3">
          {formatCurrency(member.current_credit_balance)}
        </p>
        {member.negative_balance_limit > 0 && (
          <p className="text-sm text-gray-600">
            Plus {formatCurrency(member.negative_balance_limit)} backup if you need it
          </p>
        )}
        {member.membership_status === 'ACTIVE' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-green-700 font-medium">✓ Priority service active</p>
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

      {/* Recent Activity */}
      {recentTransactions && recentTransactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {recentTransactions.slice(0, 3).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.transaction_type === 'ACCRUAL' && 'Credit added'}
                    {transaction.transaction_type === 'USAGE' && 'Used for repair'}
                    {transaction.transaction_type === 'TOPUP' && 'Top-up'}
                    {transaction.transaction_type === 'EXPIRY' && 'Expired'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(transaction.created_at)}
                  </p>
                </div>
                <p className={`font-semibold ${
                  ['ACCRUAL', 'TOPUP'].includes(transaction.transaction_type)
                    ? 'text-green-600'
                    : 'text-gray-900'
                }`}>
                  {['ACCRUAL', 'TOPUP'].includes(transaction.transaction_type) ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
