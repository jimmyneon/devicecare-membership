import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { User, CreditCard, History, Edit, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import EditMemberForm from '@/components/admin/EditMemberForm';
import ServiceHistoryList from '@/components/admin/ServiceHistoryList';

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if user is admin/staff
  const { data: adminMember } = await supabase
    .from('members')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!adminMember || (adminMember.role !== 'ADMIN' && adminMember.role !== 'STAFF')) {
    redirect('/dashboard');
  }

  // Get member details
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!member) {
    redirect('/admin/members');
  }

  // Get service history (credit usage)
  const { data: services } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('member_id', params.id)
    .eq('transaction_type', 'USAGE')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get subscription info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('member_id', params.id)
    .single();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'GRACE': return 'bg-yellow-100 text-yellow-800';
      case 'LOCKED': return 'bg-red-100 text-red-800';
      case 'PAUSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/members" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
          ← Back to Members
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {member.full_name || 'No name'}
            </h1>
            <p className="text-gray-600">{member.email}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(member.membership_status)}`}>
            {member.membership_status}
          </span>
        </div>
      </div>

      {/* Payment Issue Warning */}
      {(member.membership_status === 'GRACE' || member.membership_status === 'LOCKED') && (
        <div className={`p-4 rounded-xl mb-6 ${
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
                  : '⚠️ Payment Issue - Grace Period'}
              </p>
              <p className={`text-sm mt-1 ${
                member.membership_status === 'LOCKED' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {subscription?.failed_payment_count || 0} failed payment(s). 
                {member.membership_status === 'LOCKED' 
                  ? ' Cannot use credit until payment method is updated.'
                  : ' Member should update payment method soon.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Credit Balance</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(member.current_credit_balance)}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Buffer</p>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(member.negative_balance_limit)}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Plan Tier</p>
          <p className="text-xl font-bold text-gray-900">
            Tier {member.current_plan_tier}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Monthly Credit</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(member.monthly_credit_amount)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="px-6 py-3 font-semibold text-forest-700 border-b-2 border-forest-700">
              Details
            </button>
            <button className="px-6 py-3 font-semibold text-gray-600 hover:text-gray-900">
              Service History
            </button>
          </div>
        </div>

        {/* Member Details */}
        <div className="p-6">
          <EditMemberForm member={member} />
        </div>
      </div>

      {/* Service History */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Services ({services?.length || 0})
        </h2>
        <ServiceHistoryList services={services || []} />
      </div>
    </div>
  );
}
