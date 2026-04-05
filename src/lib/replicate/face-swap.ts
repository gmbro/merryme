import replicate from './client';

/**
 * Swap face from sourceUrl (original person) onto targetUrl (generated scene image).
 * Returns the URL of the face-swapped image, or the original targetUrl if swap fails.
 */
export async function swapFace(
  sourceImageUrl: string,
  targetImageUrl: string
): Promise<string> {
  try {
    console.log('[FaceSwap] Starting swap...');
    
    const output = await replicate.run(
      'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
      {
        input: {
          source_image: sourceImageUrl,
          target_image: targetImageUrl,
        },
      }
    );

    // Output is typically a URL string or ReadableStream
    if (typeof output === 'string') {
      console.log('[FaceSwap] Success (string URL)');
      return output;
    }
    
    // Handle if output is an object with url
    if (output && typeof output === 'object' && 'url' in (output as Record<string, unknown>)) {
      console.log('[FaceSwap] Success (object URL)');
      return (output as Record<string, unknown>).url as string;
    }

    // If ReadableStream or other format, try to get URL from it
    if (output && typeof output === 'object') {
      const str = String(output);
      if (str.startsWith('http')) {
        console.log('[FaceSwap] Success (toString URL)');
        return str;
      }
    }

    console.warn('[FaceSwap] Unexpected output format, using original');
    return targetImageUrl;
  } catch (error) {
    console.error('[FaceSwap] Error:', error instanceof Error ? error.message : error);
    // Graceful degradation — return original image
    return targetImageUrl;
  }
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
    // Step 1: Swap her face
    const afterHer = await swapFace(herSourceUrl, targetImageUrl);
    
    // Step 2: Swap him face on top
    const afterBoth = await swapFace(himSourceUrl, afterHer);
    
    return afterBoth;
  } catch (error) {
    console.error('[FaceSwap] Couple swap error:', error);
    return targetImageUrl;
  }
}
