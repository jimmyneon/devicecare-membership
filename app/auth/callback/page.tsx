'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    if (!code) {
      router.push('/login?error=no_code');
      return;
    }

    const handleAuth = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth error:', error);
        router.push(`/login?error=${encodeURIComponent(error.message)}`);
      } else {
        console.log('Auth successful, redirecting to:', next);
        router.push(next);
        router.refresh();
      }
    };

    handleAuth();
  }, [code, next, router]);

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
