import replicate from './client';

/**
 * Swap face from sourceUrl (original person) onto targetUrl (generated scene image).
 * Uses multiple face swap models with fallback.
 */
export async function swapFace(
  sourceImageUrl: string,
  targetImageUrl: string
): Promise<string> {
  // Try multiple models in order of quality
  const models = [
    'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
  ];

  for (const model of models) {
    try {
      console.log(`[FaceSwap] Trying ${model.split('/')[0]}...`);

      const output = await replicate.run(model as `${string}/${string}:${string}`, {
        input: {
          source_image: sourceImageUrl,
          target_image: targetImageUrl,
        },
      });

      const resultUrl = extractUrl(output);
      if (resultUrl) {
        console.log('[FaceSwap] Success!');
        return resultUrl;
      }
    } catch (error) {
      console.error(`[FaceSwap] ${model.split('/')[0]} failed:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  console.warn('[FaceSwap] All models failed, using original');
  return targetImageUrl;
}

/**
 * Extract URL from various Replicate output formats
 */
function extractUrl(output: unknown): string | null {
  // String URL
  if (typeof output === 'string' && output.startsWith('http')) {
    return output;
  }

  // Array of strings (some models return [url])
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
  }

  // Object with url property
  if (output && typeof output === 'object' && 'url' in (output as Record<string, unknown>)) {
    const url = (output as Record<string, unknown>).url;
    if (typeof url === 'string') return url;
  }

  // ReadableStream — convert to URL via toString or iterate
  if (output && typeof output === 'object') {
    const str = String(output);
    if (str.startsWith('http')) return str;

    // Check if it's a FileOutput with url()
    if ('url' in (output as object) && typeof (output as { url: () => unknown }).url === 'function') {
      const url = (output as { url: () => string }).url();
      if (typeof url === 'string') return url;
    }
  }

  return null;
}

/**
 * Swap faces for a couple (both her and him) onto a generated scene.
 * Applies her face first, then him face on the result.
 */
export async function swapCoupleFaces(
  herSourceUrl: string,
  himSourceUrl: string,
  targetImageUrl: string
): Promise<string> {
  try {
    // Step 1: Swap her face (bride — usually the main female face)
    console.log('[FaceSwap] Step 1: Swapping bride face...');
    const afterHer = await swapFace(herSourceUrl, targetImageUrl);

    // Step 2: Swap him face on the result (groom — usually the main male face)
    console.log('[FaceSwap] Step 2: Swapping groom face...');
    const afterBoth = await swapFace(himSourceUrl, afterHer);

    return afterBoth;
  } catch (error) {
    console.error('[FaceSwap] Couple swap error:', error);
    return targetImageUrl;
  }
}
