'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      
      // Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      setAuthData(session);

      if (session) {
        // Check member record
        const { data: member, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setMemberData({ member, error });
      }

      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Auth Debug Info</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Auth Session</h2>
          {authData ? (
            <div className="space-y-2">
              <p><strong>User ID:</strong> {authData.user.id}</p>
              <p><strong>Email:</strong> {authData.user.email}</p>
              <p><strong>Email Confirmed:</strong> {authData.user.email_confirmed_at ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {new Date(authData.user.created_at).toLocaleString()}</p>
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Full Session Data</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                  {JSON.stringify(authData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-red-600">Not authenticated</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Member Record</h2>
          {memberData?.error ? (
            <div className="text-red-600">
              <p><strong>Error:</strong> {memberData.error.message}</p>
              <p className="mt-2 text-sm">This means you don&apos;t have a member record in the database yet.</p>
            </div>
          ) : memberData?.member ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {memberData.member.email}</p>
              <p><strong>Full Name:</strong> {memberData.member.full_name || 'Not set'}</p>
              <p><strong>Phone:</strong> {memberData.member.phone || 'Not set'}</p>
              <p><strong>Profile Completed:</strong> {memberData.member.profile_completed ? 'Yes' : 'No'}</p>
              <p><strong>Profile Photo:</strong> {memberData.member.profile_photo_url ? 'Yes' : 'No'}</p>
              <p><strong>Membership Status:</strong> {memberData.member.membership_status}</p>
              <p><strong>Current Plan:</strong> Tier {memberData.member.current_plan_tier || 'None'}</p>
              <p><strong>Credit Balance:</strong> £{memberData.member.current_credit_balance || '0.00'}</p>
              <p><strong>Stripe Customer ID:</strong> {memberData.member.stripe_customer_id || 'None'}</p>
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Full Member Data</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                  {JSON.stringify(memberData.member, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-gray-600">No member data</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold mb-2">What This Means:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>If you have an auth session but no member record: The webhook hasn&apos;t created your member yet</li>
            <li>If profile_completed is false: You need to complete your profile at /complete-profile</li>
            <li>If you have no Stripe Customer ID: Payment hasn&apos;t been processed yet</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <a href="/login" className="btn-secondary">
            Back to Login
          </a>
          <a href="/complete-profile" className="btn-primary">
            Complete Profile
          </a>
          <a href="/dashboard" className="btn-primary">
            Try Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
