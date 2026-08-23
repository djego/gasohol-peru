import type { Metadata } from 'next';
import { loadStations } from '../../lib/blob';
import { Calculator } from '../../components/calculator';

export const metadata: Metadata = {
  title: 'Calculadora de grifo',
};

export const dynamic = 'force-dynamic';

export default async function CalculadoraPage() {
  const payload = await loadStations();
  const stations = payload?.stations ?? [];

  return <Calculator stations={stations} />;
}
