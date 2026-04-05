'use client';

import { useState, useEffect } from 'react';

/**
 * A custom hook that behaves like useState but persists the value to sessionStorage.
 * This ensures that if the user refreshes the page, their selected options and generated
 * images are maintained flawlessly. 
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(state));
      } catch (err) {
        console.error('Failed to save state to sessionStorage', err);
      }
    }
  }, [key, state]);

  return [state, setState];
}
