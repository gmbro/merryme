import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { sessionId, content, imageUrl } = await request.json();

    if (!sessionId || !content) {
      return NextResponse.json({ error: '데이터가 올바르지 않습니다.' }, { status: 400 });
    }

    // Check if user already submitted a review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: '이미 후기를 작성하셨습니다.' }, { status: 400 });
    }

    // Insert the review
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: session.user.id,
        session_id: sessionId,
        content: content,
        image_url: imageUrl || null
      });

    if (insertError) {
      console.error('Failed to insert review:', insertError);
      return NextResponse.json({ error: '후기 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Review API Error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
