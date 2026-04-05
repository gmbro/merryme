'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Generate a soft wedding-style ambient BGM using Web Audio API.
 * Returns an AudioContext and a destination node that can be connected to MediaRecorder.
 */
function createWeddingBGM(audioCtx: AudioContext, duration: number): MediaStreamAudioDestinationNode {
  const dest = audioCtx.createMediaStreamDestination();

  // Gentle pad chords — wedding-style ambient
  const chords = [
    [261.63, 329.63, 392.00], // C major
    [293.66, 369.99, 440.00], // D major
    [349.23, 440.00, 523.25], // F major
    [392.00, 493.88, 587.33], // G major
  ];

  const noteDuration = duration / chords.length;

  chords.forEach((chord, i) => {
    const startTime = i * noteDuration;
    chord.forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Soft volume with fade in/out
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.8);
      gain.gain.setValueAtTime(0.06, startTime + noteDuration - 1);
      gain.gain.linearRampToValueAtTime(0, startTime + noteDuration);
      
      osc.connect(gain);
      gain.connect(dest);
      
      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });

    // Subtle high sparkle note
    const sparkle = audioCtx.createOscillator();
    const sparkleGain = audioCtx.createGain();
    sparkle.type = 'sine';
    sparkle.frequency.value = chord[2] * 2; // Octave up
    sparkleGain.gain.setValueAtTime(0, startTime + 0.5);
    sparkleGain.gain.linearRampToValueAtTime(0.02, startTime + 1);
    sparkleGain.gain.linearRampToValueAtTime(0, startTime + noteDuration - 0.5);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(dest);
    sparkle.start(startTime + 0.5);
    sparkle.stop(startTime + noteDuration);
  });

  return dest;
}

/**
 * Hook to export a slideshow of images as video with BGM.
 * 1080p resolution, 5 seconds per image with Ken Burns animation + wedding BGM.
 */
export function useVideoExport() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  const exportVideo = useCallback(async (imageUrls: string[], fileName = 'MerryMe_Wedding.webm') => {
    if (imageUrls.length === 0) return;
    setExporting(true);
    setProgress(0);
    cancelRef.current = false;

    try {
      const WIDTH = 1920;
      const HEIGHT = 1080;
      const FPS = 30;
      const SECONDS_PER_IMAGE = 5;
      const FRAMES_PER_IMAGE = FPS * SECONDS_PER_IMAGE;
      const FADE_FRAMES = FPS; // 1 second fade
      const totalDuration = imageUrls.length * SECONDS_PER_IMAGE;

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!;

      // Load all images
      const images: HTMLImageElement[] = [];
      for (const url of imageUrls) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load: ${url}`));
          img.src = url;
        });
        images.push(img);
      }

      // Set up audio
      const audioCtx = new AudioContext();
      const bgmDest = createWeddingBGM(audioCtx, totalDuration);

      // Combine video + audio streams
      const videoStream = canvas.captureStream(FPS);
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...bgmDest.stream.getAudioTracks(),
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 8000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
      });

      mediaRecorder.start(100);

      // Start audio
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const totalFrames = images.length * FRAMES_PER_IMAGE;

      // Ken Burns configurations
      const kbEffects = [
        { startScale: 1.0, endScale: 1.15, startX: 0, endX: -0.02, startY: 0, endY: 0 },
        { startScale: 1.1, endScale: 1.0, startX: 0.02, endX: 0, startY: -0.02, endY: 0 },
        { startScale: 1.0, endScale: 1.12, startX: -0.01, endX: 0.01, startY: 0.01, endY: -0.01 },
        { startScale: 1.15, endScale: 1.0, startX: 0, endX: 0.02, startY: 0, endY: 0.02 },
      ];

      // Render frames
      for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
        if (cancelRef.current) break;

        const img = images[imgIdx];
        const nextImg = images[imgIdx + 1] || null;
        const kb = kbEffects[imgIdx % kbEffects.length];

        for (let f = 0; f < FRAMES_PER_IMAGE; f++) {
          const globalFrame = imgIdx * FRAMES_PER_IMAGE + f;
          setProgress(Math.round((globalFrame / totalFrames) * 100));

          const t = f / FRAMES_PER_IMAGE;
          const scale = kb.startScale + (kb.endScale - kb.startScale) * t;
          const tx = (kb.startX + (kb.endX - kb.startX) * t) * WIDTH;
          const ty = (kb.startY + (kb.endY - kb.startY) * t) * HEIGHT;

          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          ctx.save();
          ctx.translate(WIDTH / 2 + tx, HEIGHT / 2 + ty);
          ctx.scale(scale, scale);
          
          const imgRatio = img.width / img.height;
          const canvasRatio = WIDTH / HEIGHT;
          let dw: number, dh: number;
          if (imgRatio > canvasRatio) {
            dh = HEIGHT;
            dw = HEIGHT * imgRatio;
          } else {
            dw = WIDTH;
            dh = WIDTH / imgRatio;
          }
          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();

          // Fade transition
          if (nextImg && f >= FRAMES_PER_IMAGE - FADE_FRAMES) {
            const fadeT = (f - (FRAMES_PER_IMAGE - FADE_FRAMES)) / FADE_FRAMES;
            ctx.globalAlpha = fadeT;
            const nImgRatio = nextImg.width / nextImg.height;
            let ndw: number, ndh: number;
            if (nImgRatio > canvasRatio) {
              ndh = HEIGHT;
              ndw = HEIGHT * nImgRatio;
            } else {
              ndw = WIDTH;
              ndh = WIDTH / nImgRatio;
            }
            ctx.drawImage(nextImg, (WIDTH - ndw) / 2, (HEIGHT - ndh) / 2, ndw, ndh);
            ctx.globalAlpha = 1;
          }

          if (f % 5 === 0) {
            await new Promise(r => setTimeout(r, 0));
          }
        }
      }

      mediaRecorder.stop();
      await recordingDone;
      audioCtx.close();

      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
    } catch (error) {
      console.error('Video export error:', error);
      alert('영상 생성에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { exportVideo, exporting, progress, cancel };
}
