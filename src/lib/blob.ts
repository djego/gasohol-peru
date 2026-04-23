import { put, list, get } from "@vercel/blob";
import type { Station } from "../interfaces/station";

const BLOB_KEY = "stations.json";

export interface BlobPayload {
  extractedAt: string;
  stations: Station[];
}

export async function saveStations(stations: Station[]): Promise<string> {
  const payload: BlobPayload = {
    extractedAt: new Date().toISOString(),
    stations,
  };
  const { url } = await put(BLOB_KEY, JSON.stringify(payload), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return url;
}

export async function loadStations(): Promise<BlobPayload | null> {
  const { blobs } = await list({ prefix: BLOB_KEY });
  if (!blobs.length) return null;

  // Take the most recently uploaded in case of duplicates
  const latest = blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )[0];

  const result = await get(latest.url, { access: "private" });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as BlobPayload;
}
