import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DebugPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return <div className="p-8">No session found. Please log in.</div>;
  }

  const { data: memberData, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Info</h1>
      
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-4">
        <h2 className="font-semibold mb-3">Session</h2>
        <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
          {JSON.stringify(session.user, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-4">
        <h2 className="font-semibold mb-3">Member Data</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded mb-3">
            <p className="text-red-900 font-semibold">Error:</p>
            <pre className="text-xs text-red-700">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
        <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
          {JSON.stringify(memberData, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded">
        <p className="font-semibold text-blue-900 mb-2">Role: {memberData?.role || 'NOT SET'}</p>
        <p className="text-sm text-blue-700">
          {memberData?.role === 'ADMIN' || memberData?.role === 'STAFF' 
            ? '→ Should redirect to /admin'
            : '→ Should stay on /dashboard'}
        </p>
      </div>
    </div>
  );
}
