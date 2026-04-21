import { NextResponse } from 'next/server';
import { getStations } from '@/lib/stations';
import { saveStations } from '@/lib/blob';

async function extract() {
  const stations = await getStations();
  await saveStations(stations);
  return NextResponse.json({
    success: true,
    extractedAt: new Date().toISOString(),
    totalStations: stations.length,
  });
}

// POST: manual trigger via API
export async function POST() {
  try {
    return await extract();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Scraping failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

// GET: called by Vercel Cron (cron jobs only support GET)
export async function GET() {
  try {
    return await extract();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Scraping failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
