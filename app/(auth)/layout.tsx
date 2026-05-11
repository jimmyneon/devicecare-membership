import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, CreditCard, Settings, User, Home } from 'lucide-react';
import { cookies } from 'next/headers';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const member = memberData as any;

  const handleSignOut = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    cookies().delete('sb-dejiscmseyvadrkdtgyj-auth-token');
    cookies().delete('sb-dejiscmseyvadrkdtgyj-auth-token-code-verifier');
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <nav className="bg-cream-100 text-forest-900 shadow-lg border-b border-forest-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-forest-900">
                DeviceCare
              </Link>
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-50 transition-colors text-forest-900"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/card"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-50 transition-colors text-forest-900"
                >
                  <CreditCard className="w-4 h-4" />
                  My Card
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-50 transition-colors text-forest-900"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-forest-900">{member?.full_name || session.user.email}</p>
                <p className="text-xs text-forest-700">
                  {member?.current_credit_balance ? `£${member.current_credit_balance.toFixed(2)} credit` : 'Member'}
                </p>
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-50 transition-colors text-forest-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-forest-900 text-forest-100 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© 2026 New Forest Device Repairs. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
