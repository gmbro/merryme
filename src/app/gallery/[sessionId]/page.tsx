'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Header from '@/components/layout/Header';
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

const STEP_INFO: Record<string, { label: string; emoji: string; title: string }> = {
  snapshot: { label: 'Step 2', emoji: '📷', title: '가상 스냅사진' },
  styling: { label: 'Step 3', emoji: '👗', title: '드레스 & 메이크업' },
  venue: { label: 'Step 4', emoji: '💒', title: '결혼식장' },
  honeymoon: { label: 'Step 5', emoji: '✈️', title: '신혼여행' },
};

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
  const [showPayment, setShowPayment] = useState(false);
  const [paid, setPaid] = useState(false);

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

      <main className={styles.main}>
        {/* Payment Modal */}
        {showPayment && (
          <div className={styles.paymentOverlay} onClick={() => setShowPayment(false)}>
            <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
              <span className={styles.paymentEmoji}>☕</span>
              <h3 className={styles.paymentTitle}>앨범 다운로드</h3>
              <p className={styles.paymentDesc}>
                완성된 앨범을 다운로드하려면<br />
                <strong>100원</strong>이 필요해요
              </p>
              <div className={styles.paymentPrice}>
                <span>₩</span>100
              </div>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setPaid(true);
                  setShowPayment(false);
                  await handleDownloadZip();
                }}
                style={{ width: '100%' }}
              >
                💳 100원 결제하고 다운로드
              </button>
              <button
                className={styles.paymentCancel}
                onClick={() => setShowPayment(false)}
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
              <button
                className="btn btn-secondary btn-small"
                onClick={handleShare}
                disabled={!hasImages}
              >
                {copied ? '✅ 복사됨' : '🔗 공유'}
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={() => paid ? handleDownloadZip() : setShowPayment(true)}
                disabled={!hasImages || downloading}
              >
                {downloading ? (
                  <>
                    <span className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    다운로드 중...
                  </>
                ) : paid ? (
                  '📦 다운로드'
                ) : (
                  '📦 다운로드 (₩100)'
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
                  <span className={styles.stepEmoji}>{info.emoji}</span>
                  <div>
                    <p className={styles.stepLabel}>{info.label}</p>
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
                        <span className={styles.imageZoom}>🔍 확대</span>
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
