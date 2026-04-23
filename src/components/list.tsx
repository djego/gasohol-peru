'use client';

import { useState } from 'react';
import { Station } from '../interfaces/station';
import { LIMA_DISTRICTS } from '../data/districts';
import styles from '../styles/Home.module.css';

interface Props {
  stations: Station[];
}

type FuelKey = 'Gasohol Regular' | 'Gasohol Premium' | 'Diesel B5 S-50 UV';

const FUEL_STYLE: Record<FuelKey, { card: string; price: string; dot: string }> = {
  'Gasohol Regular': { card: styles.cardAmber, price: styles.priceAmber, dot: styles.dotAmber },
  'Gasohol Premium': { card: styles.cardBlue,  price: styles.priceBlue,  dot: styles.dotBlue  },
  'Diesel B5 S-50 UV': { card: styles.cardGreen, price: styles.priceGreen, dot: styles.dotGreen },
};

const SORTED_DISTRICTS = [...LIMA_DISTRICTS].sort((a, b) =>
  a.name.localeCompare(b.name, 'es')
);

function MapIcon() {
  return (
    <svg
      className={styles.mapIcon}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export const ListStation = ({ stations }: Props) => {
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const filtered = selectedDistrict
    ? stations.filter(s => s.district === selectedDistrict)
    : stations;

  const station_grouped: Record<string, Station[]> = filtered.reduce(
    (r: Record<string, Station[]>, a) => {
      r[a.gasohol] = [...(r[a.gasohol] || []), a];
      return r;
    },
    {}
  );

  function openMaps(address: string) {
    window.open(
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address + ', Lima, Peru'),
      '_blank'
    );
  }

  return (
    <>
      <div className={styles.filter}>
        <label htmlFor="district-select" className={styles.filterLabel}>Distrito</label>
        <select
          id="district-select"
          className={styles.filterSelect}
          value={selectedDistrict}
          onChange={e => setSelectedDistrict(e.target.value)}
        >
          <option value="">Toda Lima</option>
          {SORTED_DISTRICTS.map(d => (
            <option key={d.code} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {Object.keys(station_grouped).length === 0 ? (
        <p className={styles.empty}>Sin estaciones para este distrito.</p>
      ) : (
        Object.keys(station_grouped).map((fuelType) => {
          const fuel = FUEL_STYLE[fuelType as FuelKey] ?? { card: '', price: '', dot: '' };
          const items = station_grouped[fuelType].slice(0, 10);

          return (
            <section key={fuelType} className={styles.section}>
              <h2 id={fuelType} className={styles.sectionTitle}>
                <span className={`${styles.dot} ${fuel.dot}`} />
                {fuelType}
              </h2>
              <div className={styles.grid}>
                {items.map((station, pos) => (
                  <div
                    key={station.address + pos}
                    className={`${styles.card} ${fuel.card}`}
                    onClick={() => openMaps(station.address)}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.pos}>#{pos + 1}</span>
                      <MapIcon />
                    </div>
                    <div className={`${styles.price} ${fuel.price}`}>
                      <span className={styles.priceCurrency}>S/</span>
                      {station.price.toFixed(2)}
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.metaStation}>{station.station}</span>
                      <span className={styles.metaAddress}>{station.address}</span>
                      <span className={styles.metaDistrict}>{station.district}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
};
