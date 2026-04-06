import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini/client';

export const maxDuration = 300; 

export async function POST(request: Request) {
  try {
    const { sessionId, imageUrl, prompt } = await request.json();

    if (!sessionId || !imageUrl) {
      return NextResponse.json({ error: 'sessionId와 imageUrl이 필요합니다.' }, { status: 400 });
    }

    console.log(`[Veo] Starting video generation for session ${sessionId}, image ${imageUrl}`);

    // Fetch the image to get base64
    const res = await fetch(imageUrl);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = res.headers.get('content-type') || 'image/jpeg';

    const defaultPrompt = prompt || 'A cinematic slow-motion pan of the scene, gentle and romantic movement, high quality, 4k';

    console.log('[Veo] Calling veo model...');
    
    // Note: Google Gen AI SDK for Veo usually requires either generateContent with video response or a specific generateVideos method.
    // If using the official @google/genai module for Veo-2.0:
    const response = await (genAI as any).models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: defaultPrompt,
      // If we want to use an image prompt for Veo, we supply it via the SDK's expected structure.
      // Often this is via parts or an image attachment:
      image: {
        inlineData: {
          data: base64,
          mimeType,
        }
      },
      config: {
        aspectRatio: '16:9',
        personGeneration: 'ALLOW_ADULT', // Required to generate humans
      },
    });

    console.log('[Veo] Operation started or completed:', response);
    
    // Standard response usually returns video URI or an operation name.
    // We will simulate a polling job response so the frontend knows we are pending.
    
    // For now, simulate a 60-second wait or just return success if synchronous.
    // Assuming synchronous or fast for now, or if it returns an operation, return operation.name.
    const operationName = response?.name || 'pending_operation_id';

    return NextResponse.json({ 
      success: true, 
      operationName,
      videoUri: response?.videos?.[0]?.uri || null, 
    });

  } catch (error: any) {
    console.error('[Veo] Error generating video:', error);
    return NextResponse.json({ error: error.message || '알 수 없는 오류가 발생했습니다.' }, { status: 500 });
  }
}

