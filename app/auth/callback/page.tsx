'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    const handleAuth = async () => {
      if (!code) {
        console.log('No code, redirecting to login');
        router.push('/login');
        return;
      }

      const supabase = createClient();
      
      try {
        console.log('Exchanging code for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Auth error:', error);
          router.push('/login');
        } else {
          console.log('Session exchanged successfully:', data.session ? 'yes' : 'no');
          // Wait a bit for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 500));
          // Redirect to password setup page
          console.log('Redirecting to password setup...');
          window.location.href = '/auth/setup-password';
        }
      } catch (err) {
        console.error('Exception during auth:', err);
        router.push('/login');
      }
    };

    handleAuth();
  }, [code, router]);

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-forest-900 mb-2">Signing you in...</h2>
        <p className="text-forest-600">Please wait</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-100 flex items-center justify-center">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
