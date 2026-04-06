'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ReviewModalProps {
  sessionId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ReviewModal({ sessionId, onSuccess, onClose }: ReviewModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('리뷰 등록에 실패했습니다.');
      }

      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        style={{
          background: '#fff', padding: '2rem', borderRadius: '16px',
          width: '100%', maxWidth: '400px', color: '#111',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💌</span> 정성스러운 후기 남기기
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          MerryMe 이용 후기를 20자 이상 남겨주시면,<br/>
          최신 AI로 제작되는 <strong>움직이는 영상 1개를 무료</strong>로 만들어드려요!
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="예: 예쁜 웨딩 사진을 이렇게 빠르고 쉽게 만들 수 있어서 너무 좋았어요! 남편이랑 보면서 감탄했습니다 👍"
            rows={5}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px',
              border: '1px solid #ddd', fontSize: '0.95rem', resize: 'none',
              fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#FF6B6B'}
            onBlur={e => e.target.style.borderColor = '#ddd'}
            required
            minLength={20}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: content.length >= 20 ? '#34A853' : '#FF6B6B' }}>
              {content.length} / 20자 이상
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                flex: 1, padding: '0.8rem', borderRadius: '12px',
                background: '#f1f3f5', color: '#495057', fontSize: '0.95rem',
                border: 'none', fontWeight: 600, cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || content.length < 20}
              style={{
                flex: 2, padding: '0.8rem', borderRadius: '12px',
                background: 'var(--brand)', color: '#fff', fontSize: '0.95rem',
                border: 'none', fontWeight: 600, cursor: (isSubmitting || content.length < 20) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || content.length < 20) ? 0.6 : 1
              }}
            >
              {isSubmitting ? '등록 중...' : '영상 1개 무료로 받기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
