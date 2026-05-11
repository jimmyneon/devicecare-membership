'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CreditCard, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const TOPUP_AMOUNTS = [
  { amount: 10, label: '£10' },
  { amount: 25, label: '£25' },
  { amount: 50, label: '£50' },
  { amount: 100, label: '£100' },
  { amount: 150, label: '£150' },
  { amount: 200, label: '£200' },
];

export default function TopUpPage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTopUp = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 5) {
      setError('Minimum top-up is £5');
      return;
    }

    if (amount > 500) {
      setError('Maximum top-up is £500');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create Stripe checkout session for top-up
      const response = await fetch('/api/topup/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      
      if (stripeError) {
        throw stripeError;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process top-up');
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Top Up Credit
        </h1>
        <p className="text-gray-600">
          Add credit to your account for future repairs
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How top-ups work:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Credit is added immediately after payment</li>
              <li>• Use it for labour costs on any repair</li>
              <li>• Credit expires after 12 months</li>
              <li>• Minimum £5, maximum £500 per top-up</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Amount Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Select Amount</h2>
        
        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {TOPUP_AMOUNTS.map(({ amount, label }) => (
            <button
              key={amount}
              onClick={() => handlePresetSelect(amount)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedAmount === amount
                  ? 'border-forest-700 bg-forest-50 text-forest-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-900'
              }`}
            >
              <p className="text-lg font-bold">{label}</p>
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or enter custom amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              £
            </span>
            <input
              type="number"
              min="5"
              max="500"
              step="1"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-forest-700 focus:outline-none text-lg"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Min £5, Max £500
          </p>
        </div>
      </div>

      {/* Summary */}
      {finalAmount >= 5 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Top-up amount</span>
            <span className="text-xl font-bold text-gray-900">
              £{finalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Credit expires</span>
            <span className="text-gray-700">
              {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleTopUp}
        disabled={loading || finalAmount < 5}
        className="w-full bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          'Processing...'
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {finalAmount >= 5 ? `Pay £${finalAmount.toFixed(2)}` : 'Select Amount'}
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-500 mt-4">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}
