'use client';

import { useState } from 'react';
import { Station } from '../interfaces/station';
import { LIMA_DISTRICTS } from '../data/districts';
import styles from '../styles/Home.module.css';

interface Props {
  stations: Station[];
}

const SORTED_DISTRICTS = [...LIMA_DISTRICTS].sort((a, b) =>
  a.name.localeCompare(b.name, 'es')
);

export const ListStation = ({ stations }: Props) => {
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const filtered = selectedDistrict
    ? stations.filter(s => s.district === selectedDistrict)
    : stations;

  const station_grouped: Record<string, Station[]> = filtered.reduce((r: Record<string, Station[]>, a) => {
    r[a.gasohol] = [...(r[a.gasohol] || []), a];
    return r;
  }, {});

  function openMaps(text: string) {
    window.open('https://www.google.com/maps/search/?api=1&query=' + text, '_blank');
  }

  return (
    <>
      <div className={styles.filter}>
        <label htmlFor="district-select">Filtrar por distrito:</label>
        <select
          id="district-select"
          value={selectedDistrict}
          onChange={e => setSelectedDistrict(e.target.value)}
        >
          <option value="">Toda Lima</option>
          {SORTED_DISTRICTS.map(d => (
            <option key={d.code} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.grid}>
        {Object.keys(station_grouped).map((key, index) =>
          <div className={styles.grid_item} key={index}>
            <h2 id={key}>⛽ {key}</h2>
            <div className={styles.group}>
              {station_grouped[key].slice(0, 10).map((station: Station, pos: number) =>
                <div key={station.address + pos} onClick={() => openMaps(station.address)} className={styles.card}>
                  <span className={styles.position}>{"#" + (pos + 1)}</span>
                  <h3>S/. {station.price}</h3>
                  <p>Empresa: {station.station}</p>
                  <p>Dirección: {station.address}</p>
                  <p><b>{station.district}</b></p>
                  <span>🗺️</span>
                </div>
              )}
              {station_grouped[key].length === 0 && (
                <p className={styles.empty}>Sin estaciones en este distrito.</p>
              )}
            </div>
          </div>
        )}
        {Object.keys(station_grouped).length === 0 && (
          <p className={styles.empty}>Sin datos para este distrito.</p>
        )}
      </div>
    </>
  );
};