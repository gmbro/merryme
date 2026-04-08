'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';

import Footer from '@/components/layout/Footer';
import ReviewModal from '@/components/gallery/ReviewModal';
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

const STEP_TITLES: Record<string, string> = {
  snapshot: '스냅사진',
  venue: '결혼식장',
  honeymoon: '신혼여행',
};

/* ─── Gallery Page ─── */
export default function GalleryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  
  // Veo States
  const [reviewImgUrl, setReviewImgUrl] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [completedVideos, setCompletedVideos] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

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

  const handleVeoClick = useCallback((imgUrl: string) => {
    setReviewImgUrl(imgUrl);
  }, []);

  const handleReviewSuccess = useCallback((imgUrl: string) => {
    setReviewImgUrl(null);
    setGeneratingImages(prev => { const n = new Set(prev); n.add(imgUrl); return n; });

    fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, imageUrl: imgUrl })
    })
    .then(async (res) => {
      const result = await res.json();
      if (res.ok && result.success) {
        showToast('🎬 비디오 생성을 시작했습니다! 완성되면 알려드릴게요.');
        setTimeout(() => {
          setGeneratingImages(prev => { const n = new Set(prev); n.delete(imgUrl); return n; });
          setCompletedVideos(prev => ({ ...prev, [imgUrl]: imgUrl })); 
          showToast('✨ 영상이 성공적으로 생성되었습니다!');
        }, 60000); 
      } else {
        throw new Error(result.error || '영상 생성 요청 실패');
      }
    })
    .catch(err => {
      console.error(err);
      setGeneratingImages(prev => { const n = new Set(prev); n.delete(imgUrl); return n; });
      showToast('⚠️ 영상 생성 중 문제가 발생하였습니다.');
    });
  }, [sessionId]);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loadingContainer}>
          <span className="loader-ring" />
          <p className={styles.loadingText}>앨범을 불러오고 있어요...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.main}>
        <div className={styles.errorContainer}>
          <h2>갤러리를 찾을 수 없습니다</h2>
          <p>{error || '해당 세션의 갤러리가 존재하지 않습니다.'}</p>
          <a href="/" className="btn btn-primary">홈으로 돌아가기</a>
        </div>
      </main>
    );
  }

  const steps = ['snapshot', 'venue', 'honeymoon'] as const;
  const hasImages = data.totalCount > 0;

  return (
    <>


      {zoomImg && (
        <div className={styles.zoomOverlay} onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="확대" className={styles.zoomImage} />
          <button className={styles.zoomClose} onClick={() => setZoomImg(null)}>✕</button>
        </div>
      )}

      {/* Login Modal removed */}

      {/* Review Modal for Veo Generation */}
      {reviewImgUrl && (
        <ReviewModal 
          sessionId={sessionId}
          onSuccess={() => handleReviewSuccess(reviewImgUrl)}
          onClose={() => setReviewImgUrl(null)}
        />
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '14px 28px',
          borderRadius: '30px', zIndex: 1000, fontWeight: 500, fontSize: '0.95rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', transition: 'all 0.3s ease',
          textAlign: 'center', minWidth: '300px'
        }}>
          {toastMessage}
        </div>
      )}

      <main className={styles.main}>
        <div className="container">
          {/* No hero header — jump straight to images */}

          {!hasImages && (
            <div className={styles.emptyState}>
              <h3>아직 생성된 이미지가 없어요</h3>
              <p>웨딩 여정을 시작해서 추억을 만들어보세요</p>
              <a href="/" className="btn btn-primary">시작하기</a>
            </div>
          )}

          {/* Image Sections — directly, no album header */}
          {steps.map((step) => {
            const imgs = data.images[step];
            if (!imgs || imgs.length === 0) return null;
            return (
              <section key={step} className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>{STEP_TITLES[step]}</h3>
                  <span className={styles.stepCount}>{imgs.length}장</span>
                </div>
                <div className={styles.imageGrid}>
                  {imgs.map((img, i) => {
                    const isGenerating = generatingImages.has(img.url);
                    const isCompleted = !!completedVideos[img.url];

                    return (
                      <div key={img.name} className={styles.imageCard} style={{ position: 'relative' }}>
                        <div onClick={() => !isGenerating && setZoomImg(img.url)} style={{ cursor: isGenerating ? 'wait' : 'pointer' }}>
                          <img 
                            src={img.url} 
                            alt={`${STEP_TITLES[step]} ${i + 1}`} 
                            loading="lazy" 
                            style={{ opacity: isGenerating ? 0.6 : 1 }}
                          />
                        </div>

                        {/* Generation Overlay / Controls */}
                        {!isGenerating && !isCompleted && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); handleVeoClick(img.url); }}
                            style={{
                              position: 'absolute', bottom: 8, right: 8,
                              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                              color: '#fff', padding: '6px 12px', borderRadius: '8px',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', zIndex: 10,
                              display: 'flex', alignItems: 'center', gap: '6px',
                              border: '1px solid rgba(255,255,255,0.2)', transition: 'background 0.2sease'
                            }}
                          >
                            🎬 움직이는 영상 무료로 만들기
                          </div>
                        )}
                        {isGenerating && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', background: 'rgba(0,0,0,0.5)',
                            color: '#fff', zIndex: 10, borderRadius: '12px'
                          }}>
                            <span className="loader-ring" style={{ width: 24, height: 24, borderTopColor: '#FF6B6B', marginBottom: 8 }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>1~2분 소요됩니다...</span>
                          </div>
                        )}
                        {isCompleted && (
                          <a 
                            href={completedVideos[img.url]}
                            download={`MerryMe_Video_${Date.now()}.mp4`}
                            style={{
                              position: 'absolute', bottom: 8, right: 8,
                              background: 'var(--brand)', color: '#fff', padding: '6px 12px', borderRadius: '8px',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', zIndex: 10, textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                          >
                            🎬 고화질 영상 다운로드
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Bottom Actions */}
          {hasImages && (
            <div className={styles.bottomActions}>
              <div style={{ marginTop: 24, padding: 12 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.95rem', textAlign: 'center' }}>
                  웨딩 앨범이 완성되었어요! 🎬 버튼을 눌러 Veo 움직이는 영상을 만들어보세요.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <a href="/" className="btn btn-primary" style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}>
                    처음으로 돌아가기
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
