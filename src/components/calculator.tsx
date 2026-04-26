'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Station } from '../interfaces/station';
import type { RankedStation } from './StationMap';
import styles from '../styles/Calculator.module.css';

const StationMap = dynamic(() => import('./StationMap'), { ssr: false });

type FuelType = 'Gasohol Regular' | 'Gasohol Premium' | 'Diesel B5 S-50 UV';
type Unit = 'soles' | 'galones';

interface Props {
  stations: Station[];
}

interface RankedResult {
  station: Station;
  rank: number;
  distance: number;
  gallons: number;
  fuelCostExtra: number;
  netSaving: number;
  isNearest: boolean;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcResults(
  stations: Station[],
  fuelType: FuelType,
  kmPerGallon: number,
  amount: number,
  unit: Unit,
  userLat: number,
  userLng: number,
): { ranked: RankedResult[]; excluded: number } {
  const eligible = stations.filter(
    (s) => s.gasohol === fuelType && s.lat !== null && s.lng !== null,
  ) as (Station & { lat: number; lng: number })[];

  const excluded =
    stations.filter((s) => s.gasohol === fuelType).length - eligible.length;

  if (!eligible.length) return { ranked: [], excluded };

  const withDist = eligible.map((s) => ({
    s,
    dist: haversine(userLat, userLng, s.lat, s.lng),
  }));

  withDist.sort((a, b) => a.dist - b.dist);
  const nearestDist = withDist[0].dist;
  const nearestStation = withDist[0].s;

  const ranked: RankedResult[] = withDist.map(({ s, dist }, i) => {
    const extraKm = dist - nearestDist;
    const gallons = unit === 'soles' ? amount / s.price : amount;
    const fuelCostExtra = (extraKm / kmPerGallon) * s.price;
    const savingsOnFuel = (nearestStation.price - s.price) * gallons;
    const netSaving = savingsOnFuel - fuelCostExtra;

    return {
      station: s,
      rank: i + 1,
      distance: dist,
      gallons,
      fuelCostExtra,
      netSaving,
      isNearest: i === 0,
    };
  });

  ranked.sort((a, b) => b.netSaving - a.netSaving);
  ranked.forEach((r, i) => { r.rank = i + 1; });

  return { ranked, excluded };
}

export function Calculator({ stations }: Props) {
  const [fuelType, setFuelType] = useState<FuelType>('Gasohol Regular');
  const [kmPerGallon, setKmPerGallon] = useState<string>('40');
  const [unit, setUnit] = useState<Unit>('soles');
  const [amount, setAmount] = useState<string>('50');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [showMap, setShowMap] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
    );
  }, []);

  const kmNum = parseFloat(kmPerGallon);
  const amountNum = parseFloat(amount);
  const ready =
    locationStatus === 'granted' &&
    userLat !== null &&
    userLng !== null &&
    !isNaN(kmNum) &&
    kmNum > 0 &&
    !isNaN(amountNum) &&
    amountNum > 0;

  const { ranked, excluded } = ready
    ? calcResults(stations, fuelType, kmNum, amountNum, unit, userLat!, userLng!)
    : { ranked: [], excluded: 0 };

  const mapStations: RankedStation[] = ranked
    .filter((r) => r.station.lat !== null && r.station.lng !== null)
    .map((r) => ({
      rank: r.rank,
      lat: r.station.lat as number,
      lng: r.station.lng as number,
      netSaving: r.netSaving,
      station: r.station.station,
      price: r.station.price,
      distance: r.distance,
    }));

  return (
    <div className={styles.calcPage}>
      <div className={styles.calcHeader}>
        <Link href="/" className={styles.backLink}>← Volver</Link>
        <h1 className={styles.calcTitle}>Calculadora de grifo</h1>
      </div>

      <div className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="fuel-select">Combustible</label>
            <select
              id="fuel-select"
              className={styles.select}
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
            >
              <option value="Gasohol Regular">Gasohol Regular</option>
              <option value="Gasohol Premium">Gasohol Premium</option>
              <option value="Diesel B5 S-50 UV">Diesel B5 S-50 UV</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.label} htmlFor="rendimiento-input">Rendimiento (km/galón)</label>
            <input
              id="rendimiento-input"
              type="number"
              className={styles.input}
              value={kmPerGallon}
              min="1"
              step="1"
              onChange={(e) => setKmPerGallon(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.label}>Unidad y cantidad</label>
            <div className={styles.toggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${unit === 'soles' ? styles.toggleBtnActive : ''}`}
                onClick={() => setUnit('soles')}
              >
                Soles
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${unit === 'galones' ? styles.toggleBtnActive : ''}`}
                onClick={() => setUnit('galones')}
              >
                Galones
              </button>
            </div>
            <input
              type="number"
              className={styles.input}
              value={amount}
              min="0.01"
              step="0.01"
              placeholder={unit === 'soles' ? 'S/ ej. 50' : 'Galones ej. 5'}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Ubicación</label>
            <button
              type="button"
              className={`${styles.locationBtn} ${locationStatus === 'granted' ? styles.locationBtnGranted : ''}`}
              onClick={requestLocation}
              disabled={locationStatus === 'loading'}
            >
              {locationStatus === 'loading'
                ? 'Obteniendo...'
                : locationStatus === 'granted'
                ? '✓ Ubicación obtenida'
                : locationStatus === 'denied'
                ? '✗ Acceso denegado — reintentar'
                : 'Usar mi ubicación'}
            </button>
          </div>
        </div>
      </div>

      {ready && ranked.length === 0 && (
        <p className={styles.emptyState}>No hay grifos con coordenadas para este combustible.</p>
      )}

      {ready && ranked.length > 0 && (
        <>
          {excluded > 0 && (
            <p className={styles.excludedNote}>
              {excluded} grifo{excluded !== 1 ? 's' : ''} sin coordenadas {excluded !== 1 ? 'fueron excluidos' : 'fue excluido'} del cálculo.
            </p>
          )}

          <div className={styles.results}>
            {ranked.map((r) => (
              <div key={r.station.address + r.rank} className={styles.resultCard}>
                <div className={styles.resultCardHeader}>
                  <span className={styles.rankBadge}>#{r.rank}</span>
                  <div className={styles.stationInfo}>
                    <div className={styles.stationName}>{r.station.station}</div>
                    <div className={styles.stationAddress}>{r.station.address}</div>
                    <div className={styles.stationDistrict}>{r.station.district}</div>
                  </div>
                </div>

                <div className={styles.statGrid}>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Precio</div>
                    <div className={styles.statValue}>S/ {r.station.price.toFixed(2)} / galón</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Distancia</div>
                    <div className={styles.statValue}>{r.distance.toFixed(1)} km (línea recta)</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Galones que recibes</div>
                    <div className={styles.statValue}>{r.gallons.toFixed(2)}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Costo extra de llegar</div>
                    <div className={styles.statValue}>
                      {r.isNearest ? 'Es el más cercano' : `S/ ${r.fuelCostExtra.toFixed(2)} más que el más cercano`}
                    </div>
                  </div>
                </div>

                <div className={styles.netSaving}>
                  {r.isNearest ? (
                    <span className={styles.netSavingNearest}>Referencia</span>
                  ) : r.netSaving > 0 ? (
                    <span className={styles.netSavingPositive}>+S/ {r.netSaving.toFixed(2)} ahorro neto</span>
                  ) : (
                    <span className={styles.netSavingNegative}>-S/ {Math.abs(r.netSaving).toFixed(2)} ahorro neto</span>
                  )}
                </div>

                <div className={styles.navBtns}>
                  {r.station.lat !== null && r.station.lng !== null && (
                    <>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${r.station.lat},${r.station.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navBtn}
                      >
                        Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?ll=${r.station.lat},${r.station.lng}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navBtn}
                      >
                        Waze
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.mapToggleBtn}
            onClick={() => setShowMap((v) => !v)}
          >
            {showMap ? 'Ocultar mapa' : 'Ver mapa'}
          </button>

          {showMap && userLat !== null && userLng !== null && (
            <StationMap
              userLat={userLat}
              userLng={userLng}
              rankedStations={mapStations}
            />
          )}
        </>
      )}

      {!ready && locationStatus !== 'granted' && (
        <p className={styles.emptyState}>
          Ingresa tus datos y permite el acceso a tu ubicación para ver los resultados.
        </p>
      )}
    </div>
  );
}
