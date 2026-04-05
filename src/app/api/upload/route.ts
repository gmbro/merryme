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
      let userMsg = '업로드 중 오류가 발생했습니다.';
      const msg = uploadError.message?.toLowerCase() || '';
      if (msg.includes('bucket') || msg.includes('not found')) {
        userMsg = '저장소가 설정되지 않았습니다. 관리자에게 문의해주세요.';
      } else if (msg.includes('policy') || msg.includes('permission') || msg.includes('unauthorized')) {
        userMsg = '업로드 권한이 없습니다. 저장소 설정을 확인해주세요.';
      } else if (msg.includes('size') || msg.includes('too large') || msg.includes('payload')) {
        userMsg = '파일이 너무 큽니다. 10MB 이하의 사진을 올려주세요.';
      } else if (msg.includes('type') || msg.includes('mime')) {
        userMsg = '지원하지 않는 파일 형식입니다. JPG, PNG 등 이미지 파일을 올려주세요.';
      }
      return NextResponse.json(
        { error: userMsg, detail: uploadError.message },
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
    const detail = error instanceof Error ? error.message : String(error);
    let userMsg = '서버 오류가 발생했습니다.';
    if (detail.includes('NEXT_PUBLIC_SUPABASE') || detail.includes('supabaseUrl')) {
      userMsg = 'Supabase 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.';
    }
    return NextResponse.json(
      { error: userMsg, detail },
      { status: 500 }
    );
  }
}
