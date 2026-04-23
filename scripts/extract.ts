import { getStations } from '../src/lib/stations';
import { saveStations } from '../src/lib/blob';

async function main() {
  console.log('Starting extraction...');
  const stations = await getStations();
  console.log(`Scraped ${stations.length} stations. Saving to Blob...`);
  const url = await saveStations(stations);
  console.log(`Done. Saved to: ${url}`);
  console.log('Stations by type:');
  const byType = stations.reduce<Record<string, number>>((acc, s) => {
    acc[s.gasohol] = (acc[s.gasohol] ?? 0) + 1;
    return acc;
  }, {});
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
