'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Calendar, CreditCard, PauseCircle, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface SubscriptionSettingsProps {
  member: any;
}

export default function SubscriptionSettings({ member }: SubscriptionSettingsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [pauseMonths, setPauseMonths] = useState(1);
  const [loading, setLoading] = useState(false);

  const memberSince = new Date(member.member_since);
  const threeMonthsFromStart = new Date(memberSince);
  threeMonthsFromStart.setMonth(threeMonthsFromStart.getMonth() + 3);
  const canCancelAfter = threeMonthsFromStart > new Date();
  const hasNegativeBalance = member.current_credit_balance < 0;

  const canCancel = !canCancelAfter && !hasNegativeBalance && member.membership_status !== 'PAUSED';
  const canPause = !hasNegativeBalance && member.membership_status === 'ACTIVE' && member.pause_count_this_year < 1;

  const handleCancel = async () => {
    if (!cancellationReason) {
      alert('Please select a reason for cancelling');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      alert('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscription/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: pauseMonths }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to pause subscription');
      }
    } catch (error) {
      alert('Failed to pause subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Current Plan
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Plan Tier</p>
            <p className="text-lg font-semibold text-gray-900">
              Tier {member.current_plan_tier} - {formatCurrency(member.monthly_credit_amount)}/month
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              member.membership_status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              member.membership_status === 'GRACE' ? 'bg-yellow-100 text-yellow-800' :
              member.membership_status === 'PAUSED' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {member.membership_status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Next Billing</p>
            <p className="text-lg font-semibold text-gray-900">
              {member.next_billing_date ? new Date(member.next_billing_date).toLocaleDateString('en-GB') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credit Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(member.current_credit_balance)}
              </p>
            </div>
            {member.negative_balance_limit > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Buffer</p>
                <p className="text-lg font-semibold text-primary">
                  +{formatCurrency(member.negative_balance_limit)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pause Subscription */}
      {member.membership_status === 'ACTIVE' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-blue-600" />
            Pause Subscription
          </h2>
          
          <p className="text-gray-600 mb-4">
            Need a break? Pause your subscription for 1-3 months. Your credit balance will be frozen and billing will stop.
          </p>

          {!canPause ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                {hasNegativeBalance ? 
                  `You cannot pause with a negative balance. Please clear ${formatCurrency(Math.abs(member.current_credit_balance))} first.` :
                  member.pause_count_this_year >= 1 ?
                  'You have already used your pause for this year.' :
                  'Pause is not available at this time.'
                }
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowPauseModal(true)}
              className="btn-secondary"
            >
              Pause Subscription
            </button>
          )}
        </div>
      )}

      {/* Cancel Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600" />
          Cancel Subscription
        </h2>
        
        <p className="text-gray-600 mb-4">
          Cancelling your subscription will end your membership at the end of the current billing period.
        </p>

        {!canCancel ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">Cannot Cancel</p>
                <p className="text-sm text-yellow-800">
                  {canCancelAfter ? 
                    `Minimum 3-month commitment. You can cancel after ${threeMonthsFromStart.toLocaleDateString('en-GB')}.` :
                    hasNegativeBalance ?
                    `Please clear your negative balance of ${formatCurrency(Math.abs(member.current_credit_balance))} first.` :
                    member.membership_status === 'PAUSED' ?
                    'Please resume your subscription before cancelling.' :
                    'Cancellation is not available at this time.'
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCancelModal(true)}
            className="btn-danger"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Member Since */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Membership History
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Member Since</span>
            <span className="font-semibold text-gray-900">
              {memberSince.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Lifetime Credits Earned</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(member.lifetime_credits_earned)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Lifetime Credits Used</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(member.lifetime_credits_used)}
            </span>
          </div>
        </div>
      </div>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pause Subscription</h3>
            
            <div className="mb-4">
              <label className="label">How long would you like to pause?</label>
              <select
                value={pauseMonths}
                onChange={(e) => setPauseMonths(parseInt(e.target.value))}
                className="input"
              >
                <option value={1}>1 month</option>
                <option value={2}>2 months</option>
                <option value={3}>3 months</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 mb-2">
                <strong>What happens when you pause:</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>No charges for {pauseMonths} month{pauseMonths > 1 ? 's' : ''}</li>
                <li>Your credit balance will be frozen</li>
                <li>Service will be unavailable during pause</li>
                <li>Automatically resumes after pause period</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handlePause}
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? 'Pausing...' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Subscription</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                You will lose:
              </p>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>{formatCurrency(member.current_credit_balance)} credit balance</li>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Monthly credit accrual</li>
                </ul>
              </ul>
            </div>

            <div className="mb-4">
              <label className="label">Why are you cancelling?</label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="input"
              >
                <option value="">Select a reason...</option>
                <option value="too_expensive">Too expensive</option>
                <option value="not_using">Not using enough</option>
                <option value="moving_away">Moving away</option>
                <option value="poor_service">Poor service</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Consider pausing instead?</strong> You can pause for 1-3 months and keep your credit balance.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                className="btn-danger flex-1"
                disabled={loading || !cancellationReason}
              >
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
