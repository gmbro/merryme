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
        return NextResponse.redirect(new URL(`/?error=auth&message=${encodeURIComponent(error.message)}`, requestUrl.origin));
      }
    } catch (e) {
      console.error('Auth callback route exception:', e);
      return NextResponse.redirect(new URL(`/?error=server&message=internal_error`, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
