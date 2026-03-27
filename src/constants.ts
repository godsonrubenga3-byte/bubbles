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

export const DAR_ES_SALAAM_BOUNDS = {
  center: [-6.7924, 39.2083] as [number, number],
  zoom: 12
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
