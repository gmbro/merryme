import { NextRequest, NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL } from '@/lib/gemini/client';
import { createServiceClient } from '@/lib/supabase/server';
import {
  buildSnapshotPrompt,
  buildStylingPrompt,
  buildVenuePrompt,
  buildHoneymoonPrompt,
  SnapshotTheme,
  DressType,
  TuxedoType,
  MakeupType,
} from '@/lib/gemini/prompts';

export const maxDuration = 60; // Vercel timeout

interface GenerateBody {
  sessionId: string;
  step: 'snapshot' | 'styling' | 'venue' | 'honeymoon';
  options: {
    theme?: SnapshotTheme;
    dress?: DressType;
    tuxedo?: TuxedoType;
    makeup?: MakeupType;
    gender?: 'her' | 'him';
    venueStyle?: string;
    destination?: string;
    scene?: string;
  };
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { base64, mimeType };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateBody = await request.json();
    const { sessionId, step, options } = body;

    if (!sessionId || !step) {
      return NextResponse.json(
        { error: 'sessionId와 step이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get reference images from storage
    const referenceImages: { base64: string; mimeType: string }[] = [];

    for (const type of ['her', 'him']) {
      const { data: files } = await supabase.storage
        .from('merryme')
        .list(`uploads/${sessionId}/${type}`);

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from('merryme')
          .getPublicUrl(`uploads/${sessionId}/${type}/${files[0].name}`);

        try {
          const img = await fetchImageAsBase64(urlData.publicUrl);
          referenceImages.push(img);
        } catch (e) {
          console.error(`Failed to fetch ${type} image:`, e);
        }
      }
    }

    // Build prompt based on step
    let prompt = '';
    switch (step) {
      case 'snapshot':
        prompt = buildSnapshotPrompt(options.theme || 'cherry_blossom');
        break;
      case 'styling':
        prompt = buildStylingPrompt(
          options.gender || 'her',
          options.dress,
          options.tuxedo,
          options.makeup
        );
        break;
      case 'venue':
        prompt = buildVenuePrompt(options.venueStyle || 'elegant garden wedding');
        break;
      case 'honeymoon':
        prompt = buildHoneymoonPrompt(
          options.destination || '파리',
          options.scene || '에펠탑 앞에서 다정하게 사진을 찍는 모습'
        );
        break;
    }

    // Build Gemini request with reference images
    const contents: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

    // Add reference images
    for (const img of referenceImages) {
      contents.push({
        inlineData: { data: img.base64, mimeType: img.mimeType },
      });
    }

    // Add text prompt
    contents.push({ text: prompt });

    // Call Gemini API
    let response;
    try {
      response = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: contents }],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
    } catch (apiError) {
      const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
      console.error('Gemini API call error:', errMsg);
      
      if (errMsg.includes('SAFETY') || errMsg.includes('safety')) {
        return NextResponse.json(
          { error: 'AI 안전 정책에 의해 이미지를 생성할 수 없었어요. 다른 테마를 선택해 보세요.' },
          { status: 400 }
        );
      }
      if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('RATE')) {
        return NextResponse.json(
          { error: 'API 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        );
      }
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        return NextResponse.json(
          { error: 'AI 모델을 찾을 수 없어요. 관리자에게 문의해주세요.' },
          { status: 500 }
        );
      }
      throw apiError;
    }

    // Extract generated images
    const generatedImages: string[] = [];

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const imgBuffer = Buffer.from(part.inlineData.data, 'base64');
          const imgName = `generated/${sessionId}/${step}/${crypto.randomUUID()}.png`;

          // Save to Supabase Storage
          await supabase.storage
            .from('merryme')
            .upload(imgName, imgBuffer, {
              contentType: 'image/png',
              upsert: true,
            });

          const { data: urlData } = supabase.storage
            .from('merryme')
            .getPublicUrl(imgName);

          generatedImages.push(urlData.publicUrl);
        }
      }
    }

    if (generatedImages.length === 0) {
      // Check if there's a text response explaining why
      const textParts = response.candidates?.[0]?.content?.parts?.filter(
        (p: { text?: string }) => p.text
      );
      const textMsg = textParts?.map((p: { text?: string }) => p.text).join(' ') || '';
      console.error('No images generated. Text response:', textMsg);
      
      return NextResponse.json({
        success: false,
        images: [],
        error: '이미지를 생성하지 못했어요. 다른 테마로 다시 시도해주세요.',
        detail: textMsg,
        prompt,
        step,
      });
    }

    return NextResponse.json({
      success: true,
      images: generatedImages,
      prompt,
      step,
    });
  } catch (error) {
    console.error('Generate API error:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'AI 이미지 생성 중 오류가 발생했어요. 다시 시도해주세요.',
        detail,
      },
      { status: 500 }
    );
  }
}
