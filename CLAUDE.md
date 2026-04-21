# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (eslint-config-next / core-web-vitals)
```

No test suite exists.

## Environment

Requires `NEXT_PUBLIC_API_URI` — the base URL of the backend REST API (e.g. `https://api.example.com`).

## Architecture

**Stack**: Next.js 12 (Pages Router), React 17, TypeScript strict, axios, CSS Modules.

**Data flow**:
1. `src/pages/index.tsx` fetches data server-side via `getInitialProps`
2. `src/api/rest.ts` calls `GET $NEXT_PUBLIC_API_URI/v1/stations-current` with axios
3. Response is mapped to the `Station` interface (`src/interfaces/station.ts`)
4. `src/components/list.tsx` (`ListStation`) groups stations by fuel type and renders the top 10 cheapest per category

**UI behaviour**: clicking a station row opens Google Maps for that address; fuel-type anchors in the nav link to each section.

**Fuel types covered**: Gasohol 84, 90, 95, 97, 98, Diesel 50.
