'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Petals from '@/components/landing/Petals';
import PhotoUpload from '@/components/landing/PhotoUpload';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import PricingSection from '@/components/landing/PricingSection';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const [herFile, setHerFile] = useState<File | null>(null);
  const [himFile, setHimFile] = useState<File | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = herFile && himFile;

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
      // Upload HER photo first, get sessionId
      const herResult = await uploadFile(herFile, 'her');
      const sessionId = herResult.sessionId;

      // Upload HIM photo with same sessionId
      await uploadFile(himFile, 'him', sessionId);

      // Navigate to snapshots page
      router.push(`/snapshots?session=${sessionId}`);
    } catch (err) {
      console.error('Start error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다. 다시 시도해주세요.');
      setIsStarting(false);
    }
  };

  return (
    <>
      <Header />
      <Petals />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <p className={`text-label ${styles.heroLabel}`}>
              Virtual Wedding Experience
            </p>
            <h1 className={styles.heroTitle}>
              상상 속의 우리 결혼식,
              <br />
              <span className="text-display">미리 만나보세요.</span>
            </h1>
            <p className={styles.heroDesc}>
              AI가 만들어 주는 가상의 웨딩 스냅, 드레스 시착,
              <br className={styles.brDesktop} />
              결혼식장 미리보기, 그리고 꿈같은 신혼여행까지.
              <br className={styles.brDesktop} />
              사진 한 장이면 충분합니다.
            </p>
          </div>

          {/* Upload Area */}
          <div id="start" className={styles.uploadSection}>
            <div className={styles.uploadRow}>
              <PhotoUpload
                label="FOR HER"
                sublabel="신부 사진을 올려주세요"
                onFileSelect={setHerFile}
              />

              <div className={styles.heartDivider}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              <PhotoUpload
                label="FOR HIM"
                sublabel="신랑 사진을 올려주세요"
                onFileSelect={setHimFile}
              />
            </div>

            {error && (
              <p className={styles.errorMsg}>⚠️ {error}</p>
            )}

            <button
              className={`btn btn-primary btn-large ${styles.startBtn}`}
              onClick={handleStart}
              disabled={!canStart || isStarting}
            >
              {isStarting ? (
                <>
                  <span className="loader-ring" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  사진 업로드 중...
                </>
              ) : (
                '✨ 가상 여행 시작하기'
              )}
            </button>

            {!canStart && (
              <p className={styles.uploadHint}>
                두 분의 사진을 모두 업로드하면 시작할 수 있어요
              </p>
            )}
          </div>
        </div>

        {/* Decorative Wave */}
        <div className={styles.wave}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              fill="#ffffff"
              d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,64C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Features */}
      <FeatureShowcase />

      {/* Pricing */}
      <PricingSection />

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <span style={{ fontSize: '1.3rem' }}>💍</span>
              <span className={styles.footerLogo}>MerryMe</span>
            </div>
            <p className={styles.footerCopy}>
              © 2026 MerryMe. AI 기반 가상 결혼 & 신혼여행 체험 플랫폼.
            </p>
            <p className={styles.footerNote}>
              모든 이미지는 AI(NanoBanana2)로 생성되며, 실제 인물과 무관합니다.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
