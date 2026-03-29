import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap, Tooltip } from 'react-leaflet';
import { TANZANIA_BOUNDS } from '../constants';
import { Navigation, MapPin, Loader2 } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, name?: string) => void;
  initialPos?: [number, number];
}

async function getAddress(lat: number, lng: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'User-Agent': 'bubbletz-laundry-app'
      }
    });
    const data = await response.json();
    return data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (error) {
    console.error("Geocoding error:", error);
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

/**
 * Fallback geolocation using IP-API (No Google complications)
 */
async function getIpLocation() {
  try {
    const response = await fetch('http://ip-api.com/json');
    const data = await response.json();
    if (data && data.status === 'success') {
      return {
        latitude: data.lat,
        longitude: data.lon
      };
    }
    return null;
  } catch (error) {
    console.error("IP Geolocation error:", error);
    return null;
  }
}

function LocationMarker({ onLocationSelect, initialPos }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(initialPos || null);
  const map = useMap();

  useEffect(() => {
    if (initialPos) {
      setPosition(initialPos);
      map.setView(initialPos, map.getZoom());
    }
  }, [initialPos, map]);

  useEffect(() => {
    const handleFlyTo = (e: any) => {
      const { lat, lng } = e.detail;
      const latlng: [number, number] = [lat, lng];
      setPosition(latlng);
      map.flyTo(latlng, 16);
    };
    window.addEventListener('map-fly-to', handleFlyTo);
    return () => window.removeEventListener('map-fly-to', handleFlyTo);
  }, [map]);
  
  useMapEvents({
    async click(e) {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(latlng);
      map.flyTo(latlng, map.getZoom());
      const name = await getAddress(latlng[0], latlng[1]);
      onLocationSelect(latlng[0], latlng[1], name);
    },
  });

  return position === null ? null : (
    <CircleMarker 
      center={position} 
      radius={10}
      pathOptions={{ 
        fillColor: '#0284c7', 
        color: 'white', 
        weight: 3, 
        fillOpacity: 1 
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} permanent>
        Pickup Location
      </Tooltip>
    </CircleMarker>
  );
}

export default function MapPicker({ onLocationSelect, initialPos }: MapPickerProps) {
  const [locating, setLocating] = useState(false);
  const MapContainerAny = MapContainer as any;
  const TileLayerAny = TileLayer as any;

  const handleAutoDetect = async () => {
    setLocating(true);
    console.log("Starting auto-detect...");
    
    try {
      // 1. Try standard browser/device geolocation
      const status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        await Geolocation.requestPermissions();
      }

      let position;
      try {
        // Try with low accuracy first to avoid hitting Google's high-accuracy positioning (which often causes the 429)
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000
        });
      } catch (geoError: any) {
        console.warn("Standard geolocation failed, trying IP-based fallback...", geoError);
        // 2. Fallback to IP-API to avoid "Google complications" (429 errors)
        const ipLoc = await getIpLocation();
        if (ipLoc) {
          position = { coords: ipLoc };
        } else {
          throw geoError; // Re-throw if even IP fallback fails
        }
      }

      const { latitude, longitude } = position.coords;
      const name = await getAddress(latitude, longitude);
      onLocationSelect(latitude, longitude, name);
      window.dispatchEvent(new CustomEvent('map-fly-to', { detail: { lat: latitude, lng: longitude } }));
    } catch (error: any) {
      console.error("Auto-detect failed:", error);
      alert("Auto-detect failed due to browser limitations. Please tap your location on the map manually.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-3 relative z-0 isolate">
      <div className="relative h-64 w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner group">
        <MapContainerAny 
          center={initialPos || TANZANIA_BOUNDS.center} 
          zoom={TANZANIA_BOUNDS.zoom} 
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
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
