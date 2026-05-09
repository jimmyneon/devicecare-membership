import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  // Create a simple HTML page that handles the auth on the client side
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Signing in...</title>
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script>
          const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
          const supabaseAnonKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
          const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
          
          async function handleAuth() {
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession('${code}');
              
              if (error) {
                window.location.href = '/login?error=' + encodeURIComponent(error.message);
                return;
              }
              
              // Check member status via API
              const response = await fetch('/api/auth/check-member', {
                credentials: 'include'
              });
              const result = await response.json();
              
              if (result.redirect) {
                window.location.href = result.redirect;
              } else {
                window.location.href = '${next}';
              }
            } catch (err) {
              window.location.href = '/login?error=auth_failed';
            }
          }
          
          handleAuth();
        </script>
      </head>
      <body style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui; background: #f5f5f0;">
        <div style="text-align: center; color: #006B35;">
          <h2>Signing you in...</h2>
          <p>Please wait</p>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
