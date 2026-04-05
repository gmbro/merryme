import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userEmail } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId가 필요합니다.' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://merryme-gmbros-projects.vercel.app';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MerryMe 웨딩 영상 다운로드',
              description: '1080p 고화질 웨딩 슬라이드쇼 영상',
            },
            unit_amount: 100, // $1.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        sessionId,
      },
      success_url: `${origin}/gallery/${sessionId}?paid=true`,
      cancel_url: `${origin}/gallery/${sessionId}?paid=cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: '결제 세션 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
