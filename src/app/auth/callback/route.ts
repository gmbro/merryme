import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch (error) {
                // Ignore if called from server config
              }
            },
          },
        }
      );
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Supabase exchangeCodeForSession error:', error);
        // Error on Vercel: redirect with clear error
        const forwardedHost = request.headers.get('x-forwarded-host');
        const baseUrl = forwardedHost ? `https://${forwardedHost}` : requestUrl.origin;
        return NextResponse.redirect(`${baseUrl}/?error=auth&message=${encodeURIComponent(error.message)}`);
      }

      // Success, perform redirect keeping x-forwarded-host in mind
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
    } catch (e) {
      console.error('Auth callback route exception:', e);
      const forwardedHost = request.headers.get('x-forwarded-host');
      const baseUrl = forwardedHost ? `https://${forwardedHost}` : requestUrl.origin;
      return NextResponse.redirect(`${baseUrl}/?error=server&message=internal_error`);
    }
  }

  // If there's no code entirely, just redirect to next
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  if (isLocalEnv) {
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }
}

