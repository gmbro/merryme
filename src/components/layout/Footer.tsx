'use client';

export default function Footer() {
  return (
    <footer style={{
      background: 'transparent',
      textAlign: 'center',
      padding: '40px 20px 32px',
      color: '#8a7a6a',
      fontSize: '0.78rem',
      lineHeight: 1.8,
    }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>메리미</div>
      <div>(주)아키랩 · 개인정보보호 책임자 이경민</div>
      <div>© 2026 MerryMe · AI 기반 가상 결혼 체험</div>
      <div style={{ fontSize: '0.7rem', color: '#b0a090', marginTop: 4 }}>모든 이미지는 AI로 생성되며 실제 배경과 무관합니다</div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
        <a href="/privacy" style={{ color: '#8a7a6a', textDecoration: 'none', fontSize: '0.72rem' }}>개인정보처리방침</a>
        <span style={{ color: '#ccc', fontSize: '0.7rem' }}>·</span>
        <a href="/terms" style={{ color: '#8a7a6a', textDecoration: 'none', fontSize: '0.72rem' }}>이용약관</a>
      </div>
    </footer>
  );
}
