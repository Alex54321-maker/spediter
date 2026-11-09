import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const STATIONS = {
  hub: [48.6836, 8.9831],
  Mercaden: [48.6845, 9.0094],
  Kaufland: [48.6912, 9.0205],
  Diezenhalde: [48.6657, 9.0195]
};

const truckIcon = L.divIcon({
  html: '<span style="font-size: 26px; display: block; transform: scaleX(-1); line-height: 1;">🚛</span>',
  className: 'custom-truck-icon',
  iconSize:[30, 30],
  iconAnchor: [15, 15]
});

const createStationIcon = (emoji) => L.divIcon({
  html: `<div style="font-size: 18px; background: #1e293b; padding: 4px; border-radius: 50%; border: 2px solid #06b6d4; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${emoji}</div>`,
  className: 'station-icon',
  iconSize:[32, 32],
  iconAnchor: [16, 16]
});

export default function MapComponent({ truckPos, routeCoords }) {
  const center = [48.682, 9.005];

  return (
    <div className="w-full h-full min-h-[320px] rounded-xl overflow-hidden border border-slate-700 shadow-xl">
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
/>

        {routeCoords && routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="#22d3ee" weight={4} opacity={0.8} dashArray="5, 10" />
        )}
        <Marker position={STATIONS.hub} icon={createStationIcon('🏢')}>
          <Popup>Zentrallager (Hulb)</Popup>
        </Marker>
        <Marker position={STATIONS.Mercaden} icon={createStationIcon('🛒')}>
          <Popup>Mercaden Shopping</Popup>
        </Marker>
        <Marker position={STATIONS.Kaufland} icon={createStationIcon('📦')}>
          <Popup>Kaufland</Popup>
        </Marker>
        <Marker position={STATIONS.Diezenhalde} icon={createStationIcon('🏠')}>
          <Popup>Diezenhalde</Popup>
        </Marker>
        <Marker position={truckPos} icon={truckIcon} />
      </MapContainer>
    </div>
  );
}
