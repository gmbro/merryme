'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVideoExport } from '@/hooks/useVideoExport';
import Footer from '@/components/layout/Footer';
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
function CinematicSlideshow({ allImages, onClose }: { allImages: { url: string; step: string }[]; onClose: () => void }) {
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
              <button className="btn btn-glass" onClick={(e) => { e.stopPropagation(); setCurrent(0); setIsPaused(false); setKenBurns(0); }}>
                처음부터 다시 보기
              </button>
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
  const { user, signInWithGoogle } = useAuth();
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
    } catch {
      alert('다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [sessionId]);

  const handleVideoDownload = useCallback((allUrls: string[]) => {
    if (!user) { setShowLoginModal(true); return; }
    if (!isPaid) { setShowPaymentModal(true); return; }
    exportVideo(allUrls, `MerryMe_Wedding_${sessionId.slice(0, 8)}.webm`);
  }, [user, isPaid, exportVideo, sessionId]);

  const handleCheckout = useCallback(async () => {
    setCheckingPayment(true);
    try {
      const PortOne = await import('@portone/browser-sdk/v2');
      const paymentId = `merryme_${sessionId.slice(0, 8)}_${Date.now()}`;
      const AMOUNT = 1500; // 1,500원

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
        alert('결제가 완료되었습니다! 영상을 다운로드할 수 있어요.');
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
  const allSlideImages: { url: string; step: string }[] = [];
  steps.forEach((step) => {
    const imgs = data.images[step];
    if (imgs) imgs.forEach((img) => allSlideImages.push({ url: img.url, step }));
  });

  return (
    <>
      {showSlideshow && allSlideImages.length > 0 && (
        <CinematicSlideshow allImages={allSlideImages} onClose={() => setShowSlideshow(false)} />
      )}

      {zoomImg && (
        <div className={styles.zoomOverlay} onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="확대" className={styles.zoomImage} />
          <button className={styles.zoomClose} onClick={() => setZoomImg(null)}>✕</button>
        </div>
      )}

      {showLoginModal && (
        <div className={styles.paymentOverlay} onClick={() => setShowLoginModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.paymentTitle}>앨범 다운로드</h3>
            <p className={styles.paymentDesc}>
              고화질 앨범을 다운로드하려면<br />구글 로그인이 필요해요
            </p>
            <button
              className="btn btn-primary"
              onClick={async () => { setShowLoginModal(false); await signInWithGoogle(); }}
              style={{ width: '100%', gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              구글로 로그인
            </button>
            <button className={styles.paymentCancel} onClick={() => setShowLoginModal(false)}>
              다음에 할게요
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className={styles.paymentOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.paymentBadge}>Premium</div>
            <h3 className={styles.paymentTitle}>영상 다운로드</h3>
            <p className={styles.paymentDesc}>
              1080p 고화질 웨딩 영상을<br />다운로드 받으세요
            </p>
            <div className={styles.priceBox}>
              <span className={styles.priceAmount}>₩1,500</span>
              <span className={styles.priceLabel}>1회 결제</span>
            </div>
            <ul className={styles.priceFeatures}>
              <li>1080p Full HD 영상</li>
              <li>Ken Burns 시네마틱 효과</li>
              <li>모든 사진 포함</li>
            </ul>
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={checkingPayment}
              style={{ width: '100%', whiteSpace: 'nowrap' }}
            >
              {checkingPayment ? '결제 준비 중...' : '1,500원 결제하고 다운로드'}
            </button>
            <button className={styles.paymentCancel} onClick={() => setShowPaymentModal(false)}>
              다음에 할게요
            </button>
          </div>
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
                  {imgs.map((img, i) => (
                    <div key={img.name} className={styles.imageCard} onClick={() => setZoomImg(img.url)}>
                      <img src={img.url} alt={`${STEP_TITLES[step]} ${i + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Bottom Actions */}
          {hasImages && (
            <div className={styles.bottomActions}>
              <button className="btn btn-primary btn-large" onClick={() => setShowSlideshow(true)} style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}>
                영상으로 보기
              </button>
              <button
                className="btn btn-secondary btn-large"
                onClick={() => handleVideoDownload(allSlideImages.map(i => i.url))}
                disabled={videoExporting}
                style={{ width: '100%', maxWidth: 360, whiteSpace: 'nowrap' }}
              >
                {videoExporting
                  ? `영상 생성 중... ${videoProgress}%`
                  : isPaid
                    ? '영상 다운로드 (1080p)'
                    : '영상 다운로드 (₩1,500)'}
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
