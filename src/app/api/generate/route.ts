import { NextRequest, NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL } from '@/lib/gemini/client';
import { createServiceClient } from '@/lib/supabase/server';
import { swapCoupleFaces, swapFace } from '@/lib/replicate/face-swap';
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

async function detectFacePositions(imageUrl: string): Promise<{ brideIndex: number; groomIndex: number }> {
  try {
    const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: 'Look at the couple in this image. Who is on the left? Reply with EXACTLY "female,male" if the woman is on the left and man is on the right. Reply with "male,female" if the man is on the left. Reply with "female,male" as fallback if unsure.' },
          ],
        },
      ],
    });
    const text = (result.text || '').toLowerCase();
    if (text.includes('male,female') || text.includes('male, female')) {
      return { brideIndex: 1, groomIndex: 0 };
    }
    return { brideIndex: 0, groomIndex: 1 };
  } catch (error) {
    console.error('Face position detection failed, falling back to 0,1:', error);
    return { brideIndex: 0, groomIndex: 1 };
  }
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

    for (const type of ['her', 'him', 'couple']) {
      const { data: files } = await supabase.storage
        .from('merryme')
        .list(`uploads/${sessionId}/${type}`);

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from('merryme')
          .getPublicUrl(`uploads/${sessionId}/${type}/${files[0].name}`);

        if (type !== 'couple') {
          refUrls[type] = urlData.publicUrl;
        }

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

    // Add text prompt with reference photo instruction
    // Based on the number of images: 1st=Bride, 2nd=Groom, (optional) 3rd=Couple
    const hasCouplePhoto = referenceImages.length >= 3;
    const bodyInstruction = hasCouplePhoto
      ? `1. BODY & CHEMISTRY: Use the 3RD reference photo (the couple photo) to determine the exact height difference, body proportions, body shapes, and romantic chemistry between the bride and groom. DONT substitute with default proportions.`
      : `1. BODY: The bride is approximately 169cm tall. The groom is approximately 180cm tall. Match these proportions.`;

    const refInstruction = referenceImages.length > 0 
      ? `

=== CHARACTER CONSISTENCY INSTRUCTIONS ===
The reference photo(s) above show the REAL people who must appear in the generated image.
${bodyInstruction}
2. SKIN: Match the exact skin tone and complexion from the face reference photos.
3. HAIR: Same hairstyle, hair color, hair length, hair texture.
4. GENDER: First reference = bride (female), second reference = groom (male).
5. FACE: Generate faces that closely resemble the 1ST and 2ND reference photos. The faces should be clearly visible and well-lit.
6. The people in the output image must look natural and proportionate.
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

          // Multi-Face Swap: replace faces using FaceFusion
          if (step === 'styling') {
            const genderUrl = options.gender === 'him' ? refUrls.him : refUrls.her;
            if (genderUrl) {
              try {
                console.log(`[FaceSwap-Single] Swapping face for styling...`);
                const swappedUrl = await swapFace(genderUrl, finalUrl);
                
                // If swap succeeded, save to storage
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
                  console.log('[FaceSwap-Single] Saved swapped image');
                }
              } catch (swapErr) {
                console.error('[FaceSwap-Single] Error, using Gemini original:', swapErr);
              }
            }
          } else if (refUrls.her && refUrls.him) {
            try {
              console.log(`[FaceSwap-Multi] Analyzing positions for ${step}...`);
              const positions = await detectFacePositions(finalUrl);
              console.log(`[FaceSwap-Multi] Swapping faces for ${step}... mapped Bride=${positions.brideIndex}, Groom=${positions.groomIndex}`);
              const swappedUrl = await swapCoupleFaces(
                refUrls.her,
                refUrls.him,
                finalUrl,
                positions.brideIndex,
                positions.groomIndex
              );
              
              // If swap succeeded, save to storage
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
                console.log('[FaceSwap-Multi] Saved swapped image');
              }
            } catch (swapErr) {
              console.error('[FaceSwap-Multi] Error, using Gemini original:', swapErr);
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
