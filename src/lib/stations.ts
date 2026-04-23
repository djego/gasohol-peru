import { chromium } from "playwright-core";
import type { Station } from "../interfaces/station";
import { LIMA_DISTRICTS } from "../data/districts";

const PRODUCTS = [
  { id: "126", name: "Gasohol Regular" },
  { id: "127", name: "Gasohol Premium" },
  { id: "40", name: "Diesel B5 S-50 UV" },
] as const;

// Column indices from facilito table: [Establecimiento, Dirección, Teléfono, Precio]
const COL = { station: 0, address: 1, price: 3 };

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

async function scrapeRows(page: import("playwright-core").Page): Promise<string[][]> {
  return page.evaluate(() => {
    const trs = document.querySelectorAll(
      "#tblPreciosAutomotor tbody tr:not(.dataTables_empty)",
    );
    return Array.from(trs)
      .slice(0, 5)
      .map((r) =>
        Array.from(r.querySelectorAll("td")).map((c) => c.textContent?.trim() ?? ""),
      );
  });
}

export async function getStations(): Promise<Station[]> {
  const { executablePath, args } = await getChromeArgs();

  const browser = await chromium.launch({ executablePath, headless: true, args });

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

        for (const cols of rows) {
          const price = parseFloat(cols[COL.price]);
          if (!isNaN(price) && price > 0) {
            collected.push({
              gasohol: product.name,
              station: cols[COL.station],
              address: cols[COL.address],
              district: district.name,
              price,
              lat: null,
              lng: null,
            });
          }
        }
      }
      console.log(
        `Finished district ${district.name} (${collected.length} stations collected so far)`,
      );
    }

    // Keep the 10 cheapest stations per product type
    const all: Station[] = [];
    for (const product of PRODUCTS) {
      const top10 = collected
        .filter((s) => s.gasohol === product.name)
        .sort((a, b) => a.price - b.price);
      all.push(...top10);
    }

    return all;
  } finally {
    await browser.close();
  }
}
