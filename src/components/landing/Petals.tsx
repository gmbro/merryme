'use client';

import { useEffect, useRef } from 'react';
import styles from './Petals.module.css';

export default function Petals() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const petalCount = 18;
    const petals: HTMLDivElement[] = [];

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDuration = `${8 + Math.random() * 12}s`;
      petal.style.animationDelay = `${Math.random() * 10}s`;
      petal.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
      container.appendChild(petal);
      petals.push(petal);
    }

    return () => {
      petals.forEach((p) => p.remove());
    };
  }, []);

  return <div ref={containerRef} className={styles.petalsContainer} />;
}
