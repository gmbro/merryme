'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useVideoExport } from '@/hooks/useVideoExport';
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

/* ─── Acoustic Guitar Music ─── */
function useAcousticMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playingRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const start = useCallback(() => {
    if (playingRef.current) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.12;
      masterGain.connect(ctx.destination);
      gainRef.current = masterGain;

      const chords = [
        [261.63, 329.63, 392.0],
        [220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63],
        [196.0, 246.94, 293.66],
      ];

      let chordIdx = 0;
      const playChord = () => {
        if (!ctxRef.current || ctxRef.current.state === 'closed') return;
        const chord = chords[chordIdx % chords.length];
        chordIdx++;
        chord.forEach((freq, noteIdx) => {
          const osc = ctxRef.current!.createOscillator();
          osc.type = noteIdx === 0 ? 'triangle' : 'sine';
          osc.frequency.value = freq;
          const noteGain = ctxRef.current!.createGain();
          const t = ctxRef.current!.currentTime + noteIdx * 0.15;
          noteGain.gain.setValueAtTime(0, t);
          noteGain.gain.linearRampToValueAtTime(0.04, t + 0.05);
          noteGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 2.5);
        });
        setTimeout(playChord, 2800);
      };

      const pad = ctx.createOscillator();
      pad.type = 'sine';
      pad.frequency.value = 130.81;
      const padGain = ctx.createGain();
      padGain.gain.value = 0.015;
      pad.connect(padGain);
      padGain.connect(masterGain);
      pad.start();

      setTimeout(playChord, 500);
      playingRef.current = true;
    } catch { /* no audio */ }
  }, []);

  const stop = useCallback(() => {
    if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
    playingRef.current = false;
  }, []);

  const toggleMute = useCallback(() => {
    if (gainRef.current) {
      const newMuted = !isMuted;
      gainRef.current.gain.value = newMuted ? 0 : 0.12;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  return { start, stop, toggleMute, isMuted };
}

/* ─── Cinematic Slideshow Popup ─── */
function CinematicSlideshow({ allImages, onClose, onDownloadRequest }: { allImages: { url: string; step: string }[]; onClose: () => void; onDownloadRequest: () => void }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { start: startMusic, stop: stopMusic, toggleMute, isMuted } = useAcousticMusic();
  const [kenBurns, setKenBurns] = useState(0);

  useEffect(() => { document.body.style.overflow = 'hidden'; startMusic(); return () => { document.body.style.overflow = ''; stopMusic(); }; }, [startMusic, stopMusic]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => {
        if (prev >= allImages.length - 1) { setIsPaused(true); return prev; }
        return prev + 1;
      });
      setKenBurns((p) => p + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, allImages.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') { setCurrent((p) => Math.min(p + 1, allImages.length - 1)); setKenBurns((p) => p + 1); }
      if (e.key === 'ArrowLeft') { setCurrent((p) => Math.max(p - 1, 0)); setKenBurns((p) => p + 1); }
      if (e.key === ' ') { e.preventDefault(); setIsPaused((p) => !p); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, allImages.length]);

  const img = allImages[current];
  if (!img) return null;
  const progress = ((current + 1) / allImages.length) * 100;

  const kbStyles: React.CSSProperties[] = [
    { transform: 'scale(1.15) translateX(-2%)', transition: 'transform 5s ease-in-out' },
    { transform: 'scale(1.2) translateY(-3%)', transition: 'transform 5s ease-in-out' },
    { transform: 'scale(1.1) translateX(2%)', transition: 'transform 5s ease-in-out' },
    { transform: 'scale(1.18) translateY(2%)', transition: 'transform 5s ease-in-out' },
  ];

  return (
    <div className={styles.slideshowOverlay}>
      <div className={styles.slideshowBg} key={current}>
        <img src={img.url} alt="" className={styles.slideshowBgImg} style={kbStyles[kenBurns % kbStyles.length]} />
      </div>
      <div className={styles.slideshowContent}>
        <div className={styles.slideshowTop}>
          <span className={styles.slideshowStep}>{STEP_TITLES[img.step] || ''}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.slideshowBtn} onClick={toggleMute}>
              {!isMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              )}
            </button>
            <button className={styles.slideshowClose} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className={styles.slideshowCenter} onClick={() => setIsPaused(!isPaused)}>
          {isPaused && current >= allImages.length - 1 && (
            <div className={styles.slideshowEnd}>
              <p>우리의 아름다운 여정</p>
              <h3>영상을 다운로드 하시겠습니까?</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onDownloadRequest(); }}>
                  네, 다운로드할게요
                </button>
                <button className="btn btn-glass" onClick={(e) => { e.stopPropagation(); setCurrent(0); setIsPaused(false); setKenBurns(0); }}>
                  처음부터 다시 보기
                </button>
              </div>
            </div>
          )}
          {isPaused && current < allImages.length - 1 && (
            <div className={styles.pauseIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M8 5v14l11-7z"/></svg>
            </div>
          )}
        </div>

        <div className={styles.slideshowBottom}>
          <div className={styles.slideshowProgress}>
            <div className={styles.slideshowProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.slideshowControls}>
            <button onClick={() => { setCurrent((p) => Math.max(p - 1, 0)); setKenBurns((p) => p+1); }} className={styles.slideshowBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button onClick={() => setIsPaused(!isPaused)} className={styles.slideshowBtn}>
              {isPaused ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              )}
            </button>
            <button onClick={() => { setCurrent((p) => Math.min(p + 1, allImages.length - 1)); setKenBurns((p) => p+1); }} className={styles.slideshowBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
            <span className={styles.slideshowCounter}>{current + 1} / {allImages.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Gallery Page ─── */
export default function GalleryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Veo States
  const [reviewImgUrl, setReviewImgUrl] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [completedVideos, setCompletedVideos] = useState<Record<string, string>>({});
  
  const { exportVideo, exporting: videoExporting, progress: videoProgress } = useVideoExport();

  // Check ?paid=true from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('paid') === 'true') {
      setIsPaid(true);
      window.history.replaceState({}, '', `/gallery/${sessionId}`);
    }
  }, [sessionId]);

  // Check payment in localStorage
  useEffect(() => {
    const paid = localStorage.getItem(`merryme_paid_${sessionId}`);
    if (paid === 'true') setIsPaid(true);
  }, [sessionId]);

  const allSlideImages = typeof window !== 'undefined' && data ? ['snapshot', 'venue', 'honeymoon'].flatMap(step => 
    (data.images[step as keyof GalleryData['images']] || []).map(img => ({ url: img.url, step }))
  ) : [];

  // Process pending download intent from missing payment flow
  useEffect(() => {
    const dlIntentKey = `merryme_intent_download_${sessionId}`;
    if (localStorage.getItem(dlIntentKey) === 'true') {
      localStorage.removeItem(dlIntentKey);
      if (!isPaid) {
        setShowPaymentModal(true);
      } else if (allSlideImages.length > 0) {
        exportVideo(allSlideImages.map((i) => i.url), `MerryMe_Wedding_${sessionId.slice(0, 8)}.webm`);
      }
    }
  }, [isPaid, sessionId, exportVideo, allSlideImages]);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch(`/api/gallery/${sessionId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '갤러리 로드 실패');
        setData(json);
        // Automatically start slideshow
        if (json.totalCount > 0 && !sessionStorage.getItem(`merryme_slideshow_seen_${sessionId}`)) {
          setShowSlideshow(true);
          sessionStorage.setItem(`merryme_slideshow_seen_${sessionId}`, 'true');
        }
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
    } catch {
      alert('다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [sessionId]);

  const handleDownloadRequest = useCallback(() => {
    if (!isPaid) { setShowPaymentModal(true); return; }
    exportVideo(allSlideImages.map(i => i.url), `MerryMe_Wedding_${sessionId.slice(0, 8)}.webm`);
  }, [isPaid, exportVideo, sessionId, allSlideImages]);

  const handleVideoView = useCallback(() => {
    setShowSlideshow(true);
  }, []);

  const handleCheckout = useCallback(async () => {
    setCheckingPayment(true);
    try {
      const PortOne = await import('@portone/browser-sdk/v2');
      const paymentId = `merryme_${sessionId.slice(0, 8)}_${Date.now()}`;
      const AMOUNT = 1000; // 1,000원 ($1)

      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '',
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '',
        paymentId,
        orderName: 'MerryMe 웨딩 영상 다운로드',
        totalAmount: AMOUNT,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
      });

      if (response?.code !== undefined) {
        // 결제 실패/취소
        if (response.code === 'USER_CANCEL') {
          // 사용자가 취소 — 조용히 처리
        } else {
          alert(response?.message || '결제에 실패했습니다.');
        }
        return;
      }

      // 서버에서 결제 검증
      const verifyRes = await fetch('/api/payment-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, sessionId, expectedAmount: AMOUNT }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        setIsPaid(true);
        localStorage.setItem(`merryme_paid_${sessionId}`, 'true');
        setShowPaymentModal(false);
        alert('결제가 완료되었습니다! 앨범을 다운로드할 수 있어요.');
      } else {
        alert('결제 검증에 실패했습니다. 고객센터에 문의해주세요.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('결제 중 오류가 발생했습니다.');
    } finally {
      setCheckingPayment(false);
    }
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
        setTimeout(() => {
          setGeneratingImages(prev => { const n = new Set(prev); n.delete(imgUrl); return n; });
          setCompletedVideos(prev => ({ ...prev, [imgUrl]: imgUrl })); 
          alert('영상이 성공적으로 생성되었습니다!');
        }, 60000); 
      } else {
        throw new Error(result.error || '영상 생성 요청 실패');
      }
    })
    .catch(err => {
      console.error(err);
      setGeneratingImages(prev => { const n = new Set(prev); n.delete(imgUrl); return n; });
      alert('영상 생성 중 문제가 발생하였습니다. 문의바랍니다.');
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
      {showSlideshow && allSlideImages.length > 0 && (
        <CinematicSlideshow allImages={allSlideImages} onClose={() => setShowSlideshow(false)} onDownloadRequest={handleDownloadRequest} />
      )}

      {zoomImg && (
        <div className={styles.zoomOverlay} onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="확대" className={styles.zoomImage} />
          <button className={styles.zoomClose} onClick={() => setZoomImg(null)}>✕</button>
        </div>
      )}

      {/* Login Modal removed */}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className={styles.paymentOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.paymentBadge}>Premium</div>
            <h3 className={styles.paymentTitle}>앨범 전체 다운로드</h3>
            <p className={styles.paymentDesc}>
              무제한 다운로드로 특별한 여정 간직
            </p>
            <div className={styles.priceBox}>
              <span className={styles.priceAmount}>단돈 $1</span>
              <span className={styles.priceLabel}>(1,000원) / 1회 결제</span>
            </div>
            <ul className={styles.priceFeatures}>
              <li>HD 해상도 이미지</li>
              <li>모든 사진 포함</li>
            </ul>
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={checkingPayment}
              style={{ width: '100%', whiteSpace: 'nowrap' }}
            >
              {checkingPayment ? '결제 준비 중...' : '단돈 $1에 결제하고 다운로드하기'}
            </button>
            <button className={styles.paymentCancel} onClick={() => setShowPaymentModal(false)}>
              다음에 할게요
            </button>
          </div>
        </div>
      )}

      {/* Review Modal for Veo Generation */}
      {reviewImgUrl && (
        <ReviewModal 
          sessionId={sessionId}
          onSuccess={() => handleReviewSuccess(reviewImgUrl)}
          onClose={() => setReviewImgUrl(null)}
        />
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
              {videoExporting && (
                <div style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--brand)', fontWeight: 600 }}>
                  영상 생성 중... {videoProgress}% 
                </div>
              )}
              <button className="btn btn-primary" onClick={handleVideoView} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}>
                슬라이드쇼 미리보기(무료)
              </button>
              <button className="btn btn-glass" onClick={handleDownloadRequest} disabled={videoExporting} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap', marginTop: 12 }}>
                전체 이미지 앨범 다운로드
              </button>
              <a href="/" className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }}>
                처음으로 돌아가기
              </a>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
