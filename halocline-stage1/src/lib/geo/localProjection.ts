import type { LngLat } from "../data/biscayneReferenceLayers.ts";

export type GeographicBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type LocalProjection = {
  bounds: GeographicBounds;
  referenceLatitudeDegrees: number;
  metersPerDegreeLongitude: number;
  metersPerDegreeLatitude: number;
};

const metersPerDegreeLatitude = 111_320;

export function createLocalProjection(bounds: GeographicBounds): LocalProjection {
  const referenceLatitudeDegrees = (bounds.south + bounds.north) / 2;

  return {
    bounds,
    referenceLatitudeDegrees,
    metersPerDegreeLatitude,
    metersPerDegreeLongitude:
      metersPerDegreeLatitude * Math.cos((referenceLatitudeDegrees * Math.PI) / 180),
  };
}

export function lngLatToLocalMeters(
  coordinate: LngLat,
  projection: LocalProjection,
): { xMeters: number; yMeters: number } {
  const [longitude, latitude] = coordinate;

  return {
    xMeters: (longitude - projection.bounds.west) * projection.metersPerDegreeLongitude,
    yMeters: (latitude - projection.bounds.south) * projection.metersPerDegreeLatitude,
  };
}

export function localMetersToLngLat(
  point: { xMeters: number; yMeters: number },
  projection: LocalProjection,
): LngLat {
  return [
    projection.bounds.west + point.xMeters / projection.metersPerDegreeLongitude,
    projection.bounds.south + point.yMeters / projection.metersPerDegreeLatitude,
  ];
}
