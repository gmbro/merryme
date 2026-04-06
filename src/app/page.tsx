'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const JOURNEY_STEPS = [
  { icon: <IconCamera />, title: '스냅사진', desc: '' },
  { icon: <IconChurch />, title: '예식장', desc: '' },
  { icon: <IconPlane />, title: '신혼여행', desc: '' },
  { icon: <IconGallery />, title: '갤러리', desc: '' },
];

/* ─── 서버 얼굴 검증 (Gemini API) ─── */
/* ─── 이미지 압축 (413 방지) ─── */
async function compressImage(file: File, maxSize = 1200): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

async function validateFaceServer(file: File, type: 'her' | 'him'): Promise<{ valid: boolean; reason?: string; warning?: string }> {
  try {
    // 업로드 전 이미지 압축
    const compressed = await compressImage(file);
    
    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('type', type);
    const res = await fetch('/api/validate-face', { method: 'POST', body: formData });
    
    // 구체적인 에러 메시지
    if (res.status === 413) {
      return { valid: false, reason: '사진 용량이 너무 커요. 더 작은 사진을 올려주세요. (최대 4MB)' };
    }
    if (res.status === 429) {
      return { valid: false, reason: 'API 요청이 많아요. 10초 후 다시 시도해주세요.' };
    }
    if (!res.ok) {
      return { valid: false, reason: `서버 오류가 발생했어요. (${res.status}) 잠시 후 다시 시도해주세요.` };
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Failed to fetch')) {
      return { valid: false, reason: '네트워크 연결을 확인해주세요.' };
    }
    return { valid: false, reason: '사진 검증 중 오류가 발생했어요. 다시 시도해주세요.' };
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
        <div style={{ marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 12 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>💡 더 자연스럽게 만들고 싶다면?</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            '커플 전신 사진'을 선택 사항으로 올려주세요! AI가 두 사람의 키 차이, 체격 밸런스, 분위기를 파악해서 더 자연스럽게 합성합니다. (배경이 복잡해도 괜찮습니다)
          </p>
        </div>
        <ul className={styles.guideRules}>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            얼굴 단독컷은 크게 나온 사진 필수
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            선명한 조명과 화질 (10MB 이하)
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
  const [coupleFile, setCoupleFile] = useState<File | null>(null);
  const [herPreview, setHerPreview] = useState<string | null>(null);
  const [himPreview, setHimPreview] = useState<string | null>(null);
  const [couplePreview, setCouplePreview] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [validating, setValidating] = useState<'her' | 'him' | 'couple' | null>(null);
  const herInputRef = useRef<HTMLInputElement>(null);
  const himInputRef = useRef<HTMLInputElement>(null);
  const coupleInputRef = useRef<HTMLInputElement>(null);

  const canStart = herFile && himFile;

  const handleFile = async (file: File, type: 'her' | 'him' | 'couple') => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 용량은 10MB 이하만 가능해요');
      return;
    }

    // Optional: No strict validation for couple photo (background is allowed)
    if (type !== 'couple') {
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
      if (result.warning) setError(result.warning);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (type === 'her') {
        setHerFile(file);
        setHerPreview(url);
      } else if (type === 'him') {
        setHimFile(file);
        setHimPreview(url);
      } else {
        setCoupleFile(file);
        setCouplePreview(url);
      }
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const uploadFile = async (file: File, type: 'her' | 'him' | 'couple', sessionId?: string) => {
    // 업로드 전 이미지 압축 (413 방지)
    const compressed = await compressImage(file);
    
    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('type', type);
    if (sessionId) formData.append('sessionId', sessionId);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    
    if (res.status === 413) {
      throw new Error('사진 용량이 너무 커요. 더 작은 사진을 올려주세요.');
    }
    
    // 응답이 JSON인지 확인
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`서버 오류가 발생했어요. (${res.status})`);
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '업로드 실패');
    return data;
  };

  const handleStart = async () => {
    if (!canStart) return;
    setIsStarting(true);
    setError(null);
    try {
      const herResult = await uploadFile(herFile!, 'her');
      const sessionId = herResult.sessionId;
      await uploadFile(himFile!, 'him', sessionId);
      if (coupleFile) {
        await uploadFile(coupleFile, 'couple', sessionId);
      }
      router.push(`/generating?session=${sessionId}`);
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
      <Petals />
      {showGuide && <ImageGuideModal onClose={() => setShowGuide(false)} />}

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* 꽃다발 로고 + 브랜드 */}
          <div className={styles.brandMark}>
            <svg className={styles.bouquetIcon} width="36" height="36" viewBox="0 0 48 48" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="24" cy="14" r="5" fill="var(--color-accent)" opacity="0.7" />
              <circle cx="17" cy="18" r="4.5" fill="var(--color-primary-light)" opacity="0.6" />
              <circle cx="31" cy="18" r="4.5" fill="var(--color-primary-light)" opacity="0.6" />
              <circle cx="20" cy="11" r="4" fill="var(--color-primary)" opacity="0.5" />
              <circle cx="28" cy="11" r="4" fill="var(--color-primary)" opacity="0.5" />
              <path d="M22 22 L24 40 L26 22" stroke="var(--color-success)" strokeWidth="2" fill="none" />
              <path d="M20 24 L24 38" stroke="var(--color-success)" strokeWidth="1.5" fill="none" opacity="0.6" />
              <path d="M28 24 L24 38" stroke="var(--color-success)" strokeWidth="1.5" fill="none" opacity="0.6" />
              <path d="M18 26c-2 2-3 0-2-2" stroke="var(--color-success)" strokeWidth="1.2" fill="none" />
              <path d="M30 26c2 2 3 0 2-2" stroke="var(--color-success)" strokeWidth="1.2" fill="none" />
            </svg>
            <span className={styles.brandText}>메리미</span>
          </div>

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
                </div>
                {i < JOURNEY_STEPS.length - 1 && <div className={styles.journeyStepLine} />}
              </div>
            ))}
          </div>

          {/* 사진 업로드 — 3장 나란히 */}
          <div className={styles.uploadArea}>

            {/* 신부 얼굴 */}
            <div className={styles.uploadCard}>
              <label className={styles.uploadZone} data-filled={!!herPreview}>
                {herPreview ? (
                  <img src={herPreview} alt="신부" className={styles.previewImg} />
                ) : (
                  <img src="/guide-bride.png" alt="가이드" className={styles.guideImg} />
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
                    확인 중...
                  </span>
                ) : herPreview ? (
                  <span className={styles.uploadDone}>✓ 완료</span>
                ) : (
                  '신부 얼굴'
                )}
              </span>
            </div>

            {/* 커플 전신 (가운데, 세로형) */}
            <div className={styles.uploadCardCouple}>
              <label className={styles.uploadZoneRect} data-filled={!!couplePreview}>
                {couplePreview ? (
                  <img src={couplePreview} alt="커플 전신" className={styles.previewImgRect} />
                ) : (
                  <img src="/guide-couple.png" alt="커플 체형 가이드" className={styles.guideImgRect} />
                )}
                <input
                  ref={coupleInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f, 'couple');
                  }}
                />
              </label>
              <span className={styles.uploadLabelText}>
                {validating === 'couple' ? (
                  <span className={styles.uploadValidating}>등록 중...</span>
                ) : couplePreview ? (
                  <span className={styles.uploadDone}>✓ 완료</span>
                ) : (
                  <span>커플 전신 <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>선택</span></span>
                )}
              </span>
            </div>

            {/* 신랑 얼굴 */}
            <div className={styles.uploadCard}>
              <label className={styles.uploadZone} data-filled={!!himPreview}>
                {himPreview ? (
                  <img src={himPreview} alt="신랑" className={styles.previewImg} />
                ) : (
                  <img src="/guide-groom.png" alt="가이드" className={styles.guideImg} />
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
                    확인 중...
                  </span>
                ) : himPreview ? (
                  <span className={styles.uploadDone}>✓ 완료</span>
                ) : (
                  '신랑 얼굴'
                )}
              </span>
            </div>

          </div>

          {/* 이미지 가이드 버튼 */}
          <button className={styles.guideBtn} onClick={() => setShowGuide(true)} style={{ marginTop: '2rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            사진 가이드 보기
          </button>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={`btn btn-primary btn-large ${styles.startBtn}`}
            onClick={handleStart}
            disabled={!canStart || isStarting}
            style={canStart ? { background: 'linear-gradient(135deg, #E91E63, #C2185B)', boxShadow: '0 4px 20px rgba(233,30,99,0.35)' } : {}}
          >
            {isStarting ? (
              <>
                <span className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                업로드 중...
              </>
            ) : canStart ? (
              '스냅사진 찍으러 가기'
            ) : (
              '우리의 여정 시작하기'
            )}
          </button>

        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <p className={styles.footerCompany}>(주)아키랩 · 개인정보보호 책임자 이경민</p>
          <p className={styles.footerCopy}>
            &copy; 2026 MerryMe · AI 기반 가상 결혼 체험
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
