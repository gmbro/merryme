'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Petals from '@/components/landing/Petals';
import styles from './page.module.css';

/* ─── SVG 픽토그램 ─── */
const IconBride = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="16" r="8" />
    <path d="M12 40c0-6.627 5.373-12 12-12s12 5.373 12 12" />
    <path d="M18 8c0-4 6-6 6-6s6 2 6 6" strokeWidth="1.2" />
    <path d="M15 12l-3-4M33 12l3-4" strokeWidth="1" />
  </svg>
);

const IconGroom = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="16" r="8" />
    <path d="M12 40c0-6.627 5.373-12 12-12s12 5.373 12 12" />
    <path d="M20 10h8v3l-4 2-4-2V10z" fill="var(--color-primary-light)" strokeWidth="1" />
    <path d="M22 3h4v7h-4z" fill="var(--color-primary-light)" stroke="none" />
  </svg>
);

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconDress = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l-3 6h6l-3-6z" />
    <path d="M9 8l-4 14h14L15 8" />
    <path d="M12 8v14" />
  </svg>
);

const IconChurch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M10 4h4" />
    <path d="M6 22V10l6-4 6 4v12" />
    <rect x="10" y="16" width="4" height="6" />
    <path d="M6 10L2 22h20L18 10" />
  </svg>
);

const IconPlane = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const IconGallery = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const JOURNEY_STEPS = [
  { icon: <IconCamera />, title: '스냅사진', desc: '테마별 웨딩 스냅' },
  { icon: <IconDress />, title: '스타일링', desc: '드레스 & 메이크업' },
  { icon: <IconChurch />, title: '예식장', desc: '결혼식장 시뮬레이션' },
  { icon: <IconPlane />, title: '신혼여행', desc: '꿈의 여행지' },
  { icon: <IconGallery />, title: '갤러리', desc: '모든 사진 모아보기' },
];

/* ─── 서버 얼굴 검증 (Gemini API) ─── */
async function validateFaceServer(file: File, type: 'her' | 'him'): Promise<{ valid: boolean; reason?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/validate-face', { method: 'POST', body: formData });
    if (!res.ok) return { valid: true }; // 서버 오류 시 허용
    return await res.json();
  } catch {
    return { valid: true }; // 네트워크 오류 시 허용
  }
}

/* ─── Image Guide 모달 ─── */
function ImageGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.guideOverlay} onClick={onClose}>
      <div className={styles.guideModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.guideClose} onClick={onClose}>✕</button>
        <h3 className={styles.guideTitle}>사진 업로드 가이드</h3>
        <div className={styles.guideGrid}>
          <div className={styles.guideItem}>
            <div className={`${styles.guideExample} ${styles.guideGood}`}>
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="var(--color-success)" strokeWidth="1.5">
                <circle cx="24" cy="18" r="8" />
                <path d="M14 42c0-5.523 4.477-10 10-10s10 4.477 10 10" />
              </svg>
            </div>
            <span className={styles.guideGoodLabel}>✓ 좋은 예</span>
            <p>정면 또는 반측면의<br />단독 인물 사진</p>
          </div>
          <div className={styles.guideItem}>
            <div className={`${styles.guideExample} ${styles.guideBad}`}>
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="var(--color-error)" strokeWidth="1.5">
                <circle cx="16" cy="18" r="6" />
                <circle cx="32" cy="18" r="6" />
                <path d="M8 42c0-4.418 3.582-8 8-8s8 4.418 8 8M24 42c0-4.418 3.582-8 8-8s8 4.418 8 8" />
              </svg>
            </div>
            <span className={styles.guideBadLabel}>✕ 안되는 예</span>
            <p>여러 명이 함께<br />찍은 단체 사진</p>
          </div>
        </div>
        <ul className={styles.guideRules}>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            얼굴이 잘 보이는 사진
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            상반신 이상이 포함된 사진
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            밝고 선명한 조명의 사진
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            10MB 이하 · JPG, PNG 형식
          </li>
        </ul>
        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', marginTop: 16 }}>
          확인했어요
        </button>
      </div>
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */
export default function LandingPage() {
  const router = useRouter();
  const [herFile, setHerFile] = useState<File | null>(null);
  const [himFile, setHimFile] = useState<File | null>(null);
  const [herPreview, setHerPreview] = useState<string | null>(null);
  const [himPreview, setHimPreview] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [validating, setValidating] = useState<'her' | 'him' | null>(null);
  const herInputRef = useRef<HTMLInputElement>(null);
  const himInputRef = useRef<HTMLInputElement>(null);

  const canStart = herFile && himFile;

  const handleFile = async (file: File, type: 'her' | 'him') => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 용량은 10MB 이하만 가능해요');
      return;
    }

    // 얼굴/체형 검증 (Gemini API - 서버 사이드)
    setValidating(type);
    setError(null);
    const result = await validateFaceServer(file, type);
    setValidating(null);
    if (!result.valid) {
      setError(result.reason || '적합한 사진이 아니에요.');
      if (type === 'her' && herInputRef.current) herInputRef.current.value = '';
      if (type === 'him' && himInputRef.current) himInputRef.current.value = '';
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
      let msg = '오류가 발생했습니다';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        msg = '서버에 연결할 수 없어요. 인터넷 연결을 확인해주세요.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setIsStarting(false);
    }
  };

  return (
    <>
      <Header />
      <Petals />
      {showGuide && <ImageGuideModal onClose={() => setShowGuide(false)} />}

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* 타이틀 */}
          <h1 className={styles.heroTitle}>
            사진 두 장으로 만드는
            <br />
            <span className={styles.heroHighlight}>우리만의 결혼식</span>
          </h1>
          <p className={styles.heroDesc}>
            사진만 올리면, 스냅부터 신혼여행까지
            <br />
            AI가 꿈같은 결혼 여정을 만들어 드려요
          </p>

          {/* 여정 타임라인 */}
          <div className={styles.journeyTimeline}>
            {JOURNEY_STEPS.map((step, i) => (
              <div key={i} className={styles.journeyStep}>
                <div className={styles.journeyStepNum}>{i + 1}</div>
                <div className={styles.journeyStepIcon}>{step.icon}</div>
                <div className={styles.journeyStepInfo}>
                  <span className={styles.journeyStepTitle}>{step.title}</span>
                  <span className={styles.journeyStepDesc}>{step.desc}</span>
                </div>
                {i < JOURNEY_STEPS.length - 1 && <div className={styles.journeyStepLine} />}
              </div>
            ))}
          </div>

          {/* 사진 업로드 */}
          <div className={styles.uploadArea}>
            <div className={styles.uploadCard}>
              <label className={styles.uploadZone} data-filled={!!herPreview}>
                {herPreview ? (
                  <img src={herPreview} alt="신부" className={styles.previewImg} />
                ) : (
                  <IconBride />
                )}
                <input
                  ref={herInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f, 'her');
                  }}
                />
              </label>
              <span className={styles.uploadLabelText}>
                {validating === 'her' ? (
                  <span className={styles.uploadValidating}>
                    <span className="loader-ring" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    사진 확인 중...
                  </span>
                ) : herPreview ? (
                  <span className={styles.uploadDone}>업로드 완료</span>
                ) : (
                  '신부 사진을 업로드해주세요'
                )}
              </span>
            </div>

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
                  <IconGroom />
                )}
                <input
                  ref={himInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f, 'him');
                  }}
                />
              </label>
              <span className={styles.uploadLabelText}>
                {validating === 'him' ? (
                  <span className={styles.uploadValidating}>
                    <span className="loader-ring" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    사진 확인 중...
                  </span>
                ) : himPreview ? (
                  <span className={styles.uploadDone}>업로드 완료</span>
                ) : (
                  '신랑 사진을 업로드해주세요'
                )}
              </span>
            </div>
          </div>

          {/* 이미지 가이드 버튼 */}
          <button className={styles.guideBtn} onClick={() => setShowGuide(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            어떤 사진을 올려야 하나요?
          </button>

          {error && <p className={styles.errorMsg}>{error}</p>}

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
              '우리의 여정 시작하기'
            )}
          </button>

        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <p className={styles.footerBrand}>메리미</p>
          <p className={styles.footerCompany}>(주)아키랩 · 대표이사 이경민</p>
          <p className={styles.footerCopy}>
            &copy; 2026 MerryMe · AI 기반 가상 결혼 체험
          </p>
          <p className={styles.footerNote}>
            모든 이미지는 AI로 생성되며 실제 인물과 무관합니다
          </p>
          <div className={styles.footerLinks}>
            <a href="/privacy" className={styles.footerLink}>개인정보처리방침</a>
            <span className={styles.footerDivider}>·</span>
            <a href="/terms" className={styles.footerLink}>이용약관</a>
          </div>
        </div>
      </footer>
    </>
  );
}
