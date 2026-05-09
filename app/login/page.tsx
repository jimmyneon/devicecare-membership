'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has completed profile
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('profile_completed')
        .eq('id', data.user.id)
        .single();

      console.log('Member data:', member);
      console.log('Member error:', memberError);

      if (memberError) {
        // No member record - shouldn't happen, but redirect to complete profile
        console.log('No member record found, redirecting to complete-profile');
        router.push('/complete-profile');
      } else if (member && !member.profile_completed) {
        console.log('Profile not completed, redirecting to complete-profile');
        router.push('/complete-profile');
      } else {
        console.log('Profile completed, redirecting to dashboard');
        router.push('/dashboard');
      }
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
          emailRedirectTo: `${window.location.origin}/dashboard`,
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

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;ve sent a magic link to <strong>{email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 mb-4">
              <p className="mb-2">Click the link in your email to sign in.</p>
              <p className="text-blue-700">The link expires in 1 hour.</p>
            </div>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail('');
              }}
              className="text-gray-700 hover:text-gray-900 text-sm font-medium"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {useMagicLink ? 'Sign In with Magic Link' : 'Sign In'}
            </h2>
            <p className="text-gray-600">
              {useMagicLink ? 'We\'ll send you a link to sign in' : 'Enter your email and password'}
            </p>
          </div>

          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 mb-4">
              {message}
            </div>
          )}

          {!useMagicLink ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="input pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password? Use magic link instead
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
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
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to password login
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
