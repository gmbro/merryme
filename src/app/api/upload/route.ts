import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'her' | 'him'
    const sessionId = (formData.get('sessionId') as string) || crypto.randomUUID();

    if (!file || !type) {
      return NextResponse.json(
        { error: '파일과 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    // Validate image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `uploads/${sessionId}/${type}/${crypto.randomUUID()}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('merryme')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: '업로드 중 오류가 발생했습니다.', detail: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('merryme')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      sessionId,
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
