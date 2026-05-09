import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { CreditCard, TrendingUp, Calendar, Award, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: 'badge-success',
      GRACE: 'badge-warning',
      LOCKED: 'badge-danger',
      PAUSED: 'badge-neutral',
      CANCELLED: 'badge-danger',
    };
    return badges[status as keyof typeof badges] || 'badge-neutral';
  };

  const getTrustBadge = (tier: string) => {
    const badges = {
      NEW: 'badge-neutral',
      TRUSTED: 'badge-info',
      GOLD: 'badge-warning',
      RESTRICTED: 'badge-danger',
    };
    return badges[tier as keyof typeof badges] || 'badge-neutral';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">
          Welcome back, {member.full_name || 'Member'}!
        </h1>
        <p className="text-forest-600">
          Here&apos;s your membership overview
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Credit Balance</span>
            <CreditCard className="w-5 h-5 text-forest-500" />
          </div>
          <p className="text-3xl font-bold text-forest-900">
            {formatCurrency(member.current_credit_balance)}
          </p>
          {member.negative_balance_limit > 0 && (
            <p className="text-xs text-forest-500 mt-1">
              +{formatCurrency(member.negative_balance_limit)} buffer available
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Status</span>
            <Award className="w-5 h-5 text-forest-500" />
          </div>
          <div className="space-y-2">
            <span className={`badge ${getStatusBadge(member.membership_status)}`}>
              {member.membership_status}
            </span>
            <p className="text-xs text-forest-600">
              Trust: <span className={`badge ${getTrustBadge(member.trust_tier)}`}>
                {member.trust_tier}
              </span>
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Lifetime Used</span>
            <TrendingUp className="w-5 h-5 text-forest-500" />
          </div>
          <p className="text-3xl font-bold text-forest-900">
            {formatCurrency(member.lifetime_credits_used)}
          </p>
          <p className="text-xs text-forest-500 mt-1">
            Total value saved
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Next Billing</span>
            <Calendar className="w-5 h-5 text-forest-500" />
          </div>
          <p className="text-lg font-semibold text-forest-900">
            {member.next_billing_date ? formatDate(member.next_billing_date) : 'N/A'}
          </p>
          <p className="text-xs text-forest-500 mt-1">
            {member.monthly_credit_amount ? `${formatCurrency(member.monthly_credit_amount)} credit` : 'No active plan'}
          </p>
        </div>
      </div>

      {expiringCredits && expiringCredits.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Credits Expiring Soon
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                You have {formatCurrency(expiringCredits.reduce((sum: number, c: any) => sum + (c.remaining_amount || 0), 0))} in credits expiring in the next 30 days.
              </p>
              <Link href="/dashboard/credits" className="text-sm font-medium text-yellow-900 hover:underline">
                View details →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-bold text-forest-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/card"
              className="block p-4 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-forest-900">View Membership Card</h3>
                  <p className="text-sm text-forest-600">Show QR code in-store</p>
                </div>
                <CreditCard className="w-6 h-6 text-forest-600" />
              </div>
            </Link>

            <Link
              href="/settings/plan"
              className="block p-4 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-forest-900">Change Plan</h3>
                  <p className="text-sm text-forest-600">Upgrade or downgrade</p>
                </div>
                <TrendingUp className="w-6 h-6 text-forest-600" />
              </div>
            </Link>

            <Link
              href="/settings/payment"
              className="block p-4 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-forest-900">Payment Method</h3>
                  <p className="text-sm text-forest-600">Update card details</p>
                </div>
                <CreditCard className="w-6 h-6 text-forest-600" />
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-forest-900">
              Recent Activity
            </h2>
            <Link href="/dashboard/history" className="text-sm text-forest-700 hover:text-forest-900 font-medium">
              View all →
            </Link>
          </div>

          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-forest-100 last:border-0">
                  <div>
                    <p className="font-medium text-forest-900 text-sm">
                      {transaction.transaction_type === 'ACCRUAL' && 'Monthly Credit'}
                      {transaction.transaction_type === 'USAGE' && 'Repair Credit Used'}
                      {transaction.transaction_type === 'TOPUP' && 'Credit Top-Up'}
                      {transaction.transaction_type === 'EXPIRY' && 'Credit Expired'}
                      {transaction.transaction_type === 'ADJUSTMENT' && 'Credit Adjustment'}
                    </p>
                    <p className="text-xs text-forest-600">
                      {formatRelativeTime(transaction.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      ['ACCRUAL', 'TOPUP', 'ADJUSTMENT'].includes(transaction.transaction_type)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {['ACCRUAL', 'TOPUP', 'ADJUSTMENT'].includes(transaction.transaction_type) ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-forest-600">
                      Balance: {formatCurrency(transaction.balance_after)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-forest-600 text-sm text-center py-8">
              No recent activity
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 card bg-forest-50">
        <h3 className="font-semibold text-forest-900 mb-2">
          Member Since {formatDate(member.member_since)}
        </h3>
        <p className="text-sm text-forest-700">
          You&apos;ve been a valued DeviceCare member for{' '}
          {Math.floor((Date.now() - new Date(member.member_since).getTime()) / (1000 * 60 * 60 * 24 * 30))} months.
          Thank you for your continued support!
        </p>
      </div>
    </div>
  );
}
