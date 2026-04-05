'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import StepIndicator from '@/components/layout/StepIndicator';
import styles from './page.module.css';

const THEMES = [
  { id: 'cherry_blossom' as const, emoji: '🌸', name: '봄날의 벚꽃', desc: '만개한 벚꽃 아래에서' },
  { id: 'beach_sunset' as const, emoji: '🏖️', name: '해변 선셋', desc: '석양이 지는 해변에서' },
  { id: 'classic_studio' as const, emoji: '🏛️', name: '클래식 스튜디오', desc: '부드러운 스튜디오 조명' },
  { id: 'forest_garden' as const, emoji: '🌿', name: '숲속 가든', desc: '초록 자연 속에서' },
  { id: 'city_night' as const, emoji: '🌙', name: '도심 야경', desc: '시네마틱 도시 야경' },
];

function SnapshotsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <div className={styles.noSession}>
        <p>세션 정보가 없습니다.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          처음으로 돌아가기
        </button>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!selectedTheme) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          step: 'snapshot',
          options: { theme: selectedTheme },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 이미지 생성 실패');

      setImages((prev) => [...prev, ...data.images]);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.content}>
      <StepIndicator currentStep={2} />

      <div className={styles.headerSection}>
        <p className="text-label">Step 2 — Virtual Snapshots</p>
        <h1>가상 스냅사진 생성</h1>
        <p className={styles.subtitle}>
          원하는 테마를 선택하면, AI가 두 분의 프리웨딩 스냅사진을 만들어 드려요.
        </p>
      </div>

      {/* Theme Selection */}
      <section className={styles.themeSection}>
        <h3 className={styles.sectionTitle}>📷 테마 선택</h3>
        <div className={styles.themeGrid}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className={`card ${styles.themeCard} ${selectedTheme === theme.id ? styles.themeSelected : ''}`}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <span className={styles.themeEmoji}>{theme.emoji}</span>
              <span className={styles.themeName}>{theme.name}</span>
              <span className={styles.themeDesc}>{theme.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Generate Button */}
      <div className={styles.generateSection}>
        <button
          className="btn btn-primary btn-large"
          onClick={handleGenerate}
          disabled={!selectedTheme || generating}
        >
          {generating ? (
            <>
              <span className="loader-ring" style={{ width: 20, height: 20, borderWidth: 2 }} />
              AI가 이미지를 생성하고 있어요...
            </>
          ) : (
            '✨ 스냅사진 생성하기'
          )}
        </button>
        {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
      </div>

      {/* Generated Images */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>🖼️ 생성된 스냅사진</h3>
          <div className={styles.gallery}>
            {images.map((url, i) => (
              <div key={i} className={styles.imageCard}>
                <img src={url} alt={`스냅사진 ${i + 1}`} className={styles.generatedImage} />
              </div>
            ))}
          </div>

          <div className={styles.nextSection}>
            <p className={styles.nextHint}>마음에 드는 사진이 있으신가요?</p>
            <button
              className="btn btn-primary btn-large"
              onClick={() => router.push(`/styling?session=${sessionId}`)}
            >
              다음: 드레스 & 메이크업 →
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedTheme(null);
                setImages([]);
              }}
            >
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
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
            <SnapshotsContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
