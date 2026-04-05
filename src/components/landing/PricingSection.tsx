import styles from './PricingSection.module.css';

export default function PricingSection() {
  return (
    <section id="pricing" className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <p className="text-label">Pricing</p>
          <h2>부담 없는 가격으로<br />꿈의 결혼식을 만나세요</h2>
        </div>

        <div className={styles.grid}>
          {/* Free Plan */}
          <div className={`card ${styles.planCard}`}>
            <div className={styles.planBadge}>무료</div>
            <h3 className={styles.planName}>Basic</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>₩0</span>
            </div>
            <p className={styles.planDesc}>
              가상 결혼식을 맛보기로 체험해보세요
            </p>
            <ul className={styles.features}>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                사진 업로드 (HER & HIM)
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                스냅사진 2장 생성
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                드레스 & 메이크업 1회 체험
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                480px 해상도
              </li>
              <li className={`${styles.feature} ${styles.disabled}`}>
                <span className={styles.cross}>✕</span>
                결혼식장 시뮬레이션
              </li>
              <li className={`${styles.feature} ${styles.disabled}`}>
                <span className={styles.cross}>✕</span>
                신혼여행 갤러리
              </li>
              <li className={`${styles.feature} ${styles.disabled}`}>
                <span className={styles.cross}>✕</span>
                고해상도 다운로드
              </li>
            </ul>
            <button className="btn btn-secondary" style={{ width: '100%' }}>
              무료로 시작
            </button>
          </div>

          {/* Premium Plan */}
          <div className={`card ${styles.planCard} ${styles.premium}`}>
            <div className={`${styles.planBadge} ${styles.premiumBadge}`}>☕ 커피 한 잔</div>
            <h3 className={styles.planName}>Premium</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>₩1,500</span>
              <span className={styles.pricePer}>/1회</span>
            </div>
            <p className={styles.planDesc}>
              커피 한 잔 가격으로 모든 체험을 즐기세요
            </p>
            <ul className={styles.features}>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                사진 업로드 (최대 5장씩)
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                스냅사진 무제한 생성
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                드레스 & 메이크업 무제한
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                <strong>1080px+ 고해상도</strong>
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                결혼식장 시뮬레이션
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                신혼여행 갤러리
              </li>
              <li className={styles.feature}>
                <span className={styles.check}>✓</span>
                전체 앨범 다운로드 & 공유
              </li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              ☕ 커피값으로 시작
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
