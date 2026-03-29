import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Capacitor } from '@capacitor/core';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRICING = {
  NORMAL: {
    REGULAR: 10000,
    SATURDAY: 7500,
  },
  BLANKET: {
    REGULAR: 15000,
    SATURDAY: 11250,
  }
};

export const TANZANIA_BOUNDS = {
  center: [-6.7924, 39.2083] as [number, number],
  zoom: 12
};

export function isPromotionDay() {
  const day = new Date().getDay();
  return day === 6 || day === 0; // Saturday (6) or Sunday (0)
}

const defaultApiUrl = Capacitor.isNativePlatform() ? 'https://bubblestz.vercel.app' : 'http://localhost:3000';
export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

export function getApiUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function calculatePrice(weight: number, blankets: number) {
  const isPromo = isPromotionDay();
  
  // Weights: 
  // Normal clothes: 10,000 TSh
  // Blankets: 15,000 TSh
  // Weekend discount (Sat/Sun): 25%
  // Weight-based discount: 2% for each 10kg (0.98 multiplier per 10kg)
  
  const clothesRate = isPromo ? PRICING.NORMAL.SATURDAY : PRICING.NORMAL.REGULAR;
  const blanketRate = isPromo ? PRICING.BLANKET.SATURDAY : PRICING.BLANKET.REGULAR;
  
  const basePrice = (weight * clothesRate) + (blankets * blanketRate);
  
  // Additional weight discount: 2% for each 10kg
  const weightDiscountMultiplier = 1 - (Math.floor(weight / 10) * 0.02);
  
  const finalPrice = basePrice * weightDiscountMultiplier;
  
  return Math.round(finalPrice);
}

