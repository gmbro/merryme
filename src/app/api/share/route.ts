import { NextRequest, NextResponse } from 'next/server';

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// In-memory share map (when no DB tables exist yet)
// In production, this should use Supabase `shared_galleries` table
const shareMap = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId가 필요합니다.' }, { status: 400 });
    }

    // Check if already shared
    for (const [code, sid] of shareMap.entries()) {
      if (sid === sessionId) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        return NextResponse.json({
          success: true,
          shareCode: code,
          shareUrl: `${appUrl}/gallery/${sessionId}`,
        });
      }
    }

    const shareCode = generateShareCode();
    shareMap.set(shareCode, sessionId);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    return NextResponse.json({
      success: true,
      shareCode,
      shareUrl: `${appUrl}/gallery/${sessionId}`,
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: '공유 링크 생성 실패' }, { status: 500 });
  }
}
