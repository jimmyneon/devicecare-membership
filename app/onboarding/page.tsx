'use client';

import { useState } from 'react';
import { PLAN_TIERS } from '@/lib/stripe/config';
import { Check, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function OnboardingPage() {
  const [selectedTier, setSelectedTier] = useState<number>(2);

  const handleContinue = () => {
    window.location.href = `/onboarding/payment?tier=${selectedTier}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the membership tier that fits your repair needs. Cancel or change anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.values(PLAN_TIERS).map((plan) => (
            <div
              key={plan.tier}
              onClick={() => setSelectedTier(plan.tier)}
              className={`relative bg-white rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                selectedTier === plan.tier
                  ? 'ring-4 ring-primary shadow-xl scale-105'
                  : 'hover:shadow-lg hover:scale-102 shadow-md'
              } ${plan.popular ? 'border-2 border-primary' : 'border border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-black">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="bg-primary/10 rounded-lg py-2 px-3">
                  <p className="text-sm text-gray-700">
                    <strong className="text-primary">{formatCurrency(plan.credit)}</strong> credit/month
                  </p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-gray-200">
                {selectedTier === plan.tier ? (
                  <div className="text-center text-primary font-medium text-sm">
                    ✓ Selected
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    Click to select
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-black mb-4">
            What&apos;s Included
          </h3>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-black">Monthly Credits</strong>
                <p className="text-sm text-gray-600">
                  Credits accrue each month and can be used for labour costs
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-black">Priority Queue</strong>
                <p className="text-sm text-gray-600">
                  Members get priority access to repair services
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-black">No Upfront Costs</strong>
                <p className="text-sm text-gray-600">
                  Use your credits immediately - no need to pay labour costs upfront
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-black">Flexible Management</strong>
                <p className="text-sm text-gray-600">
                  Change plans, pause, or cancel anytime
                </p>
              </div>
            </li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> Credits expire after 12 months. Parts are always paid separately and not covered by credits.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="btn-primary w-full btn-lg"
          >
            Continue to Payment
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-600 hover:text-black text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
