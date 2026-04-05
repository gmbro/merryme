'use client';

export default function Footer() {
  return (
    <footer style={{
      background: 'transparent',
      textAlign: 'center',
      padding: '20px 16px 16px',
      color: '#9a8a7a',
      fontSize: '0.65rem',
      lineHeight: 1.6,
    }}>
      <div>(주)아키랩 · 개인정보보호 책임자 이경민</div>
      <div>© 2026 MerryMe · AI 기반 가상 결혼 체험</div>
      <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
        <a href="/privacy" style={{ color: '#9a8a7a', textDecoration: 'none', fontSize: '0.6rem' }}>개인정보처리방침</a>
        <span style={{ color: '#ccc', fontSize: '0.55rem' }}>·</span>
        <a href="/terms" style={{ color: '#9a8a7a', textDecoration: 'none', fontSize: '0.6rem' }}>이용약관</a>
      </div>
    </footer>
  );
}
