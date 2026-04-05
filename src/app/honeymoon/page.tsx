'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StepIndicator from '@/components/layout/StepIndicator';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

const POPULAR_DESTINATIONS = [
  { id: 'paris', name: '파리', flag: '🇫🇷' },
  { id: 'hawaii', name: '하와이', flag: '🇺🇸' },
  { id: 'bali', name: '발리', flag: '🇮🇩' },
  { id: 'santorini', name: '산토리니', flag: '🇬🇷' },
  { id: 'tokyo', name: '도쿄', flag: '🇯🇵' },
  { id: 'maldives', name: '몰디브', flag: '🇲🇻' },
];

function HoneymoonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [customDest, setCustomDest] = useState('');
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <div className={styles.noSession}>
        <p>세션 정보가 없습니다.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>처음으로</button>
      </div>
    );
  }

  const isCustom = selectedDest === 'custom';
  const effectiveName = isCustom ? customDest : POPULAR_DESTINATIONS.find(d => d.id === selectedDest)?.name || '';
  const canGenerate = effectiveName.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setImages([]);

    try {
      const scene = `${effectiveName}의 아름다운 풍경`;
      const fetchAngle = (angle: number) =>
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, step: 'honeymoon', options: { destination: effectiveName, scene, angleIndex: angle } }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.images?.length > 0) setImages(prev => [...prev, ...data.images]);
          })
          .catch(() => {});

      await Promise.all([fetchAngle(0), fetchAngle(1)]);
      await Promise.all([fetchAngle(2), fetchAngle(3)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.content}>
      {zoomImg && (
        <div className={styles.zoomOverlay} onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="확대" className={styles.zoomImage} />
          <button className={styles.zoomClose} onClick={() => setZoomImg(null)}>✕</button>
        </div>
      )}

      {generating && (
        <div className={styles.loadingPopup}>
          <div className={styles.loadingPopupContent}>
            <span className="loader-ring" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p className={styles.loadingPopupText}>사진작가가 멋지게 촬영중이에요</p>
            <p className={styles.loadingPopupSub}>잠시만 기다려주세요...</p>
          </div>
        </div>
      )}

      <button className={styles.homeBtn} onClick={() => router.push('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        메인으로
      </button>
      <StepIndicator currentStep={3} />

      <div className={styles.headerSection}>
        <h1>가상 신혼여행</h1>
        <p className={styles.subtitle}>꿈의 신혼여행지를 선택해주세요</p>
      </div>

      {/* Destination Selection */}
      <section className={styles.destSection}>
        <div className={styles.destGrid}>
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.id}
              className={`${styles.destCard} ${selectedDest === dest.id ? styles.destSelected : ''}`}
              onClick={() => { setSelectedDest(dest.id); setCustomDest(''); }}
              disabled={generating}
            >
              <span className={styles.destFlag}>{dest.flag}</span>
              <span className={styles.destName}>{dest.name}</span>
            </button>
          ))}
          <button
            className={`${styles.destCard} ${isCustom ? styles.destSelected : ''}`}
            onClick={() => setSelectedDest('custom')}
            disabled={generating}
          >
            <span className={styles.destFlag}>+</span>
            <span className={styles.destName}>직접 입력</span>
          </button>
        </div>

        {isCustom && (
          <div className={styles.customInput}>
            <input
              type="text"
              placeholder="여행지를 입력하세요 (예: 스위스, 런던)"
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
              className={styles.customField}
              autoFocus
            />
          </div>
        )}
      </section>

      {/* Generate */}
      <div className={styles.generateSection}>
        <button className="btn btn-primary btn-large" onClick={handleGenerate} disabled={!canGenerate || generating} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}>
          {generating ? '촬영 중...' : '신혼여행 사진 생성'}
        </button>
        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      {/* Generated Images */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>
            {effectiveName} 신혼여행 <span className={styles.countBadge}>{images.length}장</span>
          </h3>
          <div className={styles.gallery}>
            {images.map((url, i) => (
              <div key={i} className={styles.imageCard} onClick={() => setZoomImg(url)} style={{ cursor: 'pointer' }}>
                <img src={url} alt={`신혼여행 ${i + 1}`} className={styles.generatedImage} />
                <div className={styles.zoomHint}>확대</div>
              </div>
            ))}
          </div>
          <div className={styles.nextSection}>
            <button className="btn btn-primary btn-large" onClick={() => router.push(`/gallery/${sessionId}`)} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }} disabled={images.length < 4}>
              갤러리 바로가기
            </button>
            <button className="btn btn-secondary" onClick={() => { setSelectedDest(null); setImages([]); setCustomDest(''); }} disabled={generating} style={{ whiteSpace: 'nowrap' }}>
              다른 여행지로 다시 생성
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function HoneymoonPage() {
  return (
    <main className={styles.main}>
      <div className="container">
        <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
          <HoneymoonContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
