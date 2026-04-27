const CUBIC_METERS_PER_MILLION_GALLONS = 3785.411784;
const FEET_PER_METER = 3.280839895;

export function metersToFeet(meters: number): number {
  return meters * FEET_PER_METER;
}

export function feetToMeters(feet: number): number {
  return feet / FEET_PER_METER;
}

export function cubicMetersPerDayToMgd(cubicMetersPerDay: number): number {
  return cubicMetersPerDay / CUBIC_METERS_PER_MILLION_GALLONS;
}

export function mgdToCubicMetersPerDay(mgd: number): number {
  return mgd * CUBIC_METERS_PER_MILLION_GALLONS;
}

export function millimetersPerYearToMetersPerDay(millimetersPerYear: number): number {
  return millimetersPerYear / 1000 / 365.25;
}

export function metersPerDayToMillimetersPerYear(metersPerDay: number): number {
  return metersPerDay * 1000 * 365.25;
}
