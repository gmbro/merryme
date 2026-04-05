import Header from '@/components/layout/Header';
import styles from './page.module.css';

export const metadata = {
  title: '이용약관 — 메리미',
  description: '(주)아키랩 메리미 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>이용약관</h1>
          <p className={styles.updated}>최종 수정일: 2026년 4월 5일</p>

          <section className={styles.section}>
            <h2>제1조 (목적)</h2>
            <p>
              본 약관은 (주)아키랩(이하 &quot;회사&quot;)이 제공하는 &quot;메리미(MerryMe)&quot; 서비스(이하
              &quot;서비스&quot;)의 이용에 관한 조건 및 절차, 회사와 이용자 간의 권리·의무 및
              책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className={styles.section}>
            <h2>제2조 (정의)</h2>
            <ol>
              <li><strong>&quot;서비스&quot;</strong>란 회사가 제공하는 AI 기반 가상 웨딩 체험 플랫폼으로, 이용자가 업로드한 사진을 기반으로 가상 웨딩 스냅사진, 드레스·메이크업 시뮬레이션, 결혼식장 미리보기, 신혼여행 이미지 등을 AI로 생성하는 서비스를 말합니다.</li>
              <li><strong>&quot;이용자&quot;</strong>란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
              <li><strong>&quot;콘텐츠&quot;</strong>란 서비스를 통해 생성된 AI 이미지, 갤러리 등을 말합니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제3조 (약관의 효력 및 변경)</h2>
            <ol>
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일 7일 전부터 공지합니다.</li>
              <li>변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제4조 (서비스의 제공)</h2>
            <p>회사는 다음과 같은 서비스를 제공합니다.</p>
            <ul>
              <li>AI 기반 가상 웨딩 스냅사진 생성</li>
              <li>가상 드레스·메이크업 스타일링 체험</li>
              <li>결혼식장 시뮬레이션 및 실제 예식장 검색</li>
              <li>가상 신혼여행 이미지 생성</li>
              <li>생성된 이미지 갤러리 제공 및 다운로드</li>
              <li>기타 회사가 추가 개발하는 서비스</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제5조 (서비스 이용 계약)</h2>
            <ol>
              <li>이용 계약은 이용자가 본 약관에 동의하고 서비스를 이용함으로써 성립됩니다.</li>
              <li>이미지 다운로드 등 일부 기능은 Google 계정 로그인이 필요합니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제6조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ol>
              <li>타인의 사진을 무단으로 사용하여 서비스를 이용하는 행위</li>
              <li>서비스를 이용하여 생성된 이미지를 타인의 명예를 훼손하거나 불법적인 목적으로 사용하는 행위</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>회사의 저작권, 특허권 등 지적재산권을 침해하는 행위</li>
              <li>외설, 폭력적 또는 법령에 위반되는 콘텐츠를 생성하는 행위</li>
              <li>기타 관계 법령에 위배되는 행위</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제7조 (콘텐츠의 저작권 및 이용 권한)</h2>
            <ol>
              <li>이용자가 업로드한 원본 사진에 대한 권리는 이용자에게 있습니다.</li>
              <li>서비스를 통해 AI로 생성된 이미지(콘텐츠)에 대한 저작권은 법률이 허용하는 범위 내에서 이용자에게 귀속됩니다.</li>
              <li>회사는 서비스 홍보, 개선 등의 목적으로 생성된 콘텐츠를 비식별화 처리 후 활용할 수 있습니다.</li>
              <li>생성된 AI 이미지는 실제 인물과 무관하며, 이를 이용하여 타인의 초상권이나 명예를 침해해서는 안 됩니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제8조 (서비스의 중단)</h2>
            <ol>
              <li>회사는 시스템 점검, 교체, 고장, 통신 두절 등의 사유가 발생한 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
              <li>천재지변, 전쟁 등 불가항력으로 서비스를 제공할 수 없는 경우에도 서비스가 중단될 수 있습니다.</li>
              <li>서비스 중단의 경우 회사는 사전 또는 사후에 이를 공지합니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제9조 (면책 조항)</h2>
            <ol>
              <li>회사는 AI가 생성한 이미지의 정확성, 완성도, 적합성에 대해 보증하지 않습니다.</li>
              <li>이용자가 서비스를 통해 생성한 콘텐츠를 사용하면서 발생하는 문제에 대해 회사는 책임을 지지 않습니다.</li>
              <li>회사는 무료로 제공하는 서비스에 대해서는 관련 법령에 별도 규정이 없는 한 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>제10조 (손해배상)</h2>
            <p>
              회사 또는 이용자가 본 약관을 위반하여 상대방에게 손해를 입힌 경우,
              귀책 사유가 있는 당사자는 상대방에게 발생한 손해를 배상해야 합니다.
            </p>
          </section>

          <section className={styles.section}>
            <h2>제11조 (분쟁 해결)</h2>
            <ol>
              <li>본 약관에 관한 분쟁은 대한민국 법률에 따라 해석됩니다.</li>
              <li>서비스 이용과 관련하여 발생한 분쟁은 민사소송법상의 관할 법원에 소를 제기합니다.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>부칙</h2>
            <p>본 약관은 2026년 4월 5일부터 시행합니다.</p>
          </section>

          <div className={styles.companyInfo}>
            <p><strong>(주)아키랩</strong></p>
            <p>대표이사: 이경민</p>
          </div>
        </div>
      </main>
    </>
  );
}
