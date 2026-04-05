import Header from '@/components/layout/Header';
import styles from './page.module.css';

export const metadata = {
  title: '개인정보처리방침 — 메리미',
  description: '(주)아키랩 메리미 서비스 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>개인정보처리방침</h1>
          <p className={styles.updated}>최종 수정일: 2026년 4월 5일</p>

          <section className={styles.section}>
            <h2>제1조 (목적)</h2>
            <p>
              (주)아키랩(이하 &quot;회사&quot;)은 「개인정보 보호법」에 따라 이용자의 개인정보를
              보호하고, 이와 관련한 고충을 원활하게 처리할 수 있도록 다음과 같이
              개인정보처리방침을 수립·공개합니다.
            </p>
          </section>

          <section className={styles.section}>
            <h2>제2조 (수집하는 개인정보 항목 및 수집 방법)</h2>
            <h3>1. 수집하는 개인정보 항목</h3>
            <ul>
              <li><strong>필수 항목</strong>: 이메일 주소, 이름 (Google 로그인 시 제공되는 정보)</li>
              <li><strong>자동 수집 항목</strong>: 서비스 이용 기록, 접속 로그, 쿠키, IP 주소, 기기 정보</li>
              <li><strong>서비스 이용 시 수집</strong>: 업로드한 사진 이미지, AI 생성 이미지</li>
            </ul>
            <h3>2. 수집 방법</h3>
            <ul>
              <li>Google OAuth 2.0 로그인을 통한 자동 수집</li>
              <li>서비스 이용 과정에서 이용자의 자발적 제공</li>
              <li>서비스 이용 과정에서 자동으로 생성·수집</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제3조 (개인정보의 처리 목적)</h2>
            <p>회사는 수집한 개인정보를 다음의 목적으로 처리합니다.</p>
            <ul>
              <li>서비스 이용자 식별 및 인증</li>
              <li>AI 기반 가상 웨딩 이미지 생성 서비스 제공</li>
              <li>생성된 이미지 갤러리 관리 및 다운로드 제공</li>
              <li>서비스 이용 통계 분석 및 개선</li>
              <li>불법·부정 이용 방지</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제4조 (개인정보의 보유 및 이용 기간)</h2>
            <p>
              회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를
              지체 없이 파기합니다. 다만, 관련 법령에 의하여 보존할 필요가 있는 경우
              아래와 같이 관련 법령에 따라 보관합니다.
            </p>
            <ul>
              <li>계약 또는 청약 철회에 관한 기록: 5년 (전자상거래법)</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
            </ul>
            <p>업로드된 사진 및 AI 생성 이미지는 세션 생성일로부터 <strong>90일</strong> 후 자동 삭제됩니다.</p>
          </section>

          <section className={styles.section}>
            <h2>제5조 (개인정보의 제3자 제공)</h2>
            <p>
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만,
              다음의 경우에는 예외로 합니다.
            </p>
            <ul>
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령에 의해 요구되는 경우</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제6조 (개인정보의 처리 위탁)</h2>
            <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>위탁받는 자</th>
                  <th>위탁 업무</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Google Cloud (Google LLC)</td>
                  <td>AI 이미지 생성 (Gemini API)</td>
                </tr>
                <tr>
                  <td>Supabase Inc.</td>
                  <td>데이터 저장 및 인증 서비스</td>
                </tr>
                <tr>
                  <td>Vercel Inc.</td>
                  <td>웹 호스팅 및 서비스 운영</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className={styles.section}>
            <h2>제7조 (이용자 및 법정대리인의 권리·의무)</h2>
            <ul>
              <li>이용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제, 처리 정지를 요청할 수 있습니다.</li>
              <li>요청은 아래 개인정보 보호책임자에게 이메일로 접수할 수 있습니다.</li>
              <li>회사는 요청을 받은 날로부터 10일 이내에 조치 결과를 통보합니다.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제8조 (개인정보의 파기 절차 및 방법)</h2>
            <ul>
              <li><strong>파기 절차</strong>: 이용 목적이 달성된 개인정보는 별도의 DB로 옮겨 내부 방침에 따라 일정 기간 저장 후 파기합니다.</li>
              <li><strong>파기 방법</strong>: 전자적 파일은 복구 불가능한 기술적 방법으로 영구 삭제하며, 종이 문서는 분쇄기로 파쇄합니다.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제9조 (개인정보 보호책임자)</h2>
            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 관련 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className={styles.infoBox}>
              <p><strong>개인정보 보호책임자</strong></p>
              <ul>
                <li>성명: 이경민</li>
                <li>직책: 개인정보보호 책임자</li>
                <li>소속: (주)아키랩</li>
                <li>연락처: privacy@archilab.co.kr</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2>제10조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
            <p>
              회사는 이용자의 서비스 편의를 위해 쿠키(cookie)를 사용합니다.
              이용자는 웹 브라우저 설정을 통해 쿠키의 허용·차단을 설정할 수 있으며,
              쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </section>

          <section className={styles.section}>
            <h2>제11조 (권익 침해 구제 방법)</h2>
            <p>개인정보 침해에 대한 신고·상담은 아래 기관에 문의하실 수 있습니다.</p>
            <ul>
              <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
              <li>대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)</li>
              <li>경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>제12조 (고지 의무)</h2>
            <p>
              본 개인정보처리방침은 2026년 4월 5일부터 적용됩니다. 내용의 추가, 삭제
              및 수정이 있을 경우에는 변경사항의 시행 7일 전부터 공지사항을 통해
              고지할 것입니다.
            </p>
          </section>

          <div className={styles.companyInfo}>
            <p><strong>(주)아키랩</strong></p>
            <p>개인정보 보호책임자: 이경민</p>
          </div>
        </div>
      </main>
    </>
  );
}
