import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Home, CreditCard, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

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
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <nav className="bg-forest-800 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold">
                DeviceCare
              </Link>
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/card"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  My Card
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-forest-100">{member?.full_name || session.user.email}</p>
                <p className="text-xs text-forest-300">
                  {member?.current_credit_balance ? `£${member.current_credit_balance.toFixed(2)} credit` : 'Member'}
                </p>
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-700 transition-colors"
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
