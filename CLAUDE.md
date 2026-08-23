# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (eslint-config-next / core-web-vitals)
npm run extract  # Manually run the price scraper + geocoder and save to Blob (loads .env)
```

No test suite exists.

## Environment

`BLOB_READ_WRITE_TOKEN` — required for reading/writing Vercel Blob (`@vercel/blob`). Normally auto-provisioned by Vercel when Blob storage is linked to the project; needed in `.env` for local `npm run extract` or hitting `/api/extraction` locally.

## Architecture

**Stack**: Next.js 15 (App Router), React 19, TypeScript strict, Playwright (`playwright-core` + `@sparticuz/chromium` for serverless), Vercel Blob, Leaflet/`react-leaflet`, CSS Modules. Path alias `@/*` → `./src/*` (used in newer files; some older files still use relative `../` imports).

**Data flow** — the app does *not* fetch live prices per request. Instead, data is scraped ahead of time and cached in Vercel Blob:

1. `src/lib/stations.ts` (`getStations`) drives `facilito.gob.pe`'s official EESS price-search UI with Playwright: selects Lima → each of 52 districts → each of 3 fuel products, and scrapes the results table. It also geocodes each station via `fetchLatLng()`, which calls `facilito.gob.pe`'s map endpoint and regex-parses lat/lng out of the response; results are cached in a separate `geocache.json` blob so geocoding only runs once per station.
2. `src/lib/blob.ts` (`saveStations`/`loadStations`) persists the scraped list as a **private** Blob object (`stations.json`); geocode results are cached the same way.
3. `src/app/api/extraction/route.ts` exposes `POST` (manual trigger) and `GET` (cron target — cron only supports GET) to run the scrape and save to Blob. **No cron is currently configured** (`vercel.json` is `{}`) — data only refreshes via a manual hit to this route or `npm run extract`, despite the homepage copy claiming a daily 8am refresh. Confirm with the user before relying on that claim or re-adding a cron schedule.
4. `src/app/page.tsx` and `src/app/calculadora/page.tsx` are async Server Components that read the cached list via `loadStations()` — they never call the scraper directly. Keep it this way: an earlier version called the scraper from a page component and Playwright timed out during `next build`'s static prerender.
5. `src/app/api/list/route.ts` exposes the same cached data as JSON (`GET`, grouped by fuel type).

**Pages**:
- `/` (`src/app/page.tsx`) — `src/components/list.tsx` (`ListStation`) filters stations by district (`selectedDistrict` state, options from `src/data/districts.ts`; empty = all Lima), groups by fuel type, and renders the top 10 cheapest per category. Clicking a row opens Google Maps for that address.
- `/calculadora` (`src/app/calculadora/page.tsx`) — `src/components/calculator.tsx` is a client component: takes fuel type, km/gallon, and amount (soles or gallons), optionally uses browser geolocation, computes haversine distance to every geocoded station, and ranks by net saving (fuel cost saved vs. extra gas burned driving there). Results link to Google Maps/Waze and render on a Leaflet map (`src/components/StationMap.tsx`, dynamically imported with `ssr: false`).

**Fuel types covered**: Gasohol Regular, Gasohol Premium, Diesel B5 S-50 UV (`Station.gasohol` in `src/interfaces/station.ts`, which also carries `district`, `lat`/`lng`).
