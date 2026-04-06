import { NextRequest, NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL } from '@/lib/gemini/client';
import { createServiceClient } from '@/lib/supabase/server';
import { swapCoupleFaces, swapFace } from '@/lib/replicate/face-swap';
import {
  buildSnapshotPrompt,
  buildStylingPrompt,
  buildVenuePrompt,
  buildHoneymoonPrompt,
} from '@/lib/gemini/prompts';
import crypto from 'crypto';

export const maxDuration = 180; // Extended duration for batch processing

interface GenerateAlbumBody {
  sessionId: string;
}

// 앨범 생성을 위한 테마 조합 리스트 (총 8장)
const ALBUM_TASKS = [
  { step: 'styling', prompt: buildStylingPrompt('her', 'a_line', undefined, 'natural') },
  { step: 'styling', prompt: buildStylingPrompt('him', undefined, 'classic_black', undefined) },
  { step: 'venue', prompt: buildVenuePrompt('elegant garden wedding', 0) },
  { step: 'venue', prompt: buildVenuePrompt('luxurious hotel ballroom', 1) },
  { step: 'snapshots', prompt: buildSnapshotPrompt('classic_studio', 0) },
  { step: 'snapshots', prompt: buildSnapshotPrompt('beach_sunset', 1) },
  { step: 'honeymoon', prompt: buildHoneymoonPrompt('파리', '에펠탑 앞에서 다정하게 사진을 찍는 모습', 0) },
  { step: 'honeymoon', prompt: buildHoneymoonPrompt('몰디브', '에메랄드빛 바다 배경으로 칵테일을 들고 있는 모습', 1) },
];

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
    const body: GenerateAlbumBody = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Storage에서 사용자가 업로드한 기준 이미지 가져오기
    const referenceImages: { base64: string; mimeType: string }[] = [];
    const refUrls: Record<string, string> = {}; 

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
          const { base64, mimeType } = await fetchImageAsBase64(urlData.publicUrl);
          referenceImages.push({ base64, mimeType });
        } catch (error) {
          console.error(`Failed to fetch reference image ${type}:`, error);
        }
      }
    }

    if (referenceImages.length === 0) {
      return NextResponse.json({ error: '기반이 될 사진(얼굴 사진)을 찾지 못했어요.' }, { status: 404 });
    }

    const hasCouplePhoto = referenceImages.length >= 3;
    const bodyInstruction = hasCouplePhoto
      ? `1. BODY & CHEMISTRY: Use the 3RD reference photo (the couple photo) to determine the exact height difference, body proportions, body shapes, and romantic chemistry between the bride and groom. DONT substitute with default proportions.`
      : `1. BODY: The bride is approximately 169cm tall. The groom is approximately 180cm tall. Match these proportions.`;

    const refInstruction = referenceImages.length > 0 
      ? `\n\n=== CHARACTER CONSISTENCY INSTRUCTIONS ===
The reference photo(s) above show the REAL people who must appear in the generated image. DO NOT CREATE GENERIC YOUNG ATTRACTIVE MODELS.
${bodyInstruction}
2. AGE AND FACIAL GEOMETRY (CRITICAL): You MUST EXACTLY MATCH the physical age, face shape, roundness, wrinkles, and jawline of the people in the reference photos.
3. GLASSES AND ACCESSORIES (CRITICAL): If the reference person is wearing glasses, YOU MUST generate them wearing identical glasses.
4. SKIN & HAIR: Match the exact skin tone, complexion, hairstyle, hair color, and texture.
5. GENDER: First reference = bride (female), second reference = groom (male).
6. RESULT: The generated base image must look like the EXACT SAME PEOPLE from the reference images, just in a different setting.
=== END CHARACTER INSTRUCTIONS ===`
      : '';

    // 2. Batch Generation Loop - Parallellized natively but chunked to avoid rate limiting
    const generatedImagesMap: { [key: string]: string[] } = {
      styling: [],
      venue: [],
      snapshots: [],
      honeymoon: []
    };

    let generatedCount = 0;
    
    // Chunk array helper to prevent 429 requests and process in chunks of 3
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
      return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );
    };

    const taskChunks = chunkArray(ALBUM_TASKS, 3);

    for (const chunk of taskChunks) {
      // Process each chunk in parallel
      await Promise.all(
        chunk.map(async (task) => {
          const contents = referenceImages.map(img => ({
            inlineData: { data: img.base64, mimeType: img.mimeType }
          }));
          // Cast text part correctly to satisfy TS types
          contents.push({ text: task.prompt + refInstruction } as any);

          try {
            const response = await genAI.models.generateContent({
              model: GEMINI_MODEL,
              contents: [{ role: 'user', parts: contents }],
              config: { responseModalities: ['TEXT', 'IMAGE'] },
            });

            let generatedUrl: string | null = null;
            if (response.candidates && response.candidates.length > 0) {
              const parts = response.candidates[0].content?.parts || [];
              for (const part of parts) {
                if (part.inlineData) {
                  const base64Data = part.inlineData.data || '';
                  const buffer = Buffer.from(base64Data, 'base64');
                  const fileName = `generated/${sessionId}/${task.step}/imagen_${crypto.randomUUID()}.png`;
                  
                  await supabase.storage.from('merryme').upload(fileName, buffer, {
                    contentType: 'image/png',
                    upsert: true,
                  });

                  const { data: urlData } = supabase.storage.from('merryme').getPublicUrl(fileName);
                  generatedUrl = urlData.publicUrl;
                  break;
                }
              }
            }

            // Apply Face Swap if generated successfully
            if (generatedUrl) {
              let finalUrl = generatedUrl;
              
              if (task.step === 'styling' && task.prompt.includes('bride')) {
                if (refUrls.her) {
                  try {
                    finalUrl = await swapFace(refUrls.her, finalUrl);
                  } catch (err) { console.error('FaceSwap Error (Her):', err); }
                }
              } else if (task.step === 'styling' && task.prompt.includes('groom')) {
                if (refUrls.him) {
                  try {
                    finalUrl = await swapFace(refUrls.him, finalUrl);
                  } catch (err) { console.error('FaceSwap Error (Him):', err); }
                }
              } else if (refUrls.her && refUrls.him) {
                try {
                  const positions = await detectFacePositions(finalUrl);
                  finalUrl = await swapCoupleFaces(refUrls.her, refUrls.him, finalUrl, positions.brideIndex, positions.groomIndex);
                } catch (err) { console.error('FaceSwap Error (Multi):', err); }
              }

              if (finalUrl !== generatedUrl && finalUrl.startsWith('http')) {
                const swapRes = await fetch(finalUrl);
                const swapBuffer = Buffer.from(await swapRes.arrayBuffer());
                const swapName = `generated/${sessionId}/${task.step}/swap_${crypto.randomUUID()}.png`;
                await supabase.storage.from('merryme').upload(swapName, swapBuffer, {
                  contentType: 'image/png',
                  upsert: true,
                });
                const { data: swapUrlData } = supabase.storage.from('merryme').getPublicUrl(swapName);
                finalUrl = swapUrlData.publicUrl;
              }

              generatedImagesMap[task.step].push(finalUrl);
              generatedCount++;
            }
          } catch (err) {
            console.error(`Skipping batch task ${task.step} due to error:`, err);
          }
        })
      );
    }

    if (generatedCount === 0) {
      return NextResponse.json({ error: 'AI 이미지 생성에 모두 실패했습니다.', success: false }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      images: generatedImagesMap,
    });
  } catch (error) {
    console.error('Generate Album API error:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'AI 이미지 생성 중 서버 오류가 발생했어요.', detail }, { status: 500 });
  }
}
