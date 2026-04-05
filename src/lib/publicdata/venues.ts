/**
 * 공공데이터포털 — 전국 결혼식장 및 예식장 표준데이터 API
 */

const API_BASE = 'http://api.data.go.kr/openapi/tn_pubr_public_wedding_and_ceremony_hall_api';

export interface PublicVenueItem {
  bizplcNm: string;         // 사업장명
  ctprvnNm: string;         // 시도명
  signguNm: string;         // 시군구명
  rdnmadr: string;          // 소재지도로명주소
  lnmadr: string;           // 소재지지번주소
  latitude: string;         // 위도
  longitude: string;        // 경도
  rprsntvNm: string;        // 대표자명
  telno: string;            // 전화번호
  wdhlCo: string;           // 예식홀수
  totEmplyCo: string;       // 총직원수
  operSttus: string;        // 운영여부
}

export interface PublicVenueResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
      type: string;
    };
    body: {
      items: PublicVenueItem[];
      totalCount: string;
      numOfRows: string;
      pageNo: string;
    };
  };
}

export async function fetchVenuesFromPublicAPI(params: {
  pageNo?: number;
  numOfRows?: number;
}): Promise<{ items: PublicVenueItem[]; totalCount: number }> {
  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('PUBLIC_DATA_API_KEY가 설정되지 않았습니다.');
  }

  const queryParams = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: String(params.pageNo || 1),
    numOfRows: String(params.numOfRows || 100),
    type: 'json',
  });

  const url = `${API_BASE}?${queryParams.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`공공데이터 API 오류: ${res.status}`);
  }

  const data: PublicVenueResponse = await res.json();

  if (data.response?.header?.resultCode !== '00') {
    throw new Error(`API 오류: ${data.response?.header?.resultMsg}`);
  }

  return {
    items: data.response.body.items || [],
    totalCount: parseInt(data.response.body.totalCount || '0', 10),
  };
}
