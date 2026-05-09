'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
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
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.push(`/login?error=${encodeURIComponent(error.message)}`);
      } else {
        router.push(next);
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
