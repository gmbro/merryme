import replicate from './client';

/**
 * InstantID-based face-consistent image generation.
 * Takes a reference face photo and generates a new image preserving that identity.
 * Much more accurate than post-generation face swap.
 */
export async function generateWithFace(
  faceImageUrl: string,
  prompt: string,
  negativePrompt?: string,
): Promise<string | null> {
  try {
    console.log('[InstantID] Generating with face reference...');

    const output = await replicate.run(
      'zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789',
      {
        input: {
          image: faceImageUrl,
          prompt: prompt,
          negative_prompt: negativePrompt || '(lowres, low quality, worst quality:1.2), watermark, deformed, ugly, blurry, bad anatomy, extra limbs',
          sdxl_weights: 'protovision-xl-high-fidel',
          face_style_fidelity: 0.5,
          controlnet_conditioning_scale: 0.8,
          ip_adapter_scale: 0.8,
          num_inference_steps: 30,
          guidance_scale: 5,
          seed: Math.floor(Math.random() * 1000000),
        },
      }
    );

    const url = extractUrl(output);
    if (url) {
      console.log('[InstantID] Success!');
      return url;
    }

    console.warn('[InstantID] No output URL');
    return null;
  } catch (error) {
    console.error('[InstantID] Error:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Generate a couple wedding photo using InstantID.
 * Creates image with bride's face, then swaps groom's face.
 */
export async function generateCoupleWithFaces(
  herFaceUrl: string,
  himFaceUrl: string,
  scenePrompt: string,
  targetImageUrl: string, // Gemini-generated scene as fallback
): Promise<string> {
  try {
    // Step 1: Generate bride with InstantID
    const bridePrompt = `${scenePrompt}, beautiful woman, bride, wedding photography, the woman face must be preserved exactly`;
    const brideResult = await generateWithFace(herFaceUrl, bridePrompt);

    if (brideResult) {
      // Step 2: Swap groom face onto the result
      const { swapFace } = await import('./face-swap');
      const finalResult = await swapFace(himFaceUrl, brideResult);
      return finalResult;
    }

    // Fallback: try face swap on Gemini image
    console.log('[InstantID] Bride generation failed, falling back to face swap');
    const { swapCoupleFaces } = await import('./face-swap');
    return await swapCoupleFaces(herFaceUrl, himFaceUrl, targetImageUrl);
  } catch (error) {
    console.error('[InstantID] Couple generation error:', error);
    return targetImageUrl;
  }
}

/**
 * Extract URL from various Replicate output formats
 */
function extractUrl(output: unknown): string | null {
  if (typeof output === 'string' && output.startsWith('http')) return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
  }
  if (output && typeof output === 'object' && 'url' in (output as Record<string, unknown>)) {
    const url = (output as Record<string, unknown>).url;
    if (typeof url === 'string') return url;
  }
  if (output && typeof output === 'object') {
    const str = String(output);
    if (str.startsWith('http')) return str;
  }
  return null;
}
