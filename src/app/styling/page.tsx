'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import StepIndicator from '@/components/layout/StepIndicator';
import styles from './page.module.css';

const DRESSES = [
  { id: 'a_line' as const, emoji: '👗', name: 'A라인', desc: '우아한 레이스, 흐르는 스커트' },
  { id: 'mermaid' as const, emoji: '🧜‍♀️', name: '머메이드', desc: '바디라인, 드라마틱 플레어' },
  { id: 'ball_gown' as const, emoji: '👸', name: '볼가운', desc: '풍성한 튤 스커트, 공주 스타일' },
  { id: 'mini' as const, emoji: '✨', name: '미니 드레스', desc: '모던하고 시크한 숏 드레스' },
];

const TUXEDOS = [
  { id: 'classic_black' as const, emoji: '🤵', name: '클래식 블랙', desc: '새틴 라펠, 보타이' },
  { id: 'navy' as const, emoji: '💎', name: '네이비 수트', desc: '슬림핏, 베스트 매칭' },
  { id: 'white' as const, emoji: '🤍', name: '화이트 턱시도', desc: '여름날의 우아함' },
  { id: 'slim_fit' as const, emoji: '🔥', name: '슬림핏 그레이', desc: '모던 차콜 그레이' },
];

const MAKEUPS = [
  { id: 'natural' as const, emoji: '🌿', name: '내추럴', desc: '듀이 스킨, 소프트 핑크 립' },
  { id: 'glam' as const, emoji: '💋', name: '글램', desc: '스모키 아이, 레드 립' },
  { id: 'vintage' as const, emoji: '🎞️', name: '빈티지', desc: '매트 스킨, 윙드 아이라이너' },
  { id: 'hanbok' as const, emoji: '🇰🇷', name: '한복 메이크업', desc: '전통 한국 신부 스타일' },
];

function StylingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [selectedDress, setSelectedDress] = useState<string | null>(null);
  const [selectedTuxedo, setSelectedTuxedo] = useState<string | null>(null);
  const [selectedMakeup, setSelectedMakeup] = useState<string | null>(null);
  const [generating, setGenerating] = useState<'her' | 'him' | null>(null);
  const [herImage, setHerImage] = useState<string | null>(null);
  const [himImage, setHimImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <div className={styles.noSession}>
        <p>세션 정보가 없습니다.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>처음으로</button>
      </div>
    );
  }

  const handleGenerate = async (gender: 'her' | 'him') => {
    setGenerating(gender);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          step: 'styling',
          options: {
            gender,
            dress: selectedDress,
            tuxedo: selectedTuxedo,
            makeup: selectedMakeup,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이미지 생성 실패');

      if (data.images.length > 0) {
        if (gender === 'her') setHerImage(data.images[0]);
        else setHimImage(data.images[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setGenerating(null);
    }
  };

  const bothDone = herImage && himImage;

  return (
    <div className={styles.content}>
      <StepIndicator currentStep={3} />

      <div className={styles.headerSection}>
        <p className="text-label">Step 3 — Virtual Styling</p>
        <h1>드레스 & 메이크업 시착</h1>
        <p className={styles.subtitle}>
          원하는 스타일을 선택하면, AI가 두 분에게 입혀드려요.
        </p>
      </div>

      <div className={styles.splitLayout}>
        {/* HER Section */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <span className={styles.panelIcon}>👰</span> FOR HER
          </h2>

          <div className={styles.optionGroup}>
            <h4 className={styles.optionLabel}>드레스 선택</h4>
            <div className={styles.optionGrid}>
              {DRESSES.map((d) => (
                <button
                  key={d.id}
                  className={`${styles.optionCard} ${selectedDress === d.id ? styles.selected : ''}`}
                  onClick={() => setSelectedDress(d.id)}
                >
                  <span className={styles.optionEmoji}>{d.emoji}</span>
                  <span className={styles.optionName}>{d.name}</span>
                  <span className={styles.optionDesc}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <h4 className={styles.optionLabel}>메이크업 선택</h4>
            <div className={styles.optionGrid}>
              {MAKEUPS.map((m) => (
                <button
                  key={m.id}
                  className={`${styles.optionCard} ${selectedMakeup === m.id ? styles.selected : ''}`}
                  onClick={() => setSelectedMakeup(m.id)}
                >
                  <span className={styles.optionEmoji}>{m.emoji}</span>
                  <span className={styles.optionName}>{m.name}</span>
                  <span className={styles.optionDesc}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {herImage ? (
            <div className={styles.resultCard}>
              <img src={herImage} alt="신부 스타일링" className={styles.resultImage} />
              <button className="btn btn-secondary" onClick={() => { setHerImage(null); }}>
                다시 생성
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!selectedDress || !selectedMakeup || generating !== null}
              onClick={() => handleGenerate('her')}
            >
              {generating === 'her' ? '✨ AI 스타일링 중...' : '👰 신부 스타일링 생성'}
            </button>
          )}
        </div>

        {/* HIM Section */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <span className={styles.panelIcon}>🤵</span> FOR HIM
          </h2>

          <div className={styles.optionGroup}>
            <h4 className={styles.optionLabel}>턱시도 선택</h4>
            <div className={styles.optionGrid}>
              {TUXEDOS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.optionCard} ${selectedTuxedo === t.id ? styles.selected : ''}`}
                  onClick={() => setSelectedTuxedo(t.id)}
                >
                  <span className={styles.optionEmoji}>{t.emoji}</span>
                  <span className={styles.optionName}>{t.name}</span>
                  <span className={styles.optionDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {himImage ? (
            <div className={styles.resultCard}>
              <img src={himImage} alt="신랑 스타일링" className={styles.resultImage} />
              <button className="btn btn-secondary" onClick={() => { setHimImage(null); }}>
                다시 생성
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!selectedTuxedo || generating !== null}
              onClick={() => handleGenerate('him')}
            >
              {generating === 'him' ? '✨ AI 스타일링 중...' : '🤵 신랑 스타일링 생성'}
            </button>
          )}
        </div>
      </div>

      {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

      {bothDone && (
        <div className={styles.nextSection}>
          <p className={styles.nextHint}>두 분의 스타일링이 완성되었어요! 💕</p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => router.push(`/venue?session=${sessionId}`)}
          >
            다음: 결혼식장 미리보기 →
          </button>
        </div>
      )}
    </div>
  );
}

export default function StylingPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
            <StylingContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
