'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>💍</span>
          <span className={styles.logoText}>MerryMe</span>
        </a>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <a href="#features" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            서비스 소개
          </a>
          <a href="#pricing" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            요금제
          </a>
          <a href="#start" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            시작하기
          </a>
          <div className={styles.authSection}>
            {loading ? null : user ? (
              <div className={styles.userInfo}>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className={styles.avatar}
                  />
                )}
                <span className={styles.userName}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button onClick={signOut} className={styles.authBtn}>
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className={`btn btn-small ${styles.googleBtn}`}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google 로그인
              </button>
            )}
          </div>
        </nav>

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴 열기"
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
        </button>
      </div>
    </header>
  );
}
