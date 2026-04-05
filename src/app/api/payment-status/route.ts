import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/server';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ paid: false });
    }

    // Check if any checkout session for this sessionId was paid
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const paid = sessions.data.some(
      (s) => s.metadata?.sessionId === sessionId && s.payment_status === 'paid'
    );

    return NextResponse.json({ paid });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ paid: false });
  }
}
