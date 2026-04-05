'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import StepIndicator from '@/components/layout/StepIndicator';
import styles from './page.module.css';

const VENUE_STYLES = [
  { id: 'garden', name: '가든 웨딩', desc: '야외 정원, 자연광, 꽃 아치', preview: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop', style: 'Outdoor garden wedding with floral arch, natural sunlight, lush greenery, white chairs, warm afternoon light' },
  { id: 'chapel', name: '채플 웨딩', desc: '스테인드글라스, 고전 분위기', preview: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', style: 'Classic chapel wedding with stained glass windows, white marble interior, elegant chandeliers, wooden pews' },
  { id: 'hotel_ballroom', name: '호텔 볼룸', desc: '화려한 샹들리에, 클래식 연회장', preview: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop', style: 'Luxury hotel ballroom wedding with crystal chandeliers, gold accents, white draping, elegant table settings' },
  { id: 'beach', name: '비치 웨딩', desc: '해변 석양, 로맨틱 트로피컬', preview: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400&h=300&fit=crop', style: 'Beach wedding at sunset with white fabric canopy, ocean waves, tropical flowers, barefoot on sand' },
  { id: 'hanok', name: '한옥 웨딩', desc: '전통 한옥, 한국 전통혼례', preview: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&h=300&fit=crop', style: 'Traditional Korean Hanok wedding venue with wooden architecture, paper lanterns, traditional decorations, courtyard ceremony' },
  { id: 'rooftop', name: '루프탑 웨딩', desc: '도심 야경, 시티뷰 루프탑', preview: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=260&fit=crop&crop=top', style: 'Rooftop wedding with city skyline view at twilight, string lights, modern minimalist decoration, urban chic atmosphere' },
];

interface VenueItem {
  id: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hallCount: number | null;
  sido: string | null;
  sigungu: string | null;
}

const SIDO_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
];

function VenueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  // Style selection
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Real venue search
  const [activeTab, setActiveTab] = useState<'style' | 'search'>('style');
  const [sido, setSido] = useState('');
  const [realVenues, setRealVenues] = useState<VenueItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalVenues, setTotalVenues] = useState(0);
  const [selectedVenueDetail, setSelectedVenueDetail] = useState<VenueItem | null>(null);

  if (!sessionId) {
    return (
      <div className={styles.noSession}>
        <p>세션 정보가 없습니다.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>처음으로</button>
      </div>
    );
  }

  const venueData = VENUE_STYLES.find((v) => v.id === selectedStyle);

  const handleGenerate = async () => {
    if (!venueData) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          step: 'venue',
          options: { venueStyle: venueData.style },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이미지 생성 실패');
      setImages((prev) => [...prev, ...data.images]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setGenerating(false);
    }
  };

  const handleSearch = async () => {
    if (!sido) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/venues?sido=${encodeURIComponent(sido)}&size=50`);
      const data = await res.json();
      if (data.success) {
        setRealVenues(data.venues || []);
        setTotalVenues(data.total || 0);
      }
    } catch {
      console.error('Venue search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (sido) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sido]);

  return (
    <div className={styles.content}>
      <StepIndicator currentStep={4} />

      <div className={styles.headerSection}>
        <h1>결혼식장 미리보기</h1>
        <p className={styles.subtitle}>
          꿈꾸던 결혼식장 스타일을 선택하거나, 실제 예식장을 검색해보세요.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'style' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('style')}
        >
          ✨ 스타일 선택
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 실제 예식장 검색
        </button>
      </div>

      {activeTab === 'style' && (
        <>
          {/* Style Grid */}
          <section className={styles.venueSection}>
            <div className={styles.venueGrid}>
              {VENUE_STYLES.map((v) => {
                const isSelected = selectedStyle === v.id;
                return (
                  <button
                    key={v.id}
                    className={`${styles.venueCard} ${isSelected ? styles.venueSelected : ''}`}
                    onClick={() => setSelectedStyle(v.id)}
                  >
                    <div className={styles.venuePreview}>
                      <img src={v.preview} alt={v.name} className={styles.venuePreviewImg} />
                      {isSelected && (
                        <div className={styles.venueSelectedBadge}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      )}
                    </div>
                    <span className={styles.venueName}>{v.name}</span>
                    <span className={styles.venueDesc}>{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className={styles.generateSection}>
            <button
              className="btn btn-primary btn-large"
              onClick={handleGenerate}
              disabled={!selectedStyle || generating}
            >
              {generating ? '✨ AI가 결혼식을 준비하고 있어요...' : '💒 결혼식 시뮬레이션 시작'}
            </button>
            {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
          </div>
        </>
      )}

      {activeTab === 'search' && (
        <section className={styles.searchSection}>
          {/* Filters */}
          <div className={styles.searchFilters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>지역 선택</label>
              <select
                className={styles.filterSelect}
                value={sido}
                onChange={(e) => setSido(e.target.value)}
              >
                <option value="">전체 지역</option>
                {SIDO_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          {searchLoading ? (
            <div className={styles.searchLoading}>
              <span className="loader-ring" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <p>예식장을 검색하고 있어요...</p>
            </div>
          ) : realVenues.length > 0 ? (
            <>
              <p className={styles.resultCount}>총 {totalVenues}개의 예식장</p>
              <div className={styles.venueList}>
                {realVenues.map((v) => (
                  <div
                    key={v.id}
                    className={styles.venueListCard}
                    onClick={() => setSelectedVenueDetail(v)}
                  >
                    <div className={styles.venueListIcon}>🏛️</div>
                    <div className={styles.venueListInfo}>
                      <h4 className={styles.venueListName}>{v.name}</h4>
                      <p className={styles.venueListAddr}>{v.address}</p>
                      <div className={styles.venueListMeta}>
                        {v.phone && <span>📞 {v.phone}</span>}
                        {v.hallCount && <span>🏠 예식홀 {v.hallCount}개</span>}
                      </div>
                    </div>
                    <span className={styles.venueListArrow}>›</span>
                  </div>
                ))}
              </div>
            </>
          ) : sido ? (
            <div className={styles.noResults}>
              <p>😅 해당 지역에 등록된 예식장이 없습니다.</p>
              <p className={styles.noResultsHint}>
                공공데이터 API 키가 설정되지 않았을 수 있습니다.
                <br />
                스타일 선택 탭에서 AI 시뮬레이션을 이용해보세요!
              </p>
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>지역을 선택하면 실제 예식장 정보를 검색합니다.</p>
            </div>
          )}
        </section>
      )}

      {/* Venue Detail Modal */}
      {selectedVenueDetail && (
        <div className={styles.detailOverlay} onClick={() => setSelectedVenueDetail(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.detailClose} onClick={() => setSelectedVenueDetail(null)}>✕</button>
            <div className={styles.detailHeader}>
              <span className={styles.detailEmoji}>🏛️</span>
              <h3>{selectedVenueDetail.name}</h3>
            </div>
            <div className={styles.detailBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>📍 주소</span>
                <span>{selectedVenueDetail.address || '정보 없음'}</span>
              </div>
              {selectedVenueDetail.phone && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>📞 전화번호</span>
                  <a href={`tel:${selectedVenueDetail.phone}`} className={styles.detailLink}>
                    {selectedVenueDetail.phone}
                  </a>
                </div>
              )}
              {selectedVenueDetail.hallCount && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>🏠 예식홀 수</span>
                  <span>{selectedVenueDetail.hallCount}개</span>
                </div>
              )}
              {selectedVenueDetail.lat && selectedVenueDetail.lng && (
                <div className={styles.detailMapLink}>
                  <a
                    href={`https://www.google.com/maps?q=${selectedVenueDetail.lat},${selectedVenueDetail.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-small"
                  >
                    🗺️ Google Maps에서 보기
                  </a>
                  <a
                    href={`https://map.naver.com/?lng=${selectedVenueDetail.lng}&lat=${selectedVenueDetail.lat}&title=${encodeURIComponent(selectedVenueDetail.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-small"
                  >
                    🗺️ 네이버 지도에서 보기
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated Images */}
      {images.length > 0 && (
        <section className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>📸 가상 결혼식 장면</h3>
          <div className={styles.gallery}>
            {images.map((url, i) => (
              <div key={i} className={styles.imageCard}>
                <img src={url} alt={`결혼식 ${i + 1}`} className={styles.generatedImage} />
              </div>
            ))}
          </div>

          <div className={styles.nextSection}>
            <p className={styles.nextHint}>아름다운 결혼식이에요! 이제 신혼여행을 떠나볼까요? 🌴</p>
            <button
              className="btn btn-primary btn-large"
              onClick={() => router.push(`/honeymoon?session=${sessionId}`)}
            >
              다음: 신혼여행 갤러리 →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function VenuePage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <Suspense fallback={<div className={styles.loading}><span className="loader-ring" /></div>}>
            <VenueContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
