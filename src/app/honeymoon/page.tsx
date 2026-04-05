'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import StepIndicator from '@/components/layout/StepIndicator';
import styles from './page.module.css';

const DESTINATIONS = [
  { id: 'paris', emoji: '🗼', name: '파리', scenes: ['에펠탑 앞에서 포옹하는 모습', '세느강변 카페에서 커피를 마시는 모습', '몽마르뜨 언덕에서 석양을 바라보는 모습'] },
  { id: 'santorini', emoji: '🇬🇷', name: '산토리니', scenes: ['파란 돔 교회 앞에서 손잡고 걷는 모습', '절벽 위 화이트 테라스에서 와인을 즐기는 모습', '석양 지는 이아 마을 배경으로 키스하는 모습'] },
  { id: 'bali', emoji: '🌺', name: '발리', scenes: ['우붓 라이스 테라스에서 산책하는 모습', '풀빌라 인피니티 풀에서 즐기는 모습', '해변 선셋 앞에서 다정히 걷는 모습'] },
  { id: 'jeju', emoji: '🍊', name: '제주도', scenes: ['유채꽃밭에서 손잡고 걷는 모습', '성산일출봉을 배경으로 사진 찍는 모습', '해안 올레길에서 다정하게 산책하는 모습'] },
  { id: 'maldives', emoji: '🏝️', name: '몰디브', scenes: ['수상 방갈로 테라스에서 바다를 바라보는 모습', '맑은 바다에서 스노클링하는 모습', '해질녘 모래사장에서 디너를 즐기는 모습'] },
  { id: 'tokyo', emoji: '🗾', name: '도쿄', scenes: ['시부야 스크램블 교차로에서 사진 찍는 모습', '메구로천 벚꽃길을 걷는 모습', '도쿄타워 야경을 배경으로 데이트하는 모습'] },
  { id: 'custom', emoji: '✏️', name: '직접 입력', scenes: [] },
];

function HoneymoonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [customDest, setCustomDest] = useState('');
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<{ url: string; scene: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <div className={styles.noSession}>
        <p>세션 정보가 없습니다.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>처음으로</button>
      </div>
    );
  }

  const destData = DESTINATIONS.find((d) => d.id === selectedDest);
  const isCustom = selectedDest === 'custom';
  const effectiveName = isCustom ? customDest : destData?.name || '';
  const effectiveScenes = isCustom
    ? [`${customDest}의 유명한 관광지에서 다정하게 사진 찍는 모습`, `${customDest}의 아름다운 풍경을 배경으로 산책하는 모습`, `${customDest}에서 로맨틱한 저녁 식사를 즐기는 모습`]
    : destData?.scenes || [];

  const canGenerate = selectedDest && (!isCustom || customDest.trim().length > 0);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setImages([]);

    try {
      // Generate 4 images with different angles for the first scene
      const scene = effectiveScenes[0] || `${effectiveName}의 아름다운 풍경`;
      for (let angle = 0; angle < 4; angle++) {
        if (angle > 0) await new Promise(r => setTimeout(r, 2000));
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              step: 'honeymoon',
              options: { destination: effectiveName, scene, angleIndex: angle },
            }),
          });

          const data = await res.json();
          if (res.ok && data.images?.length > 0) {
            setImages((prev) => [...prev, { url: data.images[0], scene }]);
          }
        } catch {
          // continue
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.content}>
      <StepIndicator currentStep={3} />

      <div className={styles.headerSection}>
        <p className="text-label">Step 5 — Virtual Honeymoon</p>
        <h1>신혼여행 갤러리</h1>
        <p className={styles.subtitle}>
          꿈꾸는 여행지를 선택하면, AI가 신혼여행 추억을 만들어 드려요.
        </p>
      </div>

      {/* Destination Grid */}
      <section className={styles.destSection}>
        <div className={styles.destGrid}>
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              className={`card ${styles.destCard} ${selectedDest === d.id ? styles.destSelected : ''}`}
              onClick={() => setSelectedDest(d.id)}
            >
              <span className={styles.destEmoji}>{d.emoji}</span>
              <span className={styles.destName}>{d.name}</span>
              <span className={styles.destScenes}>{d.scenes.length}장의 추억</span>
            </button>
          ))}
        </div>

        {/* Custom Destination Input */}
        {isCustom && (
          <div className={styles.customInput}>
            <input
              type="text"
              placeholder="원하는 여행지를 입력하세요 (예: 하와이, 프라하, 방콕...)"
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
              className={styles.customInputField}
            />
          </div>
        )}
      </section>

      <div className={styles.generateSection}>
        <button
          className="btn btn-primary btn-large"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
        >
          {generating ? '✈️ 신혼여행 추억을 만들고 있어요...' : '🌴 신혼여행 갤러리 생성'}
        </button>
        {generating && (
          <p className={styles.progressHint}>
            {images.length} / {effectiveScenes.length} 장 완료
          </p>
        )}
        {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
      </div>

      {/* Gallery */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>
            📸 {isCustom ? '✈️' : destData?.emoji} {effectiveName} 신혼여행 갤러리
          </h3>
          <div className={styles.gallery}>
            {images.map((img, i) => (
              <div key={i} className={styles.imageCard}>
                <img src={img.url} alt={img.scene} className={styles.generatedImage} />
                <div className={styles.imageCaption}>
                  <span className={styles.captionNum}>#{i + 1}</span>
                  <span>{img.scene}</span>
                </div>
              </div>
            ))}
          </div>

          {!generating && images.length >= effectiveScenes.length && (
            <div className={styles.completeSection}>
              <div className={styles.completeEmoji}>🎉</div>
              <h2 className={styles.completeTitle}>축하합니다!</h2>
              <p className={styles.completeDesc}>
                두 분의 가상 결혼 여정이 완성되었어요.
                <br />
                아름다운 추억들을 간직하세요! 💕
              </p>
              <div className={styles.completeActions}>
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => router.push(`/gallery/${sessionId}`)}
                >
                  📸 전체 앨범 보기
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedDest(null);
                    setImages([]);
                  }}
                >
                  다른 여행지로 다시 만들기
                </button>
                <button className="btn btn-secondary" onClick={() => router.push('/')}>
                  🏠 처음으로
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function HoneymoonPage() {
  return (
    <>

      <main className={styles.main}>
        <div className="container">
          <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
            <HoneymoonContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
