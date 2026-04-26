'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import styles from '../styles/Calculator.module.css';

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface RankedStation {
  rank: number;
  lat: number;
  lng: number;
  netSaving: number;
  station: string;
  price: number;
  distance: number;
}

interface Props {
  userLat: number;
  userLng: number;
  rankedStations: RankedStation[];
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 0 2px #3b82f6;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function stationIcon(rank: number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#f59e0b;border:2px solid #fff;color:#000;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${rank}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function StationMap({ userLat, userLng, rankedStations }: Props) {
  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={[userLat, userLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[userLat, userLng]} icon={userIcon}>
          <Popup>Tu ubicación</Popup>
        </Marker>
        {rankedStations.map((s) => (
          <Marker key={s.rank} position={[s.lat, s.lng]} icon={stationIcon(s.rank)}>
            <Popup>
              <strong>{s.station}</strong>
              <br />
              S/ {s.price.toFixed(2)} / galón
              <br />
              {s.distance.toFixed(1)} km
              <br />
              {s.rank === 1
                ? 'Referencia'
                : s.netSaving >= 0
                ? `+S/ ${s.netSaving.toFixed(2)} ahorro neto`
                : `-S/ ${Math.abs(s.netSaving).toFixed(2)} ahorro neto`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
