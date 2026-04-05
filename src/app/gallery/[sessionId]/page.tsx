'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

interface GalleryImage {
  url: string;
  name: string;
}

interface GalleryData {
  sessionId: string;
  referencePhotos: { her?: string; him?: string };
  images: {
    snapshot: GalleryImage[];
    styling: GalleryImage[];
    venue: GalleryImage[];
    honeymoon: GalleryImage[];
  };
  totalCount: number;
}

const STEP_INFO: Record<string, { title: string }> = {
  snapshot: { title: '가상 스냅사진' },
  styling: { title: '드레스 & 메이크업' },
  venue: { title: '결혼식장' },
  honeymoon: { title: '신혼여행' },
};

/* ─── Cinematic Slideshow ─── */
function CinematicSlideshow({
  allImages,
  onClose,
}: {
  allImages: { url: string; step: string; index: number }[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => {
        if (prev >= allImages.length - 1) {
          setIsPaused(true);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, allImages.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((p) => Math.min(p + 1, allImages.length - 1));
      if (e.key === 'ArrowLeft') setCurrent((p) => Math.max(p - 1, 0));
      if (e.key === ' ') { e.preventDefault(); setIsPaused((p) => !p); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, allImages.length]);

  const img = allImages[current];
  if (!img) return null;
  const stepInfo = STEP_INFO[img.step];
  const progress = ((current + 1) / allImages.length) * 100;

  return (
    <div className={styles.slideshowOverlay}>
      {/* Background image with Ken Burns */}
      <div className={styles.slideshowBg} key={current}>
        <img src={img.url} alt="" className={styles.slideshowBgImg} />
      </div>

      {/* Content */}
      <div className={styles.slideshowContent}>
        <div className={styles.slideshowTop}>
          <span className={styles.slideshowStep}>{stepInfo?.title}</span>
          <button className={styles.slideshowClose} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.slideshowCenter} onClick={() => setIsPaused(!isPaused)}>
          {isPaused && current >= allImages.length - 1 && (
            <div className={styles.slideshowEnd}>
              <p>우리의 아름다운 여정</p>
              <button className="btn btn-glass" onClick={(e) => { e.stopPropagation(); setCurrent(0); setIsPaused(false); }}>
                처음부터 다시 보기
              </button>
            </div>
          )}
        </div>

        <div className={styles.slideshowBottom}>
          <div className={styles.slideshowProgress}>
            <div className={styles.slideshowProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.slideshowControls}>
            <button onClick={() => setCurrent((p) => Math.max(p - 1, 0))} className={styles.slideshowBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button onClick={() => setIsPaused(!isPaused)} className={styles.slideshowBtn}>
              {isPaused ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              )}
            </button>
            <button onClick={() => setCurrent((p) => Math.min(p + 1, allImages.length - 1))} className={styles.slideshowBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
            <span className={styles.slideshowCounter}>{current + 1} / {allImages.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <img src={src} alt={alt} className={styles.modalImage} />
        <div className={styles.modalActions}>
          <a
            href={src}
            download
            className="btn btn-primary btn-small"
            target="_blank"
            rel="noopener noreferrer"
          >
            📥 다운로드
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch(`/api/gallery/${sessionId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '갤러리 로드 실패');
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류 발생');
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, [sessionId]);

  const handleDownloadZip = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/gallery/${sessionId}/download`);
      if (!res.ok) throw new Error('다운로드 실패');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MerryMe_Album_${sessionId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('ZIP 다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDownloading(false);
    }
  }, [sessionId]);

  const handleShare = useCallback(async () => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setShareUrl(json.shareUrl);

      // Copy to clipboard
      await navigator.clipboard.writeText(json.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Share error:', err);
      // Fallback: copy current URL
      await navigator.clipboard.writeText(window.location.href);
      setShareUrl(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <span className="loader-ring" />
            <p className={styles.loadingText}>앨범을 불러오고 있어요...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <span className={styles.errorEmoji}>😢</span>
            <h2>갤러리를 찾을 수 없습니다</h2>
            <p>{error || '해당 세션의 갤러리가 존재하지 않습니다.'}</p>
            <a href="/" className="btn btn-primary">
              홈으로 돌아가기
            </a>
          </div>
        </main>
      </>
    );
  }

  const steps = ['snapshot', 'styling', 'venue', 'honeymoon'] as const;
  const hasImages = data.totalCount > 0;

  return (
    <>
      <Header />
      {modalImage && (
        <ImageModal src={modalImage.src} alt={modalImage.alt} onClose={() => setModalImage(null)} />
      )}

      {/* Cinematic Slideshow */}
      {showSlideshow && hasImages && data && (() => {
        const allSlideImages: { url: string; step: string; index: number }[] = [];
        (['snapshot', 'styling', 'venue', 'honeymoon'] as const).forEach((step) => {
          const imgs = data.images[step];
          if (imgs) imgs.forEach((img, i) => allSlideImages.push({ url: img.url, step, index: i }));
        });
        return <CinematicSlideshow allImages={allSlideImages} onClose={() => setShowSlideshow(false)} />;
      })()}

      <main className={styles.main}>
        {/* Login Modal */}
        {showLoginModal && (
          <div className={styles.paymentOverlay} onClick={() => setShowLoginModal(false)}>
            <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <h3 className={styles.paymentTitle}>앨범 다운로드</h3>
              <p className={styles.paymentDesc}>
                완성된 앨범을 다운로드하려면<br />
                구글 로그인이 필요해요
              </p>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setShowLoginModal(false);
                  await signInWithGoogle();
                }}
                style={{ width: '100%' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 로그인
              </button>
              <button
                className={styles.paymentCancel}
                onClick={() => setShowLoginModal(false)}
              >
                다음에 할게요
              </button>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>추억 갤러리</p>
            <h1 className={styles.heroTitle}>
              우리의 특별한
              <br />
              <span className="text-display">가상 웨딩 앨범</span>
            </h1>
            <p className={styles.heroStats}>
              💍 총 {data.totalCount}장의 추억
            </p>
          </div>
        </section>

        <div className="container">
          {/* Action Bar */}
          <div className={styles.actionBar}>
            <div className={styles.actionLeft}>
              <h2 className={styles.albumTitle}>💐 웨딩 앨범</h2>
            </div>
            <div className={styles.actionRight}>
              {hasImages && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowSlideshow(true)}
                >
                  슬라이드쇼
                </button>
              )}
              <button
                className="btn btn-secondary btn-small"
                onClick={handleShare}
                disabled={!hasImages}
              >
                {copied ? '✅ 복사됨' : '🔗 공유'}
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={() => user ? handleDownloadZip() : setShowLoginModal(true)}
                disabled={!hasImages || downloading}
              >
                {downloading ? (
                  <>
                    <span className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    다운로드 중...
                  </>
                ) : user ? (
                  '다운로드'
                ) : (
                  '다운로드 (로그인 필요)'
                )}
              </button>
            </div>
          </div>

          {shareUrl && (
            <div className={styles.shareNotice}>
              <p>
                📋 공유 링크: <code>{shareUrl}</code>
              </p>
            </div>
          )}

          {/* Reference Photos */}
          {(data.referencePhotos.her || data.referencePhotos.him) && (
            <section className={styles.refSection}>
              <h3 className={styles.sectionLabel}>👫 원본 사진</h3>
              <div className={styles.refGrid}>
                {data.referencePhotos.her && (
                  <div className={styles.refCard}>
                    <img src={data.referencePhotos.her} alt="신부 원본" />
                    <span className={styles.refTag}>신부</span>
                  </div>
                )}
                {data.referencePhotos.him && (
                  <div className={styles.refCard}>
                    <img src={data.referencePhotos.him} alt="신랑 원본" />
                    <span className={styles.refTag}>신랑</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Image Sections */}
          {!hasImages && (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji}>🖼️</span>
              <h3>아직 생성된 이미지가 없어요</h3>
              <p>가상 웨딩 여행을 시작해서 추억을 만들어보세요!</p>
              <a href="/" className="btn btn-primary">
                시작하기
              </a>
            </div>
          )}

          {steps.map((step) => {
            const imgs = data.images[step];
            if (!imgs || imgs.length === 0) return null;
            const info = STEP_INFO[step];

            return (
              <section key={step} className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <div>
                    <h3 className={styles.stepTitle}>{info.title}</h3>
                  </div>
                  <span className={styles.stepCount}>{imgs.length}장</span>
                </div>

                <div className={styles.imageGrid}>
                  {imgs.map((img, i) => (
                    <div
                      key={img.name}
                      className={styles.imageCard}
                      onClick={() => setModalImage({ src: img.url, alt: `${info.title} ${i + 1}` })}
                    >
                      <img src={img.url} alt={`${info.title} ${i + 1}`} loading="lazy" />
                      <div className={styles.imageOverlay}>
                        <span className={styles.imageIndex}>#{i + 1}</span>
                        <span className={styles.imageZoom}>확대</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Back to start */}
          {hasImages && (
            <div className={styles.bottomCta}>
              <p className={styles.ctaText}>✨ 새로운 가상 웨딩을 시작해보세요</p>
              <a href="/" className="btn btn-primary btn-large">
                🏠 처음으로
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>© 2026 MerryMe. AI 기반 가상 결혼 & 신혼여행 체험 플랫폼.</p>
          <p className={styles.footerNote}>
            모든 이미지는 AI(NanoBanana2)로 생성되며, 실제 인물과 무관합니다.
          </p>
        </div>
      </footer>
    </>
  );
}
