'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
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

const STEP_INFO: Record<string, { title: string; emoji: string }> = {
  snapshot: { title: '가상 스냅사진', emoji: '📸' },
  venue: { title: '결혼식장', emoji: '💒' },
  honeymoon: { title: '신혼여행', emoji: '✈️' },
};

/* ─── Web Audio: Ambient Wedding Music Generator ─── */
function useAmbientMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playingRef = useRef(false);

  const start = useCallback(() => {
    if (playingRef.current) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);
      gainRef.current = gain;

      // Gentle pad sound — two detuned oscillators
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = Math.random() * 5;

        const oscGain = ctx.createGain();
        oscGain.gain.value = 0;
        // Fade in slowly
        oscGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2 + i * 0.5);

        osc.connect(oscGain);
        oscGain.connect(gain);
        osc.start(ctx.currentTime + i * 0.3);
      });

      // Gentle high chime every few seconds
      const playChime = () => {
        if (!ctxRef.current || ctxRef.current.state === 'closed') return;
        const chime = ctxRef.current.createOscillator();
        chime.type = 'sine';
        chime.frequency.value = 800 + Math.random() * 400;
        const chimeGain = ctxRef.current.createGain();
        chimeGain.gain.value = 0.02;
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctxRef.current.currentTime + 3);
        chime.connect(chimeGain);
        chimeGain.connect(gain);
        chime.start();
        chime.stop(ctxRef.current.currentTime + 3);
        setTimeout(playChime, 4000 + Math.random() * 6000);
      };
      setTimeout(playChime, 3000);

      playingRef.current = true;
    } catch {
      // Web Audio not supported
    }
  }, []);

  const stop = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    playingRef.current = false;
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      if (gainRef.current) {
        gainRef.current.gain.value = gainRef.current.gain.value > 0 ? 0 : 0.08;
      }
    } else {
      start();
    }
  }, [start]);

  return { start, stop, toggle, isPlaying: playingRef };
}

/* ─── Cinematic Slideshow with Music ─── */
function CinematicSlideshow({
  allImages,
  onClose,
}: {
  allImages: { url: string; step: string; index: number }[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const { start: startMusic, stop: stopMusic, toggle: toggleMusic } = useAmbientMusic();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    startMusic();
    return () => {
      document.body.style.overflow = '';
      stopMusic();
    };
  }, [startMusic, stopMusic]);

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
      <div className={styles.slideshowBg} key={current}>
        <img src={img.url} alt="" className={styles.slideshowBgImg} />
      </div>

      <div className={styles.slideshowContent}>
        <div className={styles.slideshowTop}>
          <span className={styles.slideshowStep}>
            {stepInfo?.emoji} {stepInfo?.title}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={styles.slideshowBtn}
              onClick={() => { toggleMusic(); setMusicOn(!musicOn); }}
              title={musicOn ? '음악 끄기' : '음악 켜기'}
            >
              {musicOn ? (
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
              <p>우리의 아름다운 여정 ✨</p>
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

/* ─── Gallery Page ─── */
export default function GalleryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [copied, setCopied] = useState(false);
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
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  }, []);

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
          <span className={styles.errorEmoji}>😢</span>
          <h2>갤러리를 찾을 수 없습니다</h2>
          <p>{error || '해당 세션의 갤러리가 존재하지 않습니다.'}</p>
          <a href="/" className="btn btn-primary">홈으로 돌아가기</a>
        </div>
      </main>
    );
  }

  const steps = ['snapshot', 'venue', 'honeymoon'] as const;
  const hasImages = data.totalCount > 0;

  // Gather all images for slideshow
  const allSlideImages: { url: string; step: string; index: number }[] = [];
  steps.forEach((step) => {
    const imgs = data.images[step];
    if (imgs) imgs.forEach((img, i) => allSlideImages.push({ url: img.url, step, index: i }));
  });

  return (
    <>
      {/* Cinematic Slideshow with Music */}
      {showSlideshow && allSlideImages.length > 0 && (
        <CinematicSlideshow allImages={allSlideImages} onClose={() => setShowSlideshow(false)} />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className={styles.paymentOverlay} onClick={() => setShowLoginModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
              <polygon points="5 3 19 12 5 21 5 3" />
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
            <button className={styles.paymentCancel} onClick={() => setShowLoginModal(false)}>
              다음에 할게요
            </button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <a href="/" className={styles.homeLink}>← 메인으로</a>
            <h1 className={styles.heroTitle}>
              우리의 특별한
              <br />
              <span className="text-display">가상 웨딩 앨범</span>
            </h1>
            <p className={styles.heroStats}>💍 총 {data.totalCount}장의 추억</p>
          </div>
        </section>

        <div className="container">
          {/* Actions */}
          <div className={styles.actionBar}>
            <div className={styles.actionLeft}>
              <h2 className={styles.albumTitle}>💐 웨딩 앨범</h2>
            </div>
            <div className={styles.actionRight}>
              {allSlideImages.length > 0 && (
                <button className="btn btn-secondary btn-small" onClick={() => setShowSlideshow(true)}>
                  ▶ 영상 재생
                </button>
              )}
              <button className="btn btn-secondary btn-small" onClick={handleShare} disabled={!hasImages}>
                {copied ? '✅ 복사됨' : '🔗 공유'}
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={() => user ? handleDownloadZip() : setShowLoginModal(true)}
                disabled={!hasImages || downloading}
              >
                {downloading ? (
                  <><span className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> 다운로드 중...</>
                ) : user ? (
                  '📥 다운로드'
                ) : (
                  '🔒 다운로드'
                )}
              </button>
            </div>
          </div>

          {/* Empty State */}
          {!hasImages && (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji}>🖼️</span>
              <h3>아직 생성된 이미지가 없어요</h3>
              <p>가상 웨딩 여행을 시작해서 추억을 만들어보세요!</p>
              <a href="/" className="btn btn-primary">시작하기</a>
            </div>
          )}

          {/* Image Sections (3 groups) */}
          {steps.map((step) => {
            const imgs = data.images[step];
            if (!imgs || imgs.length === 0) return null;
            const info = STEP_INFO[step];
            return (
              <section key={step} className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>{info.emoji} {info.title}</h3>
                  <span className={styles.stepCount}>{imgs.length}장</span>
                </div>
                <div className={styles.imageGrid}>
                  {imgs.map((img, i) => (
                    <div key={img.name} className={styles.imageCard}>
                      <img src={img.url} alt={`${info.title} ${i + 1}`} loading="lazy" />
                      <div className={styles.imageOverlay}>
                        <span className={styles.imageIndex}>#{i + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* CTA */}
          {hasImages && (
            <div className={styles.bottomCta}>
              <p className={styles.ctaText}>✨ 새로운 가상 웨딩을 시작해보세요</p>
              <a href="/" className="btn btn-primary btn-large">🏠 처음으로</a>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className="container">
            <p>© 2026 MerryMe. AI 기반 가상 결혼 & 신혼여행 체험 플랫폼.</p>
            <p className={styles.footerNote}>
              모든 이미지는 AI(NanoBanana2)로 생성되며, 실제 배경과 무관합니다.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
