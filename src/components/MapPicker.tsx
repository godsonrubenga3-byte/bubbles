import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CHITUNGWIZA_BOUNDS } from '../constants';

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
  onLocationSelect: (lat: number, lng: number) => void;
  initialPos?: [number, number];
}

function LocationMarker({ onLocationSelect, initialPos }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(initialPos ? L.latLng(initialPos[0], initialPos[1]) : null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ onLocationSelect, initialPos }: MapPickerProps) {
  const MapContainerAny = MapContainer as any;
  const TileLayerAny = TileLayer as any;

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-zinc-200 shadow-inner">
      <MapContainerAny 
        center={initialPos || CHITUNGWIZA_BOUNDS.center} 
        zoom={CHITUNGWIZA_BOUNDS.zoom} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayerAny
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} initialPos={initialPos} />
      </MapContainerAny>
    </div>
  );
}
