import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TANZANIA_BOUNDS } from '../constants';
import { Navigation, MapPin, Loader2 } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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
    // Adding User-Agent as required by OpenStreetMap Nominatim Usage Policy
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
 * Fallback geolocation using IP API (HTTPS Safe)
 */
async function getIpLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data && !data.error) {
      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    }
    return null;
  } catch (error) {
    console.error("IP Geolocation error:", error);
    return null;
  }
}

function LocationMarker({ onLocationSelect, initialPos }: MapPickerProps) {
  // CRITICAL: Prevent starting at [0,0] (Null Island)
  const hasValidPos = initialPos && initialPos[0] !== 0 && initialPos[1] !== 0;
  const [position, setPosition] = useState<L.LatLng | null>(hasValidPos ? L.latLng(initialPos[0], initialPos[1]) : null);
  const map = useMap();

  // Update position when initialPos prop changes
  useEffect(() => {
    if (initialPos && initialPos[0] !== 0) {
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
      map.flyTo(latlng, 17);
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

  const startPos = (initialPos && initialPos[0] !== 0) ? initialPos : TANZANIA_BOUNDS.center;

  const handleAutoDetect = async () => {
    setLocating(true);
    console.log("Starting tiered auto-detect...");
    
    try {
      // 1. Handle Native Permissions (Fixed for Vercel/Web compatibility)
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            throw new Error("Permission denied");
          }
        }
      }

      let lat: number = 0;
      let lng: number = 0;
      let isEstimate = false;

      // 2. Try High Accuracy (GPS)
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (e) {
        console.warn("High accuracy failed, trying standard...");
        // 3. Try Standard Accuracy
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (e2) {
          console.warn("Standard accuracy failed, trying IP fallback...");
          // 4. IP fallback (Final attempt)
          const ipLoc = await getIpLocation();
          if (ipLoc) {
            lat = ipLoc.latitude;
            lng = ipLoc.longitude;
            isEstimate = true;
          } else {
            throw new Error("All location methods failed");
          }
        }
      }

      // Verification
      if (lat === 0 || lng === 0) throw new Error("Invalid coordinates");
      
      const name = await getAddress(lat, lng);
      onLocationSelect(lat, lng, isEstimate ? `(Approx) ${name}` : name);
      window.dispatchEvent(new CustomEvent('map-fly-to', { detail: { lat, lng } }));

      if (isEstimate) {
        alert("Using approximate location. Please move the pin to your exact pickup spot!");
      }

    } catch (error: any) {
      console.error("Geolocation error:", error);
      let msg = "Unable to retrieve your location. Please tap the map manually.";
      if (error.message?.includes("denied")) msg = "Location permission denied. Please enable location access in settings.";
      
      alert(msg);
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-3 relative z-0 isolate">
      <div className="relative h-64 w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner group">
        <MapContainerAny 
          center={startPos} 
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
