import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/card') ||
    req.nextUrl.pathname.startsWith('/settings');

  const isStaffRoute = req.nextUrl.pathname.startsWith('/staff');
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isCompleteProfileRoute = req.nextUrl.pathname === '/complete-profile' || 
                                   req.nextUrl.pathname === '/setup-account';

  // Redirect to login if not authenticated
  if (isAuthRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if profile is complete for authenticated routes
  if (session && isAuthRoute && !isCompleteProfileRoute) {
    const { data: member } = await supabase
      .from('members')
      .select('profile_completed')
      .eq('id', session.user.id)
      .single();

    if (member && !member.profile_completed) {
      return NextResponse.redirect(new URL('/complete-profile', req.url));
    }
  }

  if (isStaffRoute || isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (isStaffRoute && member?.role !== 'STAFF' && member?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isAdminRoute && member?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/card/:path*',
    '/settings/:path*',
    '/complete-profile',
    '/setup-account',
    '/staff/:path*',
    '/admin/:path*',
  ],
};
