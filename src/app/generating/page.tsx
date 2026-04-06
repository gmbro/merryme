'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import styles from './page.module.css';

// Sample background images for the loading slideshow
const SLIDESHOW_IMAGES = [
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546193430-c2d207739ed7?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070&auto=format&fit=crop'
];

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Slideshow interval
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    let isMounted = true;
    
    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Hold at 90% until actually done
        return prev + Math.random() * 5;
      });
    }, 1000);

    const generateAlbum = async () => {
      try {
        const res = await fetch('/api/generate-album', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '앨범 생성 실패');

        if (isMounted) {
          setProgress(100);
          setTimeout(() => {
            router.push(`/gallery/${sessionId}`);
          }, 1000);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
      } finally {
        clearInterval(progressInterval);
      }
    };

    generateAlbum();

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [sessionId, router]);

  return (
    <div className={styles.container}>
      <div className={styles.slideshow}>
        {SLIDESHOW_IMAGES.map((src, idx) => (
          <div
            key={src}
            className={`${styles.slide} ${idx === currentSlide ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <div className={styles.textWrapper}>
          <h1 className={styles.title}>두 분의 웨딩 스토리를 그리는 중입니다</h1>
          <p className={styles.subtitle}>수십 장의 스냅, 예식장, 신혼여행 이미지를 생성하고 있어요.<br/>(약 1분 정도 소요될 수 있습니다)</p>
          
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
              />
            </div>
            <p className={styles.progressText}>{Math.round(progress)}% 완료</p>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <p>앗, 잠시 문제가 생겼어요: {error}</p>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>다시 시도하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratingPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
          <GeneratingContent />
        </Suspense>
      </main>
    </>
  );
}
