import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { CreditCard, TrendingUp, Calendar, Award, AlertCircle, QrCode, Wrench, ShieldCheck, Sparkles } from 'lucide-react';
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

  const getPlanName = (tier: number) => {
    const plans = { 1: 'Starter', 2: 'Standard', 3: 'Premium', 4: 'Elite' };
    return plans[tier as keyof typeof plans] || 'Member';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-900 mb-1">
          DeviceCare
        </h1>
        <p className="text-forest-600">
          Priority support for your devices, ready when you need us.
        </p>
      </div>

      {/* Hero Membership Card Section */}
      <div className="bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-6 h-6 text-secondary" />
                <span className="text-secondary font-semibold text-sm uppercase tracking-wide">
                  {member.membership_status === 'ACTIVE' ? 'Priority Service Enabled' : member.membership_status}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-forest-200 text-sm mb-1">Ready to Use</p>
                <p className="text-5xl md:text-6xl font-bold text-white mb-2">
                  {formatCurrency(member.current_credit_balance)}
                </p>
                {member.negative_balance_limit > 0 && (
                  <p className="text-forest-200 text-sm">
                    +{formatCurrency(member.negative_balance_limit)} backup available if needed
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/card"
                  className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-light text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <QrCode className="w-5 h-5" />
                  Show My Card
                </Link>
                <Link
                  href="https://newforestdevicerepairs.co.uk/contact"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/80 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  <Wrench className="w-5 h-5" />
                  Book a Repair
                </Link>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 md:min-w-[280px]">
              <p className="text-forest-200 text-xs uppercase tracking-wide mb-2">Member Details</p>
              <p className="text-white font-semibold text-lg mb-3">{member.full_name || 'Member'}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-forest-200">Plan</span>
                  <span className="text-white font-medium">{getPlanName(member.current_plan_tier)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-200">Member ID</span>
                  <span className="text-white font-mono text-xs">{member.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {expiringCredits && expiringCredits.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Use Your Credit Soon
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                You have {formatCurrency(expiringCredits.reduce((sum: number, c: any) => sum + (c.remaining_amount || 0), 0))} expiring in the next 30 days. Book a repair to use it!
              </p>
              <Link href="/dashboard/credits" className="text-sm font-medium text-yellow-900 hover:underline">
                View details →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Current Repair Status */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Wrench className="w-6 h-6 text-forest-700" />
          <h2 className="text-xl font-bold text-forest-900">Current Repairs</h2>
        </div>
        <div className="bg-forest-50 rounded-lg p-6 text-center">
          <p className="text-forest-600 mb-2">No active repairs right now</p>
          <p className="text-sm text-forest-500 mb-4">
            When something goes wrong, you can book priority support here.
          </p>
          <Link
            href="https://newforestdevicerepairs.co.uk/contact"
            target="_blank"
            className="inline-flex items-center gap-2 text-forest-700 hover:text-forest-900 font-medium"
          >
            Start a Repair →
          </Link>
        </div>
      </div>

      {/* Benefits Panel */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-forest-700" />
          <h2 className="text-xl font-bold text-forest-900">Your Benefits</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-4 bg-forest-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-forest-900 mb-1">Priority Queue Access</h3>
              <p className="text-sm text-forest-600">Jump the queue and get your devices repaired faster</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-forest-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-forest-900 mb-1">Credit Rolls Over</h3>
              <p className="text-sm text-forest-600">Your repair credit stays active for 12 months</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-forest-50 rounded-lg">
            <QrCode className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-forest-900 mb-1">Faster Check-In</h3>
              <p className="text-sm text-forest-600">Use your QR code or NFC fob for instant service</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-forest-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-forest-900 mb-1">Build Value Monthly</h3>
              <p className="text-sm text-forest-600">Your subscription builds credit you can use anytime</p>
            </div>
          </div>
        </div>
      </div>

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
                  <h3 className="font-semibold text-forest-900">Show Membership Card</h3>
                  <p className="text-sm text-forest-600">QR code for in-store use</p>
                </div>
                <QrCode className="w-6 h-6 text-forest-600" />
              </div>
            </Link>

            <Link
              href="/settings/payment"
              className="block p-4 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-forest-900">Update Payment Method</h3>
                  <p className="text-sm text-forest-600">Change your card details</p>
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
                  <p className="text-sm text-forest-600">Upgrade or adjust your membership</p>
                </div>
                <TrendingUp className="w-6 h-6 text-forest-600" />
              </div>
            </Link>

            <a
              href="mailto:support@newforestdevicerepairs.co.uk"
              className="block p-4 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-forest-900">Contact Support</h3>
                  <p className="text-sm text-forest-600">Get help with your membership</p>
                </div>
                <Award className="w-6 h-6 text-forest-600" />
              </div>
            </a>
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
                      {transaction.transaction_type === 'ACCRUAL' && 'Credit Added'}
                      {transaction.transaction_type === 'USAGE' && 'Credit Used'}
                      {transaction.transaction_type === 'TOPUP' && 'Top-Up'}
                      {transaction.transaction_type === 'EXPIRY' && 'Credit Expired'}
                      {transaction.transaction_type === 'ADJUSTMENT' && 'Adjustment'}
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
            <div className="text-center py-8">
              <p className="text-forest-600 font-medium mb-1">You&apos;re all set.</p>
              <p className="text-sm text-forest-500">
                Your membership is active and ready whenever you need support.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-forest-600">
          Member since {formatDate(member.member_since)} • {Math.floor((Date.now() - new Date(member.member_since).getTime()) / (1000 * 60 * 60 * 24 * 30))} months with DeviceCare
        </p>
      </div>
    </div>
  );
}
