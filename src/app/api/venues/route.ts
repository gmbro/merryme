import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchVenuesFromPublicAPI } from '@/lib/publicdata/venues';

/**
 * GET /api/venues
 * Query params: sido, sigungu, page, size, refresh
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sido = searchParams.get('sido') || '';
    const sigungu = searchParams.get('sigungu') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);
    const refresh = searchParams.get('refresh') === 'true';

    const supabase = createServiceClient();

    // Check if cache exists
    const { count: cacheCount } = await supabase
      .from('venue_cache')
      .select('*', { count: 'exact', head: true });

    // If no cache or requested refresh, fetch from public API
    if ((cacheCount === null || cacheCount === 0) || refresh) {
      try {
        console.log('Fetching venues from public API...');
        const { items } = await fetchVenuesFromPublicAPI({ numOfRows: 1000 });

        if (items.length > 0) {
          // Clear old cache
          await supabase.from('venue_cache').delete().neq('id', 0);

          // Insert new data
          const rows = items.map((item) => ({
            business_name: item.bizplcNm || '알 수 없음',
            road_address: item.rdnmadr || null,
            jibun_address: item.lnmadr || null,
            latitude: item.latitude ? parseFloat(item.latitude) : null,
            longitude: item.longitude ? parseFloat(item.longitude) : null,
            phone: item.telno || null,
            hall_count: item.wdhlCo ? parseInt(item.wdhlCo, 10) : null,
            representative: item.rprsntvNm || null,
            sido: item.ctprvnNm || null,
            sigungu: item.signguNm || null,
            is_operating: item.operSttus !== 'N',
            cached_at: new Date().toISOString(),
          }));

          // Insert in batches of 100
          for (let i = 0; i < rows.length; i += 100) {
            const batch = rows.slice(i, i + 100);
            await supabase.from('venue_cache').insert(batch);
          }

          console.log(`Cached ${rows.length} venues`);
        }
      } catch (apiErr) {
        console.error('Public API fetch failed (will use existing cache):', apiErr);
        // Fall through to use existing cache if any
      }
    }

    // Query from cache with filters
    let query = supabase
      .from('venue_cache')
      .select('*', { count: 'exact' })
      .eq('is_operating', true);

    if (sido) {
      query = query.eq('sido', sido);
    }
    if (sigungu) {
      query = query.eq('sigungu', sigungu);
    }

    // Pagination
    const from = (page - 1) * size;
    const to = from + size - 1;
    query = query.range(from, to).order('business_name');

    const { data: venues, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      total: count || 0,
      page,
      size,
      venues: (venues || []).map((v) => ({
        id: v.id,
        name: v.business_name,
        address: v.road_address || v.jibun_address || '',
        lat: v.latitude,
        lng: v.longitude,
        phone: v.phone,
        hallCount: v.hall_count,
        sido: v.sido,
        sigungu: v.sigungu,
      })),
    });
  } catch (error) {
    console.error('Venues API error:', error);

    // Fallback: return empty if DB tables don't exist yet
    if (error instanceof Error && error.message?.includes('relation')) {
      return NextResponse.json({
        success: true,
        total: 0,
        page: 1,
        size: 20,
        venues: [],
        notice: 'DB 테이블이 아직 생성되지 않았습니다. supabase-migration.sql을 실행해주세요.',
      });
    }

    return NextResponse.json(
      { error: '예식장 데이터 조회 실패', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
