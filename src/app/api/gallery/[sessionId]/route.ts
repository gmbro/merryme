import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

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

    // Collect all generated images by listing storage files
    const steps = ['snapshot', 'styling', 'venue', 'honeymoon'] as const;
    const images: Record<string, { url: string; name: string }[]> = {
      snapshot: [],
      styling: [],
      venue: [],
      honeymoon: [],
    };

    for (const step of steps) {
      const { data: files, error } = await supabase.storage
        .from('merryme')
        .list(`generated/${sessionId}/${step}`);

      if (error) {
        console.error(`Error listing ${step} files:`, error);
        continue;
      }

      if (files && files.length > 0) {
        for (const file of files) {
          if (file.name.startsWith('.')) continue; // skip hidden files
          const { data: urlData } = supabase.storage
            .from('merryme')
            .getPublicUrl(`generated/${sessionId}/${step}/${file.name}`);

          images[step].push({
            url: urlData.publicUrl,
            name: file.name,
          });
        }
      }
    }

    // Get reference (uploaded) photos
    const referencePhotos: { her?: string; him?: string } = {};
    for (const type of ['her', 'him'] as const) {
      const { data: files } = await supabase.storage
        .from('merryme')
        .list(`uploads/${sessionId}/${type}`);

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from('merryme')
          .getPublicUrl(`uploads/${sessionId}/${type}/${files[0].name}`);
        referencePhotos[type] = urlData.publicUrl;
      }
    }

    const totalCount = Object.values(images).reduce((acc, arr) => acc + arr.length, 0);

    return NextResponse.json({
      success: true,
      sessionId,
      referencePhotos,
      images,
      totalCount,
    });
  } catch (error) {
    console.error('Gallery API error:', error);
    return NextResponse.json(
      { error: '갤러리 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
