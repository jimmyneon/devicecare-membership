import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QrCode, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: member } = await supabase
    .from('members')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single();

  if (!member || (member.role !== 'ADMIN' && member.role !== 'STAFF')) {
    redirect('/dashboard');
  }

  // Get members with payment issues (GRACE or LOCKED)
  const { data: issueMembers } = await supabase
    .from('members')
    .select('id, full_name, email, membership_status, current_credit_balance')
    .eq('role', 'CUSTOMER')
    .in('membership_status', ['GRACE', 'LOCKED'])
    .order('updated_at', { ascending: false })
    .limit(10);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Staff Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {member.full_name || 'Staff'}
        </p>
      </div>

      {/* Main Action - Scan QR */}
      <Link
        href="/admin/scan"
        className="block bg-forest-700 hover:bg-forest-800 text-white rounded-2xl p-8 mb-6 transition-all shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Scan Member Card</h2>
            <p className="text-forest-100">
              Quick service checkout
            </p>
          </div>
        </div>
      </Link>

      {/* Secondary Action - View Members */}
      <Link
        href="/admin/members"
        className="block bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-6 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">All Members</h3>
              <p className="text-sm text-gray-600">View member list</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Payment Issues Alert */}
      {issueMembers && issueMembers.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Payment Issues ({issueMembers.length})
              </h3>
              <p className="text-sm text-yellow-700">
                Members with failed payments
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {issueMembers.slice(0, 5).map((m: any) => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                className="block p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {m.full_name || 'No name'}
                    </p>
                    <p className="text-xs text-gray-600">{m.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    m.membership_status === 'LOCKED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {m.membership_status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          {issueMembers.length > 5 && (
            <Link
              href="/admin/members?filter=issues"
              className="block mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium text-center"
            >
              View all {issueMembers.length} members →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
