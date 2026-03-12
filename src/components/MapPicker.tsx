import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CHITUNGWIZA_BOUNDS } from '../constants';
import { Navigation, MapPin, Loader2 } from 'lucide-react';

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
  onLocationSelect: (lat: number, lng: number, name?: string) => void;
  initialPos?: [number, number];
}

async function getAddress(lat: number, lng: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error("Geocoding error:", error);
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

function LocationMarker({ onLocationSelect, initialPos }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(initialPos ? L.latLng(initialPos[0], initialPos[1]) : null);
  const map = useMap();

  // Update position when initialPos prop changes (e.g., when profile/address changes)
  useEffect(() => {
    if (initialPos) {
      const latlng = L.latLng(initialPos[0], initialPos[1]);
      setPosition(latlng);
      map.setView(latlng, map.getZoom());
    }
  }, [initialPos, map]);

  // Listen for internal fly-to events (for auto-detect)
  useEffect(() => {
    const handleFlyTo = (e: any) => {
      const { lat, lng } = e.detail;
      const latlng = L.latLng(lat, lng);
      setPosition(latlng);
      map.flyTo(latlng, 16);
    };
    window.addEventListener('map-fly-to', handleFlyTo);
    return () => window.removeEventListener('map-fly-to', handleFlyTo);
  }, [map]);
  
  useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      const name = await getAddress(e.latlng.lat, e.latlng.lng);
      onLocationSelect(e.latlng.lat, e.latlng.lng, name);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ onLocationSelect, initialPos }: MapPickerProps) {
  const [locating, setLocating] = useState(false);
  const MapContainerAny = MapContainer as any;
  const TileLayerAny = TileLayer as any;

  const handleAutoDetect = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Detected location with accuracy: ${accuracy}m`);
        
        const name = await getAddress(latitude, longitude);
        onLocationSelect(latitude, longitude, name);
        
        // Dispatch event for LocationMarker to update its internal state and fly map
        window.dispatchEvent(new CustomEvent('map-fly-to', { detail: { lat: latitude, lng: longitude } }));
        setLocating(false);
      },
      (error) => {
        let msg = "Unable to retrieve your location.";
        if (error.code === 1) msg = "Location permission denied. Please enable location access in your browser settings.";
        else if (error.code === 2) msg = "Location unavailable. Ensure GPS is on and try moving outdoors.";
        else if (error.code === 3) msg = "Location request timed out.";
        
        alert(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative h-64 w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner group">
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
        
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[400] bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-sky-600 dark:text-sky-400 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          title="Auto-detect location"
        >
          {locating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Navigation className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase font-bold tracking-widest px-1">
        <MapPin className="w-3 h-3" />
        Tap map to set precisely or use auto-detect
      </div>
    </div>
  );
}
