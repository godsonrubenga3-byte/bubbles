import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Capacitor } from '@capacitor/core';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRICING = {
  NORMAL: {
    REGULAR: 2.5,
    SATURDAY: 1.5
  },
  BLANKET: {
    REGULAR: 5.0,
    SATURDAY: 4.0
  }
};

export const TANZANIA_BOUNDS = {
  center: [-6.7924, 39.2083] as [number, number],
  zoom: 12
};

export function isSaturday() {
  return new Date().getDay() === 6;
}

const defaultApiUrl = Capacitor.isNativePlatform() ? 'https://bubblestz.vercel.app' : 'http://localhost:3000';
export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

export function getApiUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function calculatePrice(weight: number, blankets: number) {
  const saturday = isSaturday();
  const clothesRate = saturday ? PRICING.NORMAL.SATURDAY : PRICING.NORMAL.REGULAR;
  const blanketRate = saturday ? PRICING.BLANKET.SATURDAY : PRICING.BLANKET.REGULAR;
  
  return (weight * clothesRate) + (blankets * blanketRate);
}
