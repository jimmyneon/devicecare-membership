import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import MembershipCardComponent from '@/components/MembershipCard';
import type { Database } from '@/types/database';

export default async function MembershipCardPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!member || error) {
    redirect('/onboarding');
  }

  // Type assertion to help TypeScript
  type Member = Database['public']['Tables']['members']['Row'];
  const typedMember = member as Member;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">
          Your Membership Card
        </h1>
        <p className="text-forest-600">
          Show this card in-store for priority service
        </p>
      </div>

      <MembershipCardComponent member={typedMember} />

      <div className="mt-8 card bg-forest-50">
        <h3 className="font-semibold text-forest-900 mb-3">
          How to Use Your Card
        </h3>
        <ol className="space-y-2 text-sm text-forest-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Visit New Forest Device Repairs with your device</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Show this QR code to staff for instant member lookup</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Your repair will be processed using your available credit</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-forest-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>Parts (if needed) are paid separately at cost</span>
          </li>
        </ol>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="font-semibold text-forest-900 mb-2">Current Balance</h4>
          <p className="text-2xl font-bold text-forest-900">
            {formatCurrency(typedMember.current_credit_balance)}
          </p>
          {typedMember.negative_balance_limit > 0 && (
            <p className="text-sm text-forest-600 mt-1">
              +{formatCurrency(typedMember.negative_balance_limit)} buffer available
            </p>
          )}
        </div>

        <div className="card">
          <h4 className="font-semibold text-forest-900 mb-2">Membership Status</h4>
          <div className="space-y-1">
            <span className={`badge ${
              typedMember.membership_status === 'ACTIVE' ? 'badge-success' :
              typedMember.membership_status === 'GRACE' ? 'badge-warning' :
              'badge-danger'
            }`}>
              {typedMember.membership_status}
            </span>
            <p className="text-sm text-forest-600">
              Trust Tier: {typedMember.trust_tier || 'NEW'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
