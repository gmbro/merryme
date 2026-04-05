import styles from './FeatureShowcase.module.css';

const FEATURES = [
  {
    step: 1,
    emoji: '📸',
    title: '가상 스냅사진',
    description: 'AI가 두 분의 사진을 분석하여, 다양한 테마의 프리웨딩 스냅사진을 자동으로 생성합니다.',
  },
  {
    step: 2,
    emoji: '👗',
    title: '드레스 & 메이크업',
    description: '웨딩 드레스, 턱시도, 메이크업을 가상으로 시착해보고 가장 어울리는 스타일을 찾아보세요.',
  },
  {
    step: 3,
    emoji: '💒',
    title: '결혼식장 미리보기',
    description: '전국 실제 예식장 정보를 바탕으로, 선택한 식장에서의 예식 장면을 시뮬레이션합니다.',
  },
  {
    step: 4,
    emoji: '✈️',
    title: '가상 신혼여행',
    description: '파리, 발리, 스위스 등 꿈의 여행지에서 두 사람이 함께하는 스냅을 만들어보세요.',
  },
  {
    step: 5,
    emoji: '🖼️',
    title: '추억 갤러리',
    description: '모든 가상 체험을 아름다운 앨범으로 소장하고, SNS에 공유할 수 있습니다.',
  },
];

export default function FeatureShowcase() {
  return (
    <section id="features" className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <p className="text-label">How It Works</p>
          <h2>5단계로 완성하는<br />가상 결혼 체험</h2>
          <p className={styles.subtitle}>
            사진 한 장이면 충분합니다. AI가 나머지를 만들어 드릴게요.
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <div key={feature.step} className={`card ${styles.featureCard}`}>
              <div className={styles.stepBadge}>{feature.step}</div>
              <span className={styles.emoji}>{feature.emoji}</span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
