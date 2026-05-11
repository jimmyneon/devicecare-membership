'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PaymentMethodPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      // This would integrate with Stripe customer portal
      const { data, error: portalError } = await supabase.functions.invoke('stripe-portal', {
        body: { returnUrl: `${window.location.origin}/settings/payment` },
      });

      if (portalError) throw portalError;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open payment portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-900 mb-2">Payment Method</h1>
        <p className="text-forest-600">Update your card details or manage payment methods</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-forest-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-forest-900" />
          </div>
          <div>
            <h3 className="font-semibold text-forest-900">Manage Payment Methods</h3>
            <p className="text-sm text-forest-600">Add, update, or remove payment methods</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpdatePayment}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Open Payment Portal'
          )}
        </button>

        <p className="text-sm text-forest-600 mt-4 text-center">
          You'll be redirected to Stripe's secure payment portal to manage your payment methods.
        </p>
      </div>
    </div>
  );
}
