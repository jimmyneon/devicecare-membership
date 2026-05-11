'use client';

import { useState, useEffect } from 'react';
import { QrCode, Check, X, CreditCard, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Quick cost presets for fast entry
const QUICK_COSTS = [
  { label: 'Free', amount: 0 },
  { label: '£10', amount: 10 },
  { label: '£15', amount: 15 },
  { label: '£20', amount: 20 },
  { label: '£25', amount: 25 },
  { label: '£30', amount: 30 },
  { label: '£40', amount: 40 },
  { label: '£50', amount: 50 },
];

export default function ScanPage() {
  const [memberId, setMemberId] = useState('');
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleScan = async () => {
    if (!memberId.trim()) {
      setError('Please enter a member ID');
      return;
    }

    setLoading(true);
    setError('');
    setMember(null);

    try {
      const supabase = createClient();
      
      // Search by partial ID (first 8 chars shown on card)
      const { data, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .ilike('id', `${memberId}%`)
        .single();

      if (fetchError || !data) {
        throw new Error('Member not found');
      }

      setMember(data);
    } catch (err: any) {
      setError(err.message || 'Failed to find member');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCredit = async (amount: number) => {
    if (!member) return;

    // Block if account is locked
    if (member.membership_status === 'LOCKED') {
      setError('❌ Account is LOCKED. Member must update payment method before using credit.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();

      // Check if they have enough credit (including buffer)
      const maxAllowed = member.current_credit_balance + member.negative_balance_limit;
      
      if (amount > maxAllowed) {
        throw new Error(`Insufficient credit. Max available: ${formatCurrency(maxAllowed)}`);
      }

      // Use credit
      const { error: useError } = await supabase.rpc('use_credit', {
        p_member_id: member.id,
        p_amount: amount,
        p_repair_id: null,
        p_notes: `In-store service - ${amount === 0 ? 'Free' : formatCurrency(amount)}`,
      });

      if (useError) throw useError;

      setSuccess(`✅ ${amount === 0 ? 'Free service logged' : formatCurrency(amount) + ' deducted'}`);
      
      // Refresh member data
      const { data: updatedMember } = await supabase
        .from('members')
        .select('*')
        .eq('id', member.id)
        .single();
      
      if (updatedMember) {
        setMember(updatedMember);
      }

      // Clear after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to process');
    } finally {
      setProcessing(false);
    }
  };

  const handleCustomAmount = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Invalid amount');
      return;
    }
    await handleUseCredit(amount);
    setCustomAmount('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
          ← Back to Admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Scan Member Card
        </h1>
        <p className="text-gray-600">
          Scan QR code or enter member ID
        </p>
      </div>

      {/* Scan Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Enter Member ID (e.g., ABC12345)"
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none text-lg font-mono"
            autoFocus
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Member Info */}
      {member && (
        <div className="space-y-4">
          {/* Member Details */}
          <div className="bg-white rounded-xl border-2 border-forest-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {member.full_name || 'No name'}
                </h2>
                <p className="text-gray-600">{member.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {member.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                member.membership_status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800'
                  : member.membership_status === 'GRACE'
                  ? 'bg-yellow-100 text-yellow-800'
                  : member.membership_status === 'LOCKED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {member.membership_status}
              </span>
            </div>

            {/* Payment Issue Warning */}
            {(member.membership_status === 'GRACE' || member.membership_status === 'LOCKED') && (
              <div className={`p-4 rounded-lg mb-4 ${
                member.membership_status === 'LOCKED' 
                  ? 'bg-red-50 border-2 border-red-200' 
                  : 'bg-yellow-50 border-2 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    member.membership_status === 'LOCKED' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <p className={`font-semibold ${
                      member.membership_status === 'LOCKED' ? 'text-red-900' : 'text-yellow-900'
                    }`}>
                      {member.membership_status === 'LOCKED' 
                        ? '🔒 Account Locked - Payment Failed' 
                        : '⚠️ Payment Issue Detected'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      member.membership_status === 'LOCKED' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {member.membership_status === 'LOCKED'
                        ? 'Cannot use credit. Member must update payment method.'
                        : 'Payment failed. Member can still use credit but should update card.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Credit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(member.current_credit_balance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Buffer Available</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(member.negative_balance_limit)}
                </p>
              </div>
            </div>

            {/* Total Available */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Max Usable (with approval)</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">
                  {formatCurrency(member.current_credit_balance + member.negative_balance_limit)}
                </span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
              {success}
            </div>
          )}

          {/* Quick Cost Buttons */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Log Service</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {QUICK_COSTS.map((cost) => (
                <button
                  key={cost.label}
                  onClick={() => handleUseCredit(cost.amount)}
                  disabled={processing}
                  className="p-4 border-2 border-gray-200 hover:border-forest-700 hover:bg-forest-50 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cost.label}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Amount
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    £
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomAmount()}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none text-lg"
                  />
                </div>
                <button
                  onClick={handleCustomAmount}
                  disabled={processing || !customAmount}
                  className="px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300"
                >
                  Log
                </button>
              </div>
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setMember(null);
              setMemberId('');
              setError('');
              setSuccess('');
            }}
            className="w-full py-3 px-4 border-2 border-gray-200 hover:border-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
          >
            Scan Another Member
          </button>
        </div>
      )}
    </div>
  );
}
