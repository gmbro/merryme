import styles from './StepIndicator.module.css';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = [
  '사진 업로드',
  '스냅사진',
  '스타일링',
  '결혼식장',
  '신혼여행',
];

export default function StepIndicator({
  currentStep,
  totalSteps = 5,
}: StepIndicatorProps) {
  return (
    <div className="step-indicator" role="navigation" aria-label="진행 단계">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        return (
          <div key={step} className={styles.stepItem}>
            <div
              className={`step-dot ${isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}`}
              aria-current={isActive ? 'step' : undefined}
              title={STEP_LABELS[i]}
            >
              {isCompleted ? '✓' : step}
            </div>
            {step < totalSteps && (
              <div className={`step-line ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
