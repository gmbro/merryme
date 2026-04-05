'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StepIndicator from '@/components/layout/StepIndicator';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

const VENUE_STYLES = [
  { id: 'garden', name: '정원 웨딩', style: 'Elegant outdoor garden wedding with lush greenery, flower arches, and natural sunlight', preview: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop' },
  { id: 'hotel', name: '호텔 웨딩', style: 'Luxurious hotel ballroom wedding with crystal chandeliers, elegant draping, and warm golden lighting', preview: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop' },
  { id: 'beach', name: '해변 웨딩', style: 'Romantic beach wedding ceremony with ocean backdrop, white fabric canopy, sunset golden hour', preview: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400&h=300&fit=crop' },
  { id: 'rooftop', name: '루프탑 웨딩', style: 'Modern rooftop wedding with city skyline backdrop, string lights, minimalist elegant decor', preview: 'https://images.unsplash.com/photo-1470076892663-af684e5e15af?w=400&h=300&fit=crop' },
  { id: 'hanok', name: '한옥 웨딩', style: 'Traditional Korean hanok wedding with wooden architecture, paper lanterns, courtyard ceremony in hanbok', preview: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&h=300&fit=crop' },
  { id: 'cathedral', name: '성당 웨딩', style: 'Grand cathedral wedding with stained glass windows, high vaulted ceilings, dramatic organ pipes, candlelight', preview: 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300&fit=crop' },
];

function VenueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
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

  const venueData = VENUE_STYLES.find((v) => v.id === selectedStyle);

  const handleGenerate = async () => {
    if (!venueData) return;
    setGenerating(true);
    setError(null);
    setImages([]);

    try {
      const fetchAngle = (angle: number) =>
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, step: 'venue', options: { venueStyle: venueData.style, angleIndex: angle } }),
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
      <StepIndicator currentStep={2} />

      <div className={styles.headerSection}>
        <h1>가상 결혼식장</h1>
        <p className={styles.subtitle}>원하는 웨딩 스타일을 선택해주세요</p>
      </div>

      {/* Style Cards */}
      <section className={styles.themeSection}>
        <div className={styles.themeGrid}>
          {VENUE_STYLES.map((v) => (
            <button
              key={v.id}
              className={`${styles.themeCard} ${selectedStyle === v.id ? styles.themeCardSelected : ''}`}
              onClick={() => setSelectedStyle(v.id)}
              disabled={generating}
            >
              <div className={styles.themeImgWrap}>
                <img src={v.preview} alt={v.name} className={styles.themeImg} />
                {selectedStyle === v.id && (
                  <div className={styles.themeCheck}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                )}
              </div>
              <span className={styles.themeName}>{v.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Generate */}
      <div className={styles.generateSection}>
        <button className="btn btn-primary btn-large" onClick={handleGenerate} disabled={!selectedStyle || generating} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}>
          {generating ? '촬영 중...' : '결혼식 시뮬레이션 시작'}
        </button>
        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      {/* Generated Images */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>가상 결혼식 장면 <span className={styles.countBadge}>{images.length}장</span></h3>
          <div className={styles.gallery}>
            {images.map((url, i) => (
              <div key={i} className={styles.imageCard} onClick={() => setZoomImg(url)} style={{ cursor: 'pointer' }}>
                <img src={url} alt={`결혼식 ${i + 1}`} className={styles.generatedImage} />
                <div className={styles.zoomHint}>확대</div>
              </div>
            ))}
          </div>
          <div className={styles.nextSection}>
            <button className="btn btn-primary btn-large" onClick={() => router.push(`/honeymoon?session=${sessionId}`)} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }} disabled={images.length < 4}>
              다음: 신혼여행
            </button>
            <button className="btn btn-secondary" onClick={() => { setSelectedStyle(null); setImages([]); }} disabled={generating} style={{ whiteSpace: 'nowrap' }}>
              다른 스타일로 다시 생성
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function VenuePage() {
  return (
    <main className={styles.main}>
      <div className="container">
        <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
          <VenueContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
