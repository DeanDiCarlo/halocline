import {
  biscayneReferenceBounds,
  biscayneReferenceLayers,
  type LngLat,
  type LngLatLine,
} from "./biscayneReferenceLayers.ts";
import { createLocalProjection, lngLatToLocalMeters, localMetersToLngLat } from "../geo/localProjection.ts";
import type { BoundingBoxMeters, Canal, Grid, GridCell, Stage1Dataset, Well } from "../model/types.ts";
import { mgdToCubicMetersPerDay, millimetersPerYearToMetersPerDay } from "../units/conversions.ts";

export const biscayneStage1CellSizeMeters = 2000;
export const biscayneStage1CanalStageMeters = 0.55;
export const biscayneStage1CanalRasterDistanceMeters = 1000;
export const biscayneStage1AquiferBaseDepthMeters = 60;

export const biscayneStage1KZones = [
  {
    id: "western-inland",
    label: "Western inland provisional K zone",
    minLongitude: -Infinity,
    maxLongitude: -80.4,
    hydraulicConductivityMetersPerDay: 500,
  },
  {
    id: "central-miami-dade",
    label: "Central Miami-Dade provisional K zone",
    minLongitude: -80.4,
    maxLongitude: -80.25,
    hydraulicConductivityMetersPerDay: 1200,
  },
  {
    id: "coastal-biscayne",
    label: "Coastal Biscayne provisional K zone",
    minLongitude: -80.25,
    maxLongitude: Infinity,
    hydraulicConductivityMetersPerDay: 2500,
  },
] as const;

export const biscayneStage1Assumptions = [
  "Sprint 7B uses the Sprint 7A reference domain polygon as the first model boundary.",
  "Interface depths are capped at a provisional 60 m aquifer-base guardrail; this is not calibrated bedrock.",
  "Hydraulic conductivity zones are simplified west/central/coastal bands and are not calibrated.",
  "Wellfield points are semi-real placeholders for scenario interaction, not public production-well records.",
  "SFWMD reference canals are rasterized into simplified fixed-head cells with provisional 0.55 m canal stages.",
];

type PointMeters = { xMeters: number; yMeters: number };

const projection = createLocalProjection(biscayneReferenceBounds);
const rechargeMetersPerDay = millimetersPerYearToMetersPerDay(1300);

function domainRing(): LngLatLine {
  const geometry = biscayneReferenceLayers.domain.data.features[0]?.geometry;
  if (geometry?.type !== "Polygon") {
    throw new Error("Biscayne reference domain must be a Polygon feature.");
  }

  return geometry.coordinates[0] ?? [];
}

function pointInPolygon(point: PointMeters, polygon: PointMeters[]): boolean {
  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const currentPoint = polygon[current]!;
    const previousPoint = polygon[previous]!;
    const intersects =
      currentPoint.yMeters > point.yMeters !== previousPoint.yMeters > point.yMeters &&
      point.xMeters <
        ((previousPoint.xMeters - currentPoint.xMeters) *
          (point.yMeters - currentPoint.yMeters)) /
          (previousPoint.yMeters - currentPoint.yMeters) +
          currentPoint.xMeters;

    if (intersects) inside = !inside;
  }

  return inside;
}

function cellId(row: number, col: number): string {
  return `r${row}-c${col}`;
}

function hydraulicConductivityFor(longitude: number): number {
  const zone = biscayneStage1KZones.find(
    (candidate) => longitude >= candidate.minLongitude && longitude < candidate.maxLongitude,
  );

  return zone?.hydraulicConductivityMetersPerDay ?? 1200;
}

function createCells(params: {
  rowCount: number;
  colCount: number;
  domainPolygonMeters: PointMeters[];
}): GridCell[] {
  const cells: GridCell[] = [];

  for (let row = 0; row < params.rowCount; row += 1) {
    for (let col = 0; col < params.colCount; col += 1) {
      const xCenterMeters = col * biscayneStage1CellSizeMeters + biscayneStage1CellSizeMeters / 2;
      const yCenterMeters = row * biscayneStage1CellSizeMeters + biscayneStage1CellSizeMeters / 2;
      const lngLat = localMetersToLngLat({ xMeters: xCenterMeters, yMeters: yCenterMeters }, projection);
      const active = pointInPolygon({ xMeters: xCenterMeters, yMeters: yCenterMeters }, params.domainPolygonMeters);

      cells.push({
        id: cellId(row, col),
        row,
        col,
        xCenterMeters,
        yCenterMeters,
        active,
        aquiferBaseDepthMeters: active ? biscayneStage1AquiferBaseDepthMeters : undefined,
        hydraulicConductivityMetersPerDay: hydraulicConductivityFor(lngLat[0]),
        rechargeMetersPerDay,
        pumpingCubicMetersPerDay: 0,
        isCoastalBoundary: false,
        isCanalBoundary: false,
      });
    }
  }

  return cells;
}

function applyCoastalBoundaries(cells: GridCell[]): string[] {
  const coastalCellIds: string[] = [];
  const activeRows = new Map<number, GridCell[]>();

  for (const cell of cells) {
    if (!cell.active) continue;
    activeRows.set(cell.row, [...(activeRows.get(cell.row) ?? []), cell]);
  }

  for (const rowCells of activeRows.values()) {
    const coastalCell = [...rowCells].sort((a, b) => b.col - a.col)[0];
    if (!coastalCell) continue;

    coastalCell.isCoastalBoundary = true;
    coastalCell.fixedHeadMeters = 0;
    coastalCellIds.push(coastalCell.id);
  }

  return coastalCellIds;
}

function inlandBoundaryIds(cells: GridCell[]): string[] {
  const inlandCellIds: string[] = [];
  const activeRows = new Map<number, GridCell[]>();

  for (const cell of cells) {
    if (!cell.active) continue;
    activeRows.set(cell.row, [...(activeRows.get(cell.row) ?? []), cell]);
  }

  for (const rowCells of activeRows.values()) {
    const inlandCell = [...rowCells].sort((a, b) => a.col - b.col)[0];
    if (inlandCell) inlandCellIds.push(inlandCell.id);
  }

  return inlandCellIds;
}

function squaredDistance(pointA: PointMeters, pointB: PointMeters): number {
  return (pointA.xMeters - pointB.xMeters) ** 2 + (pointA.yMeters - pointB.yMeters) ** 2;
}

function distancePointToSegmentMeters(point: PointMeters, start: PointMeters, end: PointMeters): number {
  const dx = end.xMeters - start.xMeters;
  const dy = end.yMeters - start.yMeters;
  const segmentLengthSquared = dx ** 2 + dy ** 2;

  if (segmentLengthSquared === 0) {
    return Math.sqrt(squaredDistance(point, start));
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.xMeters - start.xMeters) * dx + (point.yMeters - start.yMeters) * dy) /
        segmentLengthSquared,
    ),
  );
  const projectionPoint = {
    xMeters: start.xMeters + t * dx,
    yMeters: start.yMeters + t * dy,
  };

  return Math.sqrt(squaredDistance(point, projectionPoint));
}

function distancePointToPolylineMeters(point: PointMeters, polyline: PointMeters[]): number {
  if (polyline.length === 0) return Number.POSITIVE_INFINITY;
  if (polyline.length === 1) return Math.sqrt(squaredDistance(point, polyline[0]!));

  let minDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < polyline.length; index += 1) {
    minDistance = Math.min(
      minDistance,
      distancePointToSegmentMeters(point, polyline[index - 1]!, polyline[index]!),
    );
  }

  return minDistance;
}

function nearestActiveCellId(
  cells: GridCell[],
  location: PointMeters,
  predicate: (cell: GridCell) => boolean = (cell) => cell.active,
): string {
  const nearestCell = cells
    .filter(predicate)
    .sort((a, b) => {
      const pointA = { xMeters: a.xCenterMeters, yMeters: a.yCenterMeters };
      const pointB = { xMeters: b.xCenterMeters, yMeters: b.yCenterMeters };
      return squaredDistance(pointA, location) - squaredDistance(pointB, location);
    })[0];

  if (!nearestCell) {
    throw new Error("Biscayne Stage 1 dataset requires at least one active cell.");
  }

  return nearestCell.id;
}

function nearestActiveNonCoastalCellIdToPolyline(cells: GridCell[], polyline: PointMeters[]): string {
  const nearestCell = cells
    .filter((cell) => cell.active && !cell.isCoastalBoundary)
    .sort((a, b) => {
      const pointA = { xMeters: a.xCenterMeters, yMeters: a.yCenterMeters };
      const pointB = { xMeters: b.xCenterMeters, yMeters: b.yCenterMeters };
      return distancePointToPolylineMeters(pointA, polyline) - distancePointToPolylineMeters(pointB, polyline);
    })[0];

  if (!nearestCell) {
    throw new Error("Biscayne Stage 1 canal rasterization requires an active non-coastal cell.");
  }

  return nearestCell.id;
}

function lineStringsFromCanalFeature(
  feature: (typeof biscayneReferenceLayers.canals.data.features)[number],
): LngLatLine[] {
  if (feature.geometry.type === "LineString") {
    return [feature.geometry.coordinates];
  }

  if (feature.geometry.type === "MultiLineString") {
    return feature.geometry.coordinates;
  }

  return [];
}

function createCanals(cells: GridCell[]): Canal[] {
  return biscayneReferenceLayers.canals.data.features.map((feature, index) => {
    const lineStrings = lineStringsFromCanalFeature(feature);
    const centerline = lineStrings.flatMap((lineString) =>
      lineString.map((coordinate) => lngLatToLocalMeters(coordinate, projection)),
    );
    const fixedHeadCellIds = new Set<string>();

    for (const cell of cells) {
      if (!cell.active || cell.isCoastalBoundary) continue;

      const cellPoint = { xMeters: cell.xCenterMeters, yMeters: cell.yCenterMeters };
      const distanceMeters = Math.min(
        ...lineStrings.map((lineString) =>
          distancePointToPolylineMeters(
            cellPoint,
            lineString.map((coordinate) => lngLatToLocalMeters(coordinate, projection)),
          ),
        ),
      );

      if (distanceMeters <= biscayneStage1CanalRasterDistanceMeters) {
        fixedHeadCellIds.add(cell.id);
      }
    }

    if (fixedHeadCellIds.size === 0 && centerline.length > 0) {
      fixedHeadCellIds.add(nearestActiveNonCoastalCellIdToPolyline(cells, centerline));
    }

    const sortedFixedHeadCellIds = [...fixedHeadCellIds].sort((cellIdA, cellIdB) => {
      const cellA = cells.find((cell) => cell.id === cellIdA);
      const cellB = cells.find((cell) => cell.id === cellIdB);
      if (!cellA || !cellB) return cellIdA.localeCompare(cellIdB);
      return cellA.row - cellB.row || cellA.col - cellB.col;
    });

    for (const cellId of sortedFixedHeadCellIds) {
      const cell = cells.find((candidate) => candidate.id === cellId);
      if (!cell || cell.isCoastalBoundary) continue;
      cell.isCanalBoundary = true;
      cell.fixedHeadMeters = biscayneStage1CanalStageMeters;
    }

    const featureId = String(feature.properties.id ?? `reference-canal-${index + 1}`);
    const canalName = String(feature.properties.name ?? featureId);
    const canalAlias = feature.properties.alias === null ? null : String(feature.properties.alias);

    return {
      id: featureId,
      name: canalAlias ? `${canalName} (${canalAlias})` : canalName,
      centerline,
      baselineStageMeters: biscayneStage1CanalStageMeters,
      currentStageMeters: biscayneStage1CanalStageMeters,
      fixedHeadCellIds: sortedFixedHeadCellIds,
    };
  });
}

function createWell(params: {
  id: string;
  name: string;
  wellfieldId: string;
  lngLat: LngLat;
  screenBottomDepthMeters: number;
  baselinePumpingMgd: number;
  cells: GridCell[];
}): Well {
  const location = lngLatToLocalMeters(params.lngLat, projection);
  const gridCellId = nearestActiveCellId(
    params.cells,
    location,
    (cell) => cell.active && !cell.isCoastalBoundary && !cell.isCanalBoundary,
  );

  return {
    id: params.id,
    name: params.name,
    wellfieldId: params.wellfieldId,
    location,
    gridCellId,
    screenBottomDepthMeters: params.screenBottomDepthMeters,
    baselinePumpingCubicMetersPerDay: mgdToCubicMetersPerDay(params.baselinePumpingMgd),
    currentPumpingCubicMetersPerDay: mgdToCubicMetersPerDay(params.baselinePumpingMgd),
  };
}

function buildBiscayneStage1Dataset(): Stage1Dataset {
  const boundsMeters = {
    minXMeters: 0,
    minYMeters: 0,
    maxXMeters:
      (biscayneReferenceBounds.east - biscayneReferenceBounds.west) *
      projection.metersPerDegreeLongitude,
    maxYMeters:
      (biscayneReferenceBounds.north - biscayneReferenceBounds.south) *
      projection.metersPerDegreeLatitude,
  } satisfies BoundingBoxMeters;
  const colCount = Math.ceil(boundsMeters.maxXMeters / biscayneStage1CellSizeMeters);
  const rowCount = Math.ceil(boundsMeters.maxYMeters / biscayneStage1CellSizeMeters);
  const boundingBox = {
    ...boundsMeters,
    maxXMeters: colCount * biscayneStage1CellSizeMeters,
    maxYMeters: rowCount * biscayneStage1CellSizeMeters,
  };
  const domainPolygonMeters = domainRing().map((coordinate) =>
    lngLatToLocalMeters(coordinate, projection),
  );
  const cells = createCells({ rowCount, colCount, domainPolygonMeters });
  const coastlineCellIds = applyCoastalBoundaries(cells);
  const canals = createCanals(cells);

  const grid: Grid = {
    id: "biscayne-grid-2km-v1",
    name: "Biscayne real-domain 2 km Stage 1 grid",
    rowCount,
    colCount,
    cellSizeMeters: biscayneStage1CellSizeMeters,
    originXMeters: 0,
    originYMeters: 0,
    cells,
  };
  const wells: Well[] = [
    createWell({
      id: "north-dade-placeholder",
      name: "North Dade placeholder wellfield",
      wellfieldId: "north-dade-placeholder",
      lngLat: [-80.255, 25.91],
      screenBottomDepthMeters: 24,
      baselinePumpingMgd: 0.65,
      cells,
    }),
    createWell({
      id: "central-dade-placeholder",
      name: "Central Dade placeholder wellfield",
      wellfieldId: "central-dade-placeholder",
      lngLat: [-80.33, 25.72],
      screenBottomDepthMeters: 22,
      baselinePumpingMgd: 0.75,
      cells,
    }),
    createWell({
      id: "south-dade-placeholder",
      name: "South Dade placeholder wellfield",
      wellfieldId: "south-dade-placeholder",
      lngLat: [-80.405, 25.55],
      screenBottomDepthMeters: 20,
      baselinePumpingMgd: 0.55,
      cells,
    }),
  ];

  return {
    domain: {
      id: "biscayne-stage1-domain",
      name: "Biscayne Stage 1 Real-Domain Grid",
      boundingBox,
      coastlineCellIds,
      inlandBoundaryCellIds: inlandBoundaryIds(cells),
    },
    grid,
    wells,
    canals,
  };
}

export const biscayneStage1Dataset = buildBiscayneStage1Dataset();
