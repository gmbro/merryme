'use client';

import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="/" className={styles.logo}>
          <img src="/logo.png" alt="메리미" className={styles.logoImg} />
          <span className={styles.logoText}>메리미</span>
        </a>
      </div>
    </header>
  );
}
