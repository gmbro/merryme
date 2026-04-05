'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StepIndicator from '@/components/layout/StepIndicator';
import styles from './page.module.css';

/* ─── Theme Preview Images (Unsplash) ─── */
const THEMES = [
  {
    id: 'cherry_blossom' as const,
    name: '봄날의 벚꽃',
    desc: '만개한 벚꽃 아래에서',
    preview: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=400&h=300&fit=crop',
  },
  {
    id: 'beach_sunset' as const,
    name: '해변 선셋',
    desc: '석양이 지는 해변에서',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 'classic_studio' as const,
    name: '클래식 스튜디오',
    desc: '부드러운 스튜디오 조명',
    preview: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
  },
  {
    id: 'forest_garden' as const,
    name: '숲속 가든',
    desc: '초록 자연 속에서',
    preview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
  },
  {
    id: 'city_night' as const,
    name: '도심 야경',
    desc: '시네마틱 도시 야경',
    preview: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&h=300&fit=crop',
  },
  {
    id: 'autumn_park' as const,
    name: '가을 단풍',
    desc: '붉은 단풍 공원에서',
    preview: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&h=300&fit=crop',
  },
  {
    id: 'snowy_winter' as const,
    name: '겨울 눈꽃',
    desc: '로맨틱한 눈 속에서',
    preview: 'https://images.unsplash.com/photo-1457269449834-928af64c684d?w=400&h=300&fit=crop',
  },
  {
    id: 'lavender_field' as const,
    name: '라벤더 밭',
    desc: '보라빛 꽃밭에서',
    preview: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=400&h=300&fit=crop',
  },
  {
    id: 'rooftop_garden' as const,
    name: '루프탑 가든',
    desc: '도심 속 루프탑에서',
    preview: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop',
  },
  {
    id: 'hanok_traditional' as const,
    name: '전통 한옥',
    desc: '고즈넉한 한옥에서',
    preview: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&h=300&fit=crop',
  },
];

const MAX_SELECT = 2;

/* ─── SVG Pictograms ─── */
const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconImage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

function SnapshotsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) => {
      if (prev.includes(themeId)) return prev.filter((t) => t !== themeId);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, themeId];
    });
  };

  const handleGenerate = async () => {
    if (selectedThemes.length === 0) return;
    setGenerating(true);
    setError(null);
    setProgress(0);

    const newImages: string[] = [];
    const total = selectedThemes.length;

    for (let i = 0; i < total; i++) {
      setProgress(Math.round(((i) / total) * 100));
      
      // Delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(r => setTimeout(r, 3000));
      }
      
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            step: 'snapshot',
            options: { theme: selectedThemes[i] },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error(`Theme ${selectedThemes[i]} error:`, data);
          // Show specific error to user
          if (data.error) {
            setError(data.error);
          }
          continue; // skip failed, continue with others
        }

        if (data.images && data.images.length > 0) {
          newImages.push(...data.images);
          setImages((prev) => [...prev, ...data.images]);
        } else if (data.error) {
          console.error(`Theme ${selectedThemes[i]}: ${data.error}`);
          setError(data.error);
        }
      } catch (err) {
        console.error(`Generate error for theme ${selectedThemes[i]}:`, err);
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError('서버에 연결할 수 없어요. 인터넷 연결을 확인해주세요.');
        }
      }
    }

    setProgress(100);

    if (newImages.length === 0 && !error) {
      setError('이미지 생성에 실패했어요. 다른 테마로 다시 시도해주세요.');
    } else if (newImages.length > 0 && newImages.length < total) {
      setError(`${newImages.length}/${total}장만 생성되었어요. 일부 테마에서 오류가 있었습니다.`);
    }
    setGenerating(false);
  };

  return (
    <div className={styles.content}>
      <StepIndicator currentStep={2} />

      <div className={styles.headerSection}>
        <h1>가상 스냅사진 생성</h1>
        <p className={styles.subtitle}>
          원하는 테마를 선택하면, AI가 두 분의 스냅사진을 만들어 드려요
        </p>
      </div>

      {/* Theme Selection with Preview Images */}
      <section className={styles.themeSection}>
        <h3 className={styles.sectionTitle}>
          <IconCamera /> 테마 선택 <span className={styles.countBadge}>{selectedThemes.length}/{MAX_SELECT}</span>
        </h3>
        <div className={styles.themeGrid}>
          {THEMES.map((theme) => {
            const isSelected = selectedThemes.includes(theme.id);
            return (
              <button
                key={theme.id}
                className={`${styles.themeCard} ${isSelected ? styles.themeSelected : ''}`}
                onClick={() => toggleTheme(theme.id)}
              >
                <div className={styles.themePreview}>
                  <img src={theme.preview} alt={theme.name} className={styles.themePreviewImg} />
                  {isSelected && (
                    <div className={styles.selectedBadge}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className={styles.themeName}>{theme.name}</span>
                <span className={styles.themeDesc}>{theme.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Generate Button */}
      <div className={styles.generateSection}>
        <button
          className="btn btn-primary btn-large"
          onClick={handleGenerate}
          disabled={selectedThemes.length === 0 || generating}
          style={{ width: '100%', maxWidth: 360 }}
        >
          {generating ? (
            <>
              <span className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
              생성 중... {progress}%
            </>
          ) : (
            `스냅사진 생성하기 (${selectedThemes.length}장)`
          )}
        </button>
        {generating && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      {/* Generated Images */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>
            <IconImage /> 생성된 스냅사진 <span className={styles.countBadge}>{images.length}장</span>
          </h3>
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
              style={{ width: '100%', maxWidth: 360 }}
            >
              다음: 드레스 & 메이크업
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedThemes([]);
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
    <main className={styles.main}>
      <div className="container">
        <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
          <SnapshotsContent />
        </Suspense>
      </div>
    </main>
  );
}
