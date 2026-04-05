'use client';

import { useState, useCallback } from 'react';

/**
 * Session management hook.
 * Manages sessionId from URL params and provides helpers for navigation.
 */
export function useSession(initialSessionId?: string | null) {
  const [sessionId] = useState<string | null>(initialSessionId || null);

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
