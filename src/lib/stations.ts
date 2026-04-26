import { chromium } from "playwright-core";
import { put, list, get } from "@vercel/blob";
import type { Station } from "../interfaces/station";
import { LIMA_DISTRICTS } from "../data/districts";

const PRODUCTS = [
  { id: "126", name: "Gasohol Regular" },
  { id: "127", name: "Gasohol Premium" },
  { id: "40", name: "Diesel B5 S-50 UV" },
] as const;

// Column indices from facilito table: [Establecimiento, Dirección, Teléfono, Precio]
const COL = { station: 0, address: 1, price: 3 };

type GeoCache = Record<string, { lat: number; lng: number } | null>;

async function loadGeoCache(): Promise<GeoCache> {
  try {
    const { blobs } = await list({ prefix: "geocache.json" });
    if (!blobs.length) return {};
    const latest = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )[0];
    const result = await get(latest.url, { access: "private" });
    if (!result) return {};
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as GeoCache;
  } catch {
    return {};
  }
}

async function saveGeoCache(cache: GeoCache): Promise<void> {
  await put("geocache.json", JSON.stringify(cache), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function fetchLatLng(
  codigoOSI: string,
  distrito: string,
  producto: string,
): Promise<{ lat: number; lng: number } | null> {
  const url =
    `https://www.facilito.gob.pe/facilito/actions/MapaAction.do` +
    `?departamento=150000&provincia=150100&distrito=${distrito}` +
    `&producto=${producto}&method=mostrarMapa&subtitulocabecera=1` +
    `&tipo=LIQ&codigoOSI=${codigoOSI}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; gasohol-peru/1.0)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Primary: the page embeds a "grifo" JSON object with "latitud" and "longitud"
    // e.g. var grifo = eval ('(' + '{"codigoOsinergmin":"96681","latitud":-11.999,"longitud":-76.837,...}' + ')');
    // Search by codigoOSI to avoid matching the wrong entry in listaPuntos
    const byCode = new RegExp(
      `"codigoOsinergmin"\\s*:\\s*"${codigoOSI}"[^}]*?"latitud"\\s*:\\s*(-?\\d+\\.?\\d*)[^}]*?"longitud"\\s*:\\s*(-?\\d+\\.?\\d*)`,
    );
    const codeMatch = html.match(byCode);
    if (codeMatch) {
      return { lat: parseFloat(codeMatch[1]), lng: parseFloat(codeMatch[2]) };
    }

    return null;
  } catch {
    return null;
  }
}

async function getChromeArgs(): Promise<{ executablePath?: string; args: string[] }> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    return {
      executablePath: await sparticuz.executablePath(),
      args: sparticuz.args,
    };
  }
  return { args: [] };
}

async function scrapeRows(
  page: import("playwright-core").Page,
): Promise<{ cols: string[]; codigoOSI: string | null }[]> {
  return page.evaluate(() => {
    const trs = document.querySelectorAll(
      "#tblPreciosAutomotor tbody tr:not(.dataTables_empty)",
    );
    return Array.from(trs)
      .slice(0, 5)
      .map((r) => {
        const cols = Array.from(r.querySelectorAll("td")).map(
          (c) => c.textContent?.trim() ?? "",
        );
        // codigoOSI is in the tr onclick: javascript:irMapa('96681',0)
        let codigoOSI: string | null = null;
        const onclick = r.getAttribute("onclick") ?? "";
        const osiMatch = onclick.match(/irMapa\s*\(\s*['"]?(\d+)['"]?/);
        if (osiMatch) codigoOSI = osiMatch[1];
        return { cols, codigoOSI };
      });
  });
}

export async function getStations(): Promise<Station[]> {
  const { executablePath, args } = await getChromeArgs();
  const browser = await chromium.launch({ executablePath, headless: true, args });

  const geocache = await loadGeoCache();
  let geocacheUpdated = false;

  try {
    const page = await browser.newPage();

    // 1. Load EESS page and select Lima department
    await page.goto(
      "https://www.facilito.gob.pe/facilito/pages/facilito/buscadorEESS.jsp",
      { waitUntil: "networkidle", timeout: 60_000 },
    );
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 60_000 }),
      page.evaluate(() =>
        (window as unknown as { makeAction: (d: string) => void }).makeAction("150000"),
      ),
    ]);

    // 2. Select Lima province (150100 = Provincia de Lima / Lima Metropolitana)
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 60_000 }),
      page.locator('select[name="provincia"]').selectOption("150100"),
    ]);

    // 3. Scrape each district × fuel type combination
    const collected: Station[] = [];

    for (const district of LIMA_DISTRICTS) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 60_000 }),
        page.locator('select[name="distrito"]').selectOption(district.code),
      ]);

      for (const product of PRODUCTS) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 60_000 }),
          page.locator('select[name="producto"]').selectOption(product.id),
        ]);

        const rows = await scrapeRows(page);

        for (const { cols, codigoOSI } of rows) {
          const price = parseFloat(cols[COL.price]);
          if (isNaN(price) || price <= 0) continue;

          let lat: number | null = null;
          let lng: number | null = null;

          if (codigoOSI) {
            if (codigoOSI in geocache) {
              const cached = geocache[codigoOSI];
              if (cached) { lat = cached.lat; lng = cached.lng; }
            } else {
              const coords = await fetchLatLng(codigoOSI, district.code, product.id);
              geocache[codigoOSI] = coords;
              geocacheUpdated = true;
              if (coords) { lat = coords.lat; lng = coords.lng; }
            }
          }

          console.log(`  [${product.name}] ${cols[COL.station]} → OSI: ${codigoOSI ?? 'none'}, coords: ${lat !== null ? `${lat},${lng}` : 'null'}`);
          collected.push({
            gasohol: product.name,
            station: cols[COL.station],
            address: cols[COL.address],
            district: district.name,
            price,
            lat,
            lng,
          });
        }
      }
      const withCoords = collected.filter(s => s.lat !== null).length;
      console.log(
        `Finished district ${district.name} (${collected.length} total, ${withCoords} with coords)`,
      );
    }

    // Keep the cheapest stations per product type
    const all: Station[] = [];
    for (const product of PRODUCTS) {
      const sorted = collected
        .filter((s) => s.gasohol === product.name)
        .sort((a, b) => a.price - b.price);
      all.push(...sorted);
    }

    return all;
  } finally {
    await browser.close();
    if (geocacheUpdated) {
      await saveGeoCache(geocache);
    }
  }
}
