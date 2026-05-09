'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams?.get('message');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    const openEmailApp = () => {
      // Try to open default email app
      const emailDomain = email.split('@')[1];
      let mailUrl = 'mailto:';
      
      // Try to open webmail for common providers
      if (emailDomain?.includes('gmail')) {
        window.open('https://mail.google.com', '_blank');
      } else if (emailDomain?.includes('outlook') || emailDomain?.includes('hotmail') || emailDomain?.includes('live')) {
        window.open('https://outlook.live.com', '_blank');
      } else if (emailDomain?.includes('yahoo')) {
        window.open('https://mail.yahoo.com', '_blank');
      } else if (emailDomain?.includes('icloud')) {
        window.open('https://www.icloud.com/mail', '_blank');
      } else {
        // Fallback: try to open native email app
        window.location.href = mailUrl;
      }
    };

    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-forest-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-forest-600 mb-6">
              We&apos;ve sent a magic link to <strong>{email}</strong>
            </p>
            <div className="bg-forest-50 border border-forest-200 rounded-lg p-4 text-sm text-forest-700 mb-4">
              <p className="mb-2">Click the link in your email to sign in.</p>
              <p className="text-forest-500">The link expires in 1 hour.</p>
            </div>
            
            <button
              onClick={openEmailApp}
              className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Open Email App
            </button>
            
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="text-forest-700 hover:text-forest-900 text-sm font-medium"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            DeviceCare Membership
          </h1>
          <p className="text-forest-100">
            Sign in to access your account
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-forest-700" />
            </div>
            <h2 className="text-2xl font-bold text-forest-900 mb-2">
              Sign In
            </h2>
            <p className="text-forest-600">
              We'll send you a magic link to sign in instantly
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {message && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-gray-700 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-forest-100">
            <p className="text-center text-sm text-forest-600">
              Don't have an account?{' '}
              <Link href="/onboarding" className="text-forest-700 font-medium hover:text-forest-900">
                Join DeviceCare
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-forest-100 hover:text-white text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
