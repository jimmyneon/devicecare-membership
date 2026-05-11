'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PLANS = [
  {
    id: 'tier_1',
    tier: 1,
    name: 'Starter',
    price: 10,
    credit: 10,
    features: ['£10 credit per month', 'Priority service', 'Credit rolls over for 12 months'],
  },
  {
    id: 'tier_2',
    tier: 2,
    name: 'Standard',
    price: 25,
    credit: 25,
    features: ['£25 credit per month', 'Priority service', 'Credit rolls over for 12 months', 'Free diagnostics'],
    popular: true,
  },
  {
    id: 'tier_3',
    tier: 3,
    name: 'Premium',
    price: 50,
    credit: 50,
    features: ['£50 credit per month', 'Priority service', 'Credit rolls over for 12 months', 'Free diagnostics', 'Faster service'],
  },
  {
    id: 'tier_4',
    tier: 4,
    name: 'Elite',
    price: 100,
    credit: 100,
    features: ['£100 credit per month', 'Highest priority', 'Credit rolls over for 12 months', 'Free diagnostics', 'Fastest service', 'Extras included'],
  },
];

export default function PlanPage() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('current_plan_tier, monthly_credit_amount')
          .eq('id', user.id)
          .single();
        setCurrentPlan(member);
      }
    };
    fetchCurrentPlan();
  }, []);

  const handleChangePlan = async (planId: string) => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error: portalError } = await supabase.functions.invoke('stripe-portal', {
        body: { 
          returnUrl: `${window.location.origin}/settings/plan`,
          flow: 'subscription_update',
          newPlan: planId,
        },
      });

      if (portalError) throw portalError;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open subscription portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-900 mb-2">Change Plan</h1>
        <p className="text-forest-600">Upgrade or downgrade your subscription plan</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan?.current_plan_tier === plan.tier;
          return (
          <div
            key={plan.id}
            className={`bg-white rounded-xl border-2 p-6 ${
              isCurrentPlan
                ? 'border-forest-700 shadow-lg'
                : 'border-gray-200'
            } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-forest-900 mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-forest-900">
                £{plan.price}
                <span className="text-sm font-normal text-forest-600">/month</span>
              </p>
              <p className="text-sm text-forest-600 mt-1">{plan.credit} credits/month</p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-forest-700">
                  <Check className="w-4 h-4 text-forest-900 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleChangePlan(plan.id)}
              disabled={loading || isCurrentPlan}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                isCurrentPlan
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-forest-700 hover:bg-forest-800 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading...
                </>
              ) : isCurrentPlan ? (
                'Current Plan'
              ) : (
                'Switch to This Plan'
              )}
            </button>
          </div>
          );
        })}
      </div>

      <div className="mt-6 card">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-forest-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-forest-900 mb-1">Plan Changes</h3>
            <p className="text-sm text-forest-600">
              Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle.
              Your credit balance will be prorated accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
