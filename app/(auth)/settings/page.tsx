import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscriptionSettings from '@/components/SubscriptionSettings';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: member } = await supabase
    .from('members')
    .select('*, subscriptions(*)')
    .eq('id', session.user.id)
    .single();

  if (!member) {
    redirect('/onboarding');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Settings
        </h1>
        <p className="text-gray-600">
          Manage your membership, billing, and preferences
        </p>
      </div>

      <SubscriptionSettings member={member} />
    </div>
  );
}
