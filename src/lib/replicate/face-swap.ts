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
 * Swap faces for a couple onto a generated scene using indexed Multi-Face Swap.
 * Relies on Gemini prompt constraint: Bride is always left (index 0), Groom is right (index 1).
 */
export async function swapCoupleFaces(
  herSourceUrl: string,
  himSourceUrl: string,
  targetImageUrl: string
): Promise<string> {
  try {
    const MODEL_ID = 'mertguvencli/face-swap-with-indexes:518f2116425c40acb5c234031c55daf843c1357eff784370fe9489e57b65c150';

    // Step 1: Swap Bride's face (Target Index 0)
    console.log('[FaceSwap-Multi] Step 1: Swapping Bride (Index 0)...');
    const brideSwapOutput = await replicate.run(MODEL_ID, {
      input: {
        source_image: herSourceUrl,
        target_image: targetImageUrl,
        source_face_index: 0,
        target_face_indices: "0",
      },
    });
    
    const brideResultUrl = extractUrl(brideSwapOutput);
    if (!brideResultUrl) throw new Error('Bride swap failed to return a URL');

    // Step 2: Swap Groom's face onto the result (Target Index 1)
    console.log('[FaceSwap-Multi] Step 2: Swapping Groom (Index 1)...');
    const groomSwapOutput = await replicate.run(MODEL_ID, {
      input: {
        source_image: himSourceUrl,
        target_image: brideResultUrl,
        source_face_index: 0,
        target_face_indices: "1",
      },
    });

    const finalResultUrl = extractUrl(groomSwapOutput);
    if (!finalResultUrl) return brideResultUrl; // At least bride is swapped

    console.log('[FaceSwap-Multi] Couple swap successful!');
    return finalResultUrl;
  } catch (error) {
    console.error('[FaceSwap-Multi] Couple swap error:', error);
    return targetImageUrl; // Fallback to original
  }
}
