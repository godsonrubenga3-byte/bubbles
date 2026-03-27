import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DAR_ES_SALAAM_BOUNDS } from '../constants';

// Use CDN for leaflet icons to avoid bundling issues
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  initialPos?: [number, number];
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    type: 'order' | 'shop';
  }>;
}

function LocationMarker({ onLocationSelect, initialPos }: { onLocationSelect?: (lat: number, lng: number) => void, initialPos?: [number, number] }) {
  const [position, setPosition] = useState<L.LatLng | null>(initialPos ? L.latLng(initialPos[0], initialPos[1]) : null);
  
  const map = useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ onLocationSelect, initialPos, markers = [] }: MapPickerProps) {
  const MapContainerAny = MapContainer as any;
  const TileLayerAny = TileLayer as any;

  const shopIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'hue-rotate-[120deg]' // Green for shops
  });

  const orderIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'hue-rotate-[240deg]' // Blue for orders
  });

  const MarkerAny = Marker as any;

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-zinc-200 shadow-inner">
      <MapContainerAny 
        center={initialPos || DAR_ES_SALAAM_BOUNDS.center} 
        zoom={DAR_ES_SALAAM_BOUNDS.zoom} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayerAny
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} initialPos={initialPos} />}
        {markers.map(m => (
          <MarkerAny 
            key={m.id} 
            position={[m.lat, m.lng]} 
            icon={m.type === 'shop' ? shopIcon : orderIcon}
          >
            {/* Tooltip or Popup could be added here */}
          </MarkerAny>
        ))}
      </MapContainerAny>
    </div>
  );
}
