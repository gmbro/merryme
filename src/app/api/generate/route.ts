import { NextRequest, NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL } from '@/lib/gemini/client';
import { createServiceClient } from '@/lib/supabase/server';
import { swapCoupleFaces } from '@/lib/replicate/face-swap';
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

export const maxDuration = 120; // Vercel timeout — longer for retries

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
    angleIndex?: number;
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
    const refUrls: Record<string, string> = {}; // for face swap

    for (const type of ['her', 'him']) {
      const { data: files } = await supabase.storage
        .from('merryme')
        .list(`uploads/${sessionId}/${type}`);

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from('merryme')
          .getPublicUrl(`uploads/${sessionId}/${type}/${files[0].name}`);

        refUrls[type] = urlData.publicUrl;

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
        prompt = buildSnapshotPrompt(options.theme || 'cherry_blossom', options.angleIndex || 0);
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
        prompt = buildVenuePrompt(options.venueStyle || 'elegant garden wedding', options.angleIndex || 0);
        break;
      case 'honeymoon':
        prompt = buildHoneymoonPrompt(
          options.destination || '파리',
          options.scene || '에펠탑 앞에서 다정하게 사진을 찍는 모습',
          options.angleIndex || 0
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

    // Add text prompt with STRONG reference photo instruction
    const refInstruction = referenceImages.length > 0 
      ? `

=== CRITICAL CHARACTER CONSISTENCY INSTRUCTIONS ===
The ${referenceImages.length} reference photo(s) above show the REAL people who must appear in the generated image.
1. FACE: Copy the EXACT face shape, eye shape, nose, lips, jawline, eyebrows from the reference photos. The faces must be recognizable as the SAME people.
2. SKIN: Match the exact skin tone and complexion.
3. HAIR: Same hairstyle, hair color, hair length, hair texture.
4. BODY: Same body type, height proportion, build.
5. GENDER: Do NOT change genders. If reference shows two males, generate two males. If two females, generate two females.
6. The people in the output image must look like they could be the SAME INDIVIDUALS photographed on a different day, NOT different people.
=== END CHARACTER INSTRUCTIONS ===`
      : '';
    contents.push({ text: prompt + refInstruction });

    // Call Gemini API with retry for rate limiting
    let response;
    const MAX_RETRIES = 4;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await genAI.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: 'user', parts: contents }],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        break; // success
      } catch (apiError) {
        const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
        console.error(`Gemini API attempt ${attempt + 1}/${MAX_RETRIES}:`, errMsg);
        
        // Rate limit — retry with aggressive backoff
        if (errMsg.includes('429') || errMsg.includes('RATE') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          if (attempt < MAX_RETRIES - 1) {
            const delays = [2000, 5000, 10000]; // 2s, 5s, 10s
            const delay = delays[attempt] || 30000;
            console.log(`Rate limited, waiting ${delay}ms before retry (attempt ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          return NextResponse.json(
            { error: 'API 요청이 많아요. 30초 후 다시 시도해주세요.' },
            { status: 429 }
          );
        }
        
        if (errMsg.includes('SAFETY') || errMsg.includes('safety')) {
          return NextResponse.json(
            { error: 'AI 안전 정책에 의해 이미지를 생성할 수 없었어요. 다른 테마를 선택해 보세요.' },
            { status: 400 }
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
    }

    if (!response) {
      return NextResponse.json(
        { error: '이미지 생성에 실패했어요. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // Extract generated images
    const generatedImages: string[] = [];

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const imgBuffer = Buffer.from(part.inlineData.data, 'base64');
          const imgName = `generated/${sessionId}/${step}/${crypto.randomUUID()}.png`;

          // Save raw Gemini image to Supabase
          await supabase.storage
            .from('merryme')
            .upload(imgName, imgBuffer, {
              contentType: 'image/png',
              upsert: true,
            });

          const { data: urlData } = supabase.storage
            .from('merryme')
            .getPublicUrl(imgName);

          let finalUrl = urlData.publicUrl;

          // Face Swap: replace faces with uploaded reference photos
          if (refUrls.her && refUrls.him) {
            try {
              console.log(`[FaceSwap] Swapping faces for ${step}...`);
              const swappedUrl = await swapCoupleFaces(
                refUrls.her,
                refUrls.him,
                finalUrl
              );
              
              // If swap succeeded (different URL), save to storage
              if (swappedUrl !== finalUrl && swappedUrl.startsWith('http')) {
                const swapRes = await fetch(swappedUrl);
                const swapBuffer = Buffer.from(await swapRes.arrayBuffer());
                const swapName = `generated/${sessionId}/${step}/swap_${crypto.randomUUID()}.png`;
                
                await supabase.storage
                  .from('merryme')
                  .upload(swapName, swapBuffer, {
                    contentType: 'image/png',
                    upsert: true,
                  });

                const { data: swapUrlData } = supabase.storage
                  .from('merryme')
                  .getPublicUrl(swapName);

                finalUrl = swapUrlData.publicUrl;
                console.log('[FaceSwap] Saved swapped image');
              }
            } catch (swapErr) {
              console.error('[FaceSwap] Error, using original:', swapErr);
              // Keep original Gemini image
            }
          }

          generatedImages.push(finalUrl);
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
