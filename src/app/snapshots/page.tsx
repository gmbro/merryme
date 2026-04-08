'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { usePersistedState } from '@/hooks/usePersistedState';
import StepIndicator from '@/components/layout/StepIndicator';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

const THEMES = [
  { id: 'cherry_blossom', name: '봄날의 벚꽃', emoji: '🌸' },
  { id: 'beach_sunset', name: '해변 선셋', emoji: '🌅' },
  { id: 'classic_studio', name: '클래식 스튜디오', emoji: '📷' },
  { id: 'forest_garden', name: '숲속 가든', emoji: '🌿' },
  { id: 'autumn_park', name: '가을 단풍', emoji: '🍂' },
  { id: 'snowy_winter', name: '겨울 눈꽃', emoji: '❄️' },
  { id: 'hanok_traditional', name: '전통 한옥', emoji: '🏯' },
];

function SnapshotsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sessionId, getStepUrl } = useSession(searchParams.get('session'));

  const [selectedTheme, setSelectedTheme] = usePersistedState<string | null>(`merryme_snapshots_theme_${sessionId}`, null);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = usePersistedState<string[]>(`merryme_snapshots_images_${sessionId}`, []);
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

  const themeName = THEMES.find(t => t.id === selectedTheme)?.name || '';

  const handleGenerate = async () => {
    if (!selectedTheme) return;
    setGenerating(true);
    setError(null);
    setImages([]);

    try {
      const fetchAngle = (angle: number) =>
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, step: 'snapshot', options: { theme: selectedTheme, angleIndex: angle } }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.images?.length > 0) setImages(prev => [...prev, ...data.images]);
          })
          .catch(() => {});

      await Promise.all([fetchAngle(0), fetchAngle(1)]);
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
      <StepIndicator currentStep={1} />

      {/* Selection View */}
      {images.length === 0 && (
        <>
          <div className={styles.headerSection}>
            <h1>가상 웨딩 스냅</h1>
            <p className={styles.subtitle}>원하는 촬영 컨셉을 선택해주세요</p>
          </div>

          <section className={styles.destSection}>
            <div className={styles.destGrid}>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  className={`${styles.destCard} ${selectedTheme === theme.id ? styles.destSelected : ''}`}
                  onClick={() => setSelectedTheme(theme.id)}
                  disabled={generating}
                >
                  <span className={styles.destFlag}>{theme.emoji}</span>
                  <span className={styles.destName}>{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          <div className={styles.generateSection}>
            <button className="btn btn-primary btn-large" onClick={handleGenerate} disabled={!selectedTheme || generating} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}>
              {generating ? '촬영 중...' : '스냅사진 생성'}
            </button>
            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>
        </>
      )}

      {/* Results View */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>
            {themeName} 스냅사진 <span className={styles.countBadge}>{images.length}장</span>
          </h3>
          <div className={styles.gallery}>
            {images.map((url, i) => (
              <div key={i} className={styles.imageCard} onClick={() => setZoomImg(url)} style={{ cursor: 'pointer' }}>
                <img src={url} alt={`스냅사진 ${i + 1}`} className={styles.generatedImage} />
                <div className={styles.zoomHint}>확대</div>
              </div>
            ))}
          </div>
          <div className={styles.nextSection}>
            <button className="btn btn-primary btn-large" onClick={() => router.push(getStepUrl('venue'))} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }} disabled={images.length < 2}>
              다음: 예식장 시뮬레이션
            </button>
            <button className="btn btn-secondary" onClick={() => { setSelectedTheme(null); setImages([]); }} disabled={generating} style={{ whiteSpace: 'nowrap' }}>
              다른 테마로 다시 생성
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function SnapshotsPage() {
  return (
    <main className={styles.main}>
      <div className="container">
        <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
          <SnapshotsContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
