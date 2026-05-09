import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  // Return a client component that handles the auth
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script>
          const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
          const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
          const supabase = supabase.createClient(supabaseUrl, supabaseKey);
          
          supabase.auth.exchangeCodeForSession('${code}').then(({ data, error }) => {
            if (error) {
              window.location.href = '/login?error=' + encodeURIComponent(error.message);
            } else {
              window.location.href = '${next}';
            }
          });
        </script>
      </head>
      <body>Signing in...</body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
