'use client';

import { useState, useCallback } from 'react';

interface UseImageGenerationOptions {
  sessionId: string | null;
}

interface GenerateOptions {
  step: 'snapshot' | 'styling' | 'venue' | 'honeymoon';
  options: Record<string, unknown>;
}

export function useImageGeneration({ sessionId }: UseImageGenerationOptions) {
  const [images, setImages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async ({ step, options }: GenerateOptions) => {
      if (!sessionId) {
        setError('세션이 없습니다.');
        return [];
      }

      setGenerating(true);
      setError(null);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, step, options }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI 이미지 생성 실패');

        const newImages = data.images || [];
        setImages((prev) => [...prev, ...newImages]);
        return newImages;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '이미지 생성 중 오류 발생';
        setError(msg);
        return [];
      } finally {
        setGenerating(false);
      }
    },
    [sessionId]
  );

  const reset = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return { images, generating, error, generate, reset, setImages };
}
