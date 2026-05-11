import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Calendar, LogOut } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!member) {
    redirect('/login');
  }

  const getPlanName = (tier: number) => {
    const plans = { 1: 'Starter', 2: 'Standard', 3: 'Premium', 4: 'Elite' };
    return plans[tier as keyof typeof plans] || 'Member';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Profile
        </h1>
        <p className="text-gray-600">
          Manage your account details
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-forest-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{member.full_name}</h2>
            <p className="text-sm text-gray-600">{getPlanName(member.current_plan_tier)} Member</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-gray-900">{member.email}</p>
            </div>
          </div>

          {member.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-gray-900">{member.phone}</p>
              </div>
            </div>
          )}

          {member.address_line1 && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-gray-900">
                  {member.address_line1}
                  {member.address_line2 && <>, {member.address_line2}</>}
                  <br />
                  {member.city}, {member.postcode}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Member Since</p>
              <p className="text-gray-900">{formatDate(member.member_since)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 mb-6">
        <Link
          href="/settings/plan"
          className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-gray-900">Subscription Settings</p>
                <p className="text-sm text-gray-600">Manage plan and payment</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/history"
          className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-gray-900">Transaction History</p>
                <p className="text-sm text-gray-600">View all activity</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Sign Out */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl p-4 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </form>
    </div>
  );
}
