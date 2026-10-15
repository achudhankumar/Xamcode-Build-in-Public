import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/constants';
import { DEMO_ITEMS, filterRoadmapItems, fetchRoadmapItems, type RoadmapItem } from '@/lib/db/roadmap/roadmap-route';

export interface RoadmapApiResponse {
  items: RoadmapItem[];
  demo_mode: boolean;
  error?: string;
  page?: number;
  page_count?: number;
  page_size?: number;
  total?: number;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status') ?? 'all';
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('page_size') ?? '20');

  if (!isSupabaseConfigured) {
    const filtered = filterRoadmapItems(DEMO_ITEMS, status, search);
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const start = (safePage - 1) * safePageSize;
    const pageItems = filtered.slice(start, start + safePageSize);
    const pageCount = Math.max(1, Math.ceil(filtered.length / safePageSize));

    return NextResponse.json<RoadmapApiResponse>(
      {
        items: pageItems,
        demo_mode: true,
        page: safePage,
        page_count: pageCount,
        page_size: safePageSize,
        total: filtered.length,
      },
      {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }

  try {
    const items = await fetchRoadmapItems({ status, search });
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const start = (safePage - 1) * safePageSize;
    const pageItems = items.slice(start, start + safePageSize);
    const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));

    return NextResponse.json<RoadmapApiResponse>(
      {
        items: pageItems,
        demo_mode: false,
        page: safePage,
        page_count: pageCount,
        page_size: safePageSize,
        total: items.length,
      },
      {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    console.error('Roadmap API error:', error);
    return NextResponse.json<RoadmapApiResponse>(
      {
        items: [],
        demo_mode: false,
        error: 'Failed to load roadmap items.',
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }
}
