import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

export const CHITUNGWIZA_BOUNDS = {
  center: [-18.0127, 31.0797] as [number, number],
  zoom: 13
};

export function isSaturday() {
  return new Date().getDay() === 6;
}

export function calculatePrice(weight: number, blankets: number) {
  const saturday = isSaturday();
  const clothesRate = saturday ? PRICING.NORMAL.SATURDAY : PRICING.NORMAL.REGULAR;
  const blanketRate = saturday ? PRICING.BLANKET.SATURDAY : PRICING.BLANKET.REGULAR;
  
  return (weight * clothesRate) + (blankets * blanketRate);
}
