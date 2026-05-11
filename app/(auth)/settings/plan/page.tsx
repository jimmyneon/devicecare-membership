'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PLANS = [
  {
    id: 'tier_1',
    name: 'Basic',
    price: 25,
    credit: 25,
    features: ['£25 monthly credit', 'Repair priority: Standard', 'Email support'],
  },
  {
    id: 'tier_2',
    name: 'Premium',
    price: 45,
    credit: 50,
    features: ['£50 monthly credit', 'Repair priority: High', 'Priority support', 'Discounted parts'],
  },
  {
    id: 'tier_3',
    name: 'Business',
    price: 75,
    credit: 100,
    features: ['£100 monthly credit', 'Repair priority: VIP', '24/7 support', 'Discounted parts', 'Bulk repair discounts'],
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
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card ${
              currentPlan?.current_plan_tier === parseInt(plan.id.split('_')[1])
                ? 'ring-2 ring-forest-900'
                : ''
            }`}
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
              disabled={loading || currentPlan?.current_plan_tier === parseInt(plan.id.split('_')[1])}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : currentPlan?.current_plan_tier === parseInt(plan.id.split('_')[1]) ? (
                'Current Plan'
              ) : (
                'Switch to This Plan'
              )}
            </button>
          </div>
        ))}
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
