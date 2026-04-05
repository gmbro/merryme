'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Hook to export a slideshow of images as MP4 video using Canvas + MediaRecorder.
 * 1080p resolution, 5 seconds per image with Ken Burns animation.
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

      // Set up MediaRecorder
      const stream = canvas.captureStream(FPS);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000, // 8 Mbps for 1080p quality
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
      });

      mediaRecorder.start(100); // collect data every 100ms

      const totalFrames = images.length * FRAMES_PER_IMAGE;

      // Ken Burns effect configurations
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

          // Clear
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // Draw current image with Ken Burns
          ctx.save();
          ctx.translate(WIDTH / 2 + tx, HEIGHT / 2 + ty);
          ctx.scale(scale, scale);
          
          // Cover drawing (maintain aspect ratio)
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

          // Fade transition to next image
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

          // Small delay to let browser process frames
          if (f % 5 === 0) {
            await new Promise(r => setTimeout(r, 0));
          }
        }
      }

      // Stop recording
      mediaRecorder.stop();
      await recordingDone;

      // Create download
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
