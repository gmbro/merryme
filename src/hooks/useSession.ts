'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Session management hook.
 * Manages sessionId from URL params, provides helpers for navigation,
 * and enforces a strict 1-hour expiration return to the home screen.
 */
export function useSession(initialSessionId?: string | null) {
  const [sessionId] = useState<string | null>(initialSessionId || null);
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) return;
    if (typeof window === 'undefined') return;

    const ONE_HOUR_MS = 60 * 60 * 1000;
    const storageKey = `merryme_session_start_${sessionId}`;
    
    let startTime = localStorage.getItem(storageKey);
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(storageKey, startTime);
    }

    const elapsed = Date.now() - parseInt(startTime, 10);
    if (elapsed > ONE_HOUR_MS) {
      // Session expired right away
      localStorage.removeItem(storageKey);
      alert('보안 및 최적화를 위해 세션이 만료되어 처음 화면으로 돌아갑니다.');
      router.push('/');
      return;
    }

    // Set timeout to return exactly precisely when 1 hour is reached
    const remainingTime = ONE_HOUR_MS - elapsed;
    const timeoutId = setTimeout(() => {
      localStorage.removeItem(storageKey);
      alert('1시간이 경과하여 처음 화면으로 이동합니다.');
      router.push('/');
    }, remainingTime);

    return () => clearTimeout(timeoutId);
  }, [sessionId, router]);

  const getStepUrl = useCallback(
    (step: 'snapshots' | 'styling' | 'venue' | 'honeymoon' | 'gallery') => {
      if (!sessionId) return '/';
      if (step === 'gallery') return `/gallery/${sessionId}`;
      return `/${step}?session=${sessionId}`;
    },
    [sessionId]
  );

  return { sessionId, getStepUrl };
}
