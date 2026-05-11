import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Shield, Zap, Clock, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { PLAN_TIERS } from '@/lib/stripe/config';

export default async function PlanDetailsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!member) {
    redirect('/login');
  }

  const currentPlan = PLAN_TIERS[member.current_plan_tier as keyof typeof PLAN_TIERS];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Plan
        </h1>
        <p className="text-gray-600">
          Everything you get with your {currentPlan.name} membership
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-forest-100 text-sm mb-1">Current Plan</p>
            <h2 className="text-3xl font-bold">{currentPlan.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{formatCurrency(currentPlan.price)}</p>
            <p className="text-forest-100 text-sm">per month</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 inline-flex">
          <Check className="w-5 h-5" />
          <span className="font-medium">{formatCurrency(currentPlan.credit)} credit added monthly</span>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">What You Get</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Monthly Credit</h4>
              <p className="text-sm text-gray-600">
                {formatCurrency(currentPlan.credit)} added to your account every month
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Priority Service</h4>
              <p className="text-sm text-gray-600">
                Jump the queue and get faster repairs
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Credit Rolls Over</h4>
              <p className="text-sm text-gray-600">
                Unused credit stays active for 12 months
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">No Upfront Costs</h4>
              <p className="text-sm text-gray-600">
                Use your credit to cover labour costs
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Faster Check-In</h4>
              <p className="text-sm text-gray-600">
                Use your QR code or NFC fob in-store
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Top Up Anytime</h4>
              <p className="text-sm text-gray-600">
                Add extra credit whenever you need it
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Credit Builds Monthly</h4>
              <p className="text-sm text-gray-700">
                Every month, {formatCurrency(currentPlan.credit)} is added to your account automatically. It rolls over for 12 months.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Use Credit for Labour</h4>
              <p className="text-sm text-gray-700">
                When you need a repair, your credit covers the labour costs. Parts are paid separately at cost price.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Priority Access</h4>
              <p className="text-sm text-gray-700">
                Show your membership card in-store and get priority service. No waiting in line.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Top Up When Needed</h4>
              <p className="text-sm text-gray-700">
                Need more credit for a big repair? Top up your account anytime with any amount.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/settings/plan"
          className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition-colors text-center"
        >
          <p className="font-semibold text-gray-900 mb-1">Change Plan</p>
          <p className="text-sm text-gray-600">Upgrade or downgrade anytime</p>
        </Link>

        <Link
          href="/topup"
          className="block bg-forest-700 hover:bg-forest-800 text-white rounded-xl p-4 transition-colors text-center"
        >
          <p className="font-semibold mb-1">Top Up Credit</p>
          <p className="text-sm text-forest-100">Add credit for future repairs</p>
        </Link>
      </div>
    </div>
  );
}
