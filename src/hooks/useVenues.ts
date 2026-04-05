'use client';

import { useState, useEffect, useCallback } from 'react';

interface Venue {
  id: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hallCount: number | null;
  sido: string | null;
  sigungu: string | null;
}

interface UseVenuesOptions {
  sido?: string;
  sigungu?: string;
  autoFetch?: boolean;
}

export function useVenues({ sido, sigungu, autoFetch = false }: UseVenuesOptions = {}) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchVenues = useCallback(
    async (params?: { sido?: string; sigungu?: string; page?: number }) => {
      const s = params?.sido || sido || '';
      if (!s) return;

      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (s) query.set('sido', s);
        if (params?.sigungu || sigungu) query.set('sigungu', params?.sigungu || sigungu || '');
        if (params?.page) query.set('page', String(params.page));
        query.set('size', '50');

        const res = await fetch(`/api/venues?${query.toString()}`);
        const data = await res.json();

        if (data.success) {
          setVenues(data.venues || []);
          setTotal(data.total || 0);
        } else {
          throw new Error(data.error || '예식장 검색 실패');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류 발생');
      } finally {
        setLoading(false);
      }
    },
    [sido, sigungu]
  );

  useEffect(() => {
    if (autoFetch && sido) {
      fetchVenues();
    }
  }, [autoFetch, sido, fetchVenues]);

  return { venues, loading, error, total, fetchVenues };
}
