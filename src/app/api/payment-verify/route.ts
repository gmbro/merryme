import { NextRequest, NextResponse } from 'next/server';

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, sessionId, expectedAmount } = await request.json();

    if (!paymentId || !sessionId) {
      return NextResponse.json({ verified: false, error: '필수 정보 누락' }, { status: 400 });
    }

    // PortOne V2 단건 조회 API
    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        'Authorization': `PortOne ${PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[PortOne] Payment query failed:', errText);
      return NextResponse.json({ verified: false, error: '결제 조회 실패' }, { status: 500 });
    }

    const payment = await res.json();

    // 검증: 결제 상태 + 금액 일치
    if (payment.status === 'PAID' && payment.amount?.total === expectedAmount) {
      return NextResponse.json({ verified: true, paymentId });
    }

    return NextResponse.json({
      verified: false,
      error: '결제 금액이 일치하지 않거나 결제가 완료되지 않았습니다.',
      status: payment.status,
    });
  } catch (error) {
    console.error('[PortOne] Verify error:', error);
    return NextResponse.json({ verified: false, error: '서버 오류' }, { status: 500 });
  }
}
