'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Petals from '@/components/landing/Petals';
import styles from './page.module.css';

const JOURNEY_STEPS = [
  { emoji: '📸', title: '가상 스냅사진', desc: '둘만의 로맨틱 스냅' },
  { emoji: '👗', title: '드레스 & 메이크업', desc: '가상 스타일링 체험' },
  { emoji: '💒', title: '결혼식장 미리보기', desc: '꿈의 예식장 시뮬레이션' },
  { emoji: '✈️', title: '신혼여행', desc: '세계 명소 허니문' },
];

export default function LandingPage() {
  const router = useRouter();
  const [herFile, setHerFile] = useState<File | null>(null);
  const [himFile, setHimFile] = useState<File | null>(null);
  const [herPreview, setHerPreview] = useState<string | null>(null);
  const [himPreview, setHimPreview] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = herFile && himFile;

  const handleFile = (file: File, type: 'her' | 'him') => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 용량은 10MB 이하만 가능해요');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (type === 'her') {
        setHerFile(file);
        setHerPreview(url);
      } else {
        setHimFile(file);
        setHimPreview(url);
      }
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const uploadFile = async (file: File, type: 'her' | 'him', sessionId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (sessionId) formData.append('sessionId', sessionId);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '업로드 실패');
    return data;
  };

  const handleStart = async () => {
    if (!canStart) return;
    setIsStarting(true);
    setError(null);
    try {
      const herResult = await uploadFile(herFile, 'her');
      const sessionId = herResult.sessionId;
      await uploadFile(himFile, 'him', sessionId);
      router.push(`/snapshots?session=${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setIsStarting(false);
    }
  };

  return (
    <>
      <Header />
      <Petals />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            사진 두 장으로 만드는
            <br />
            <span className={styles.heroHighlight}>우리만의 결혼식</span>
          </h1>
          <p className={styles.heroDesc}>
            우리 둘의 사진만 올리면, 스냅부터 신혼여행까지
            <br />
            꿈같은 결혼 여정을 AI가 만들어 드려요
          </p>

          {/* 나란히 사진 업로드 */}
          <div className={styles.uploadArea}>
            <div className={styles.uploadCard}>
              <label className={styles.uploadZone} data-filled={!!herPreview}>
                {herPreview ? (
                  <img src={herPreview} alt="신부" className={styles.previewImg} />
                ) : (
                  <>
                    <span className={styles.uploadEmoji}>👰</span>
                    <span className={styles.uploadLabel}>신부</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f, 'her');
                  }}
                />
              </label>
              <span className={styles.uploadHint}>
                {herPreview ? '✓ 업로드 완료' : '10MB 이하 · JPG, PNG'}
              </span>
            </div>

            {/* 하트 디바이더 */}
            <div className={styles.heartArea}>
              <svg className={styles.heartSvg} viewBox="0 0 24 24" fill="var(--color-accent)">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            <div className={styles.uploadCard}>
              <label className={styles.uploadZone} data-filled={!!himPreview}>
                {himPreview ? (
                  <img src={himPreview} alt="신랑" className={styles.previewImg} />
                ) : (
                  <>
                    <span className={styles.uploadEmoji}>🤵</span>
                    <span className={styles.uploadLabel}>신랑</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f, 'him');
                  }}
                />
              </label>
              <span className={styles.uploadHint}>
                {himPreview ? '✓ 업로드 완료' : '10MB 이하 · JPG, PNG'}
              </span>
            </div>
          </div>

          {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

          <button
            className={`btn btn-primary btn-large ${styles.startBtn}`}
            onClick={handleStart}
            disabled={!canStart || isStarting}
          >
            {isStarting ? (
              <>
                <span className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                업로드 중...
              </>
            ) : (
              '💍 우리의 여정 시작하기'
            )}
          </button>

          {!canStart && (
            <p className={styles.startHint}>
              두 분의 사진을 모두 올리면 시작할 수 있어요
            </p>
          )}
        </div>
      </section>

      {/* 여정 안내 */}
      <section className={styles.journeySection}>
        <div className={`container ${styles.journeyInner}`}>
          <h2 className={styles.journeyTitle}>
            이런 여정이 기다리고 있어요
          </h2>

          <div className={styles.journeyFlow}>
            {JOURNEY_STEPS.map((step, i) => (
              <div key={i} className={styles.journeyStep}>
                <div className={styles.journeyIcon}>{step.emoji}</div>
                <div className={styles.journeyText}>
                  <strong>{step.title}</strong>
                  <span>{step.desc}</span>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className={styles.journeyArrow}>↓</div>
                )}
              </div>
            ))}
            {/* 최종 갤러리 */}
            <div className={`${styles.journeyStep} ${styles.journeyFinal}`}>
              <div className={styles.journeyIcon}>🖼️</div>
              <div className={styles.journeyText}>
                <strong>추억 갤러리</strong>
                <span>전체 여정을 앨범으로 다운로드</span>
              </div>
            </div>
          </div>

          {/* 100원 안내 */}
          <div className={styles.priceNotice}>
            <div className={styles.priceTag}>
              <span className={styles.priceEmoji}>☕</span>
              <div>
                <p className={styles.priceTitle}>갤러리 다운로드</p>
                <p className={styles.priceAmount}>단돈 <strong>100원</strong></p>
              </div>
            </div>
            <p className={styles.priceDesc}>
              체험은 무료! 완성된 앨범을 다운받을 때만 100원이 필요해요
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p className={styles.footerBrand}>💍 메리미</p>
          <p className={styles.footerCopy}>
            © 2026 MerryMe · AI 기반 가상 결혼 체험
          </p>
          <p className={styles.footerNote}>
            모든 이미지는 AI로 생성되며 실제 인물과 무관합니다
          </p>
        </div>
      </footer>
    </>
  );
}
