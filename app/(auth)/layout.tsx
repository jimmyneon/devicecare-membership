import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, CreditCard, Settings, User, Home } from 'lucide-react';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

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

  // Get current path to avoid redirect loops
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';

  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // If no member data, redirect to onboarding (unless already there)
  if (!memberData && !pathname.includes('/onboarding')) {
    redirect('/onboarding');
  }

  const member = memberData as any;

  // If profile is incomplete, redirect to complete-profile (but don't redirect if already on that page)
  if (member && !member.profile_completed && !pathname.includes('/complete-profile')) {
    redirect('/complete-profile');
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = createClient();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all auth cookies
    const cookieStore = cookies();
    cookieStore.delete('sb-dejiscmseyvadrkdtgyj-auth-token');
    cookieStore.delete('sb-dejiscmseyvadrkdtgyj-auth-token-code-verifier');
    
    // Redirect to login
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16">
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
