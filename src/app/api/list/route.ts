import { NextResponse } from 'next/server';
import { loadStations } from '@/lib/blob';
import type { Station } from '@/interfaces/station';

const FUEL_ORDER = ['Gasohol Regular', 'Gasohol Premium', 'Diesel B5 S-50 UV'] as const;

export async function GET() {
  const payload = await loadStations();

  if (!payload) {
    return NextResponse.json(
      { error: 'No data available. Run POST /api/extraction first.' },
      { status: 404 },
    );
  }

  const { extractedAt, stations } = payload;

  const data = FUEL_ORDER.map((type) => ({
    type,
    stations: (stations as Station[])
      .filter((s) => s.gasohol === type)
      .map((s, i) => ({
        position: i + 1,
        station: s.station,
        address: s.address,
        price: s.price,
        lat: s.lat,
        lng: s.lng,
      })),
  }));

  return NextResponse.json({ extractedAt, data });
}
