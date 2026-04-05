import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import JSZip from 'jszip';

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const zip = new JSZip();

    const steps = ['snapshot', 'styling', 'venue', 'honeymoon'] as const;
    const stepLabels: Record<string, string> = {
      snapshot: '01_스냅사진',
      styling: '02_스타일링',
      venue: '03_결혼식장',
      honeymoon: '04_신혼여행',
    };

    let fileCount = 0;

    for (const step of steps) {
      const { data: files } = await supabase.storage
        .from('merryme')
        .list(`generated/${sessionId}/${step}`);

      if (!files || files.length === 0) continue;

      const folder = zip.folder(stepLabels[step]);
      if (!folder) continue;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.startsWith('.')) continue;

        const { data: urlData } = supabase.storage
          .from('merryme')
          .getPublicUrl(`generated/${sessionId}/${step}/${file.name}`);

        try {
          const imgRes = await fetch(urlData.publicUrl);
          if (!imgRes.ok) continue;
          const imgBuffer = await imgRes.arrayBuffer();
          const ext = file.name.split('.').pop() || 'png';
          folder.file(`${stepLabels[step]}_${String(i + 1).padStart(2, '0')}.${ext}`, imgBuffer);
          fileCount++;
        } catch {
          console.error(`Failed to fetch image: ${file.name}`);
        }
      }
    }

    if (fileCount === 0) {
      return NextResponse.json({ error: '다운로드할 이미지가 없습니다.' }, { status: 404 });
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="MerryMe_Album_${sessionId.slice(0, 8)}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: 'ZIP 다운로드 생성 실패' }, { status: 500 });
  }
}
