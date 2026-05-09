'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PLAN_TIERS } from '@/lib/stripe/config';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import Link from 'next/link';

function PaymentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tierParam = searchParams.get('tier');
  const tier = tierParam ? parseInt(tierParam) : 2;
  const plan = PLAN_TIERS[tier as keyof typeof PLAN_TIERS];

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!plan) {
    router.push('/onboarding');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          planTier: tier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 text-forest-100 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to plans
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="mb-6">
              <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-forest-700" />
              </div>
              <h2 className="text-2xl font-bold text-forest-900 mb-2">
                Complete Your Membership
              </h2>
              <p className="text-forest-600">
                Enter your details to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="input"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07123 456789"
                  required
                  className="input"
                  disabled={loading}
                />
              </div>

              <div className="pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1"
                    required
                    disabled={loading}
                  />
                  <span className="text-sm text-forest-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-forest-900 font-medium hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-forest-900 font-medium hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="btn-primary w-full btn-lg"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-forest-100">
              <div className="flex items-center gap-2 text-sm text-forest-600">
                <Shield className="w-4 h-4" />
                <span>Secured by Stripe. Your payment info is encrypted.</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-forest-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-forest-700">Plan</span>
                  <span className="font-medium text-forest-900">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-700">Monthly Credit</span>
                  <span className="font-medium text-forest-900">
                    {formatCurrency(plan.credit)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-forest-100">
                  <span className="font-medium text-forest-900">Total</span>
                  <span className="text-2xl font-bold text-forest-900">
                    {formatCurrency(plan.price)}<span className="text-base font-normal text-forest-600">/month</span>
                  </span>
                </div>
              </div>

              <div className="bg-forest-50 rounded-lg p-4">
                <p className="text-sm text-forest-700">
                  Your first payment will be charged today. Future payments will be automatically charged monthly.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-forest-900 mb-3">
                What Happens Next?
              </h3>
              <ol className="space-y-3 text-sm text-forest-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Complete payment with your card</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Receive your digital membership card</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Start using your credits immediately</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forest-800 flex items-center justify-center text-white">Loading...</div>}>
      <PaymentForm />
    </Suspense>
  );
}
