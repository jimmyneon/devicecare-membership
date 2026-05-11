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
        router.push('/login');
        return;
      }

      const supabase = createClient();
      
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Auth error:', error);
          router.push('/login');
        } else {
          // Force a full page reload to ensure middleware picks up the session
          window.location.href = '/dashboard';
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
