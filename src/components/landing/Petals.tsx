'use client';

import { useEffect, useRef } from 'react';
import styles from './Petals.module.css';

export default function Petals() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const petalCount = 18;
    const colors = ['petal', 'petal petal-deep', 'petal petal-red'];
    const petals: HTMLDivElement[] = [];

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = colors[i % colors.length];
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDuration = `${6 + Math.random() * 8}s`;
      petal.style.animationDelay = `${Math.random() * 8}s`;
      petal.style.transform = `scale(${0.5 + Math.random() * 1.0})`;
      petal.style.opacity = `${0.5 + Math.random() * 0.5}`;
      container.appendChild(petal);
      petals.push(petal);
    }

    return () => {
      petals.forEach((p) => p.remove());
    };
  }, []);

  return <div ref={containerRef} className={styles.petalsContainer} />;
}
