import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, QrCode, CreditCard, Settings as SettingsIcon } from 'lucide-react';
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
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!member || (member.role !== 'ADMIN' && member.role !== 'STAFF')) {
    redirect('/dashboard');
  }

  // Get stats
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'CUSTOMER');

  const { count: activeMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('membership_status', 'ACTIVE')
    .eq('role', 'CUSTOMER');

  const { data: recentMembers } = await supabase
    .from('members')
    .select('id, full_name, email, member_since, membership_status')
    .eq('role', 'CUSTOMER')
    .order('member_since', { ascending: false })
    .limit(5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage members, scan QR codes, and view system stats
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Members</p>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalMembers || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Members</p>
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeMembers || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Inactive</p>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(totalMembers || 0) - (activeMembers || 0)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/admin/scan"
          className="block bg-forest-700 hover:bg-forest-800 text-white rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Scan QR Code</h3>
              <p className="text-sm text-forest-100">
                Scan member card to view details and process repairs
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/members"
          className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1 text-gray-900">All Members</h3>
              <p className="text-sm text-gray-600">
                View and manage all member accounts
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-lg text-gray-900 mb-4">Recent Members</h2>
        <div className="space-y-3">
          {recentMembers && recentMembers.length > 0 ? (
            recentMembers.map((m: any) => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                className="block p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{m.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-600">{m.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      m.membership_status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {m.membership_status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(m.member_since).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No members yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
