import { biscayneStage1Dataset } from "../data/biscayneStage1Dataset.ts";
import type { CoordinateMeters, Stage1Dataset } from "../model/types.ts";

export type MapPoint = {
  x: number;
  y: number;
};

export type MapShellCell = {
  id: string;
  row: number;
  col: number;
  polygon: MapPoint[];
  active: boolean;
  isCoastalBoundary: boolean;
  isCanalBoundary: boolean;
};

export type MapShellCanal = {
  id: string;
  name: string;
  polyline: MapPoint[];
};

export type MapShellWell = {
  id: string;
  name: string;
  wellfieldId: string;
  gridCellId: string;
  point: MapPoint;
};

export type MapShellViewModel = {
  domain: {
    id: string;
    name: string;
    boundsMeters: {
      minXMeters: number;
      minYMeters: number;
      maxXMeters: number;
      maxYMeters: number;
    };
    polygon: MapPoint[];
    coastline: MapPoint[];
  };
  grid: {
    rowCount: number;
    colCount: number;
    cells: MapShellCell[];
  };
  canals: MapShellCanal[];
  wells: MapShellWell[];
  layers: Array<{
    id: string;
    label: string;
    enabled: boolean;
    available: boolean;
  }>;
};

function projectPoint(point: CoordinateMeters, dataset: Stage1Dataset): MapPoint {
  const { boundingBox } = dataset.domain;
  const widthMeters = boundingBox.maxXMeters - boundingBox.minXMeters;
  const heightMeters = boundingBox.maxYMeters - boundingBox.minYMeters;

  return {
    x: ((point.xMeters - boundingBox.minXMeters) / widthMeters) * 100,
    y: 100 - ((point.yMeters - boundingBox.minYMeters) / heightMeters) * 100,
  };
}

function pointString(points: MapPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function mapPointsToSvgPoints(points: MapPoint[]): string {
  return pointString(points);
}

export function buildMapShellViewModel(dataset: Stage1Dataset = biscayneStage1Dataset): MapShellViewModel {
  const { boundingBox } = dataset.domain;
  const domainPolygon = [
    { xMeters: boundingBox.minXMeters, yMeters: boundingBox.minYMeters },
    { xMeters: boundingBox.maxXMeters, yMeters: boundingBox.minYMeters },
    { xMeters: boundingBox.maxXMeters, yMeters: boundingBox.maxYMeters },
    { xMeters: boundingBox.minXMeters, yMeters: boundingBox.maxYMeters },
  ].map((point) => projectPoint(point, dataset));
  const coastline = [
    { xMeters: boundingBox.maxXMeters, yMeters: boundingBox.minYMeters },
    { xMeters: boundingBox.maxXMeters, yMeters: boundingBox.maxYMeters },
  ].map((point) => projectPoint(point, dataset));
  const halfCellSizeMeters = dataset.grid.cellSizeMeters / 2;

  return {
    domain: {
      id: dataset.domain.id,
      name: dataset.domain.name,
      boundsMeters: { ...boundingBox },
      polygon: domainPolygon,
      coastline,
    },
    grid: {
      rowCount: dataset.grid.rowCount,
      colCount: dataset.grid.colCount,
      cells: dataset.grid.cells.map((cell) => ({
        id: cell.id,
        row: cell.row,
        col: cell.col,
        active: cell.active,
        isCoastalBoundary: cell.isCoastalBoundary,
        isCanalBoundary: cell.isCanalBoundary,
        polygon: [
          {
            xMeters: cell.xCenterMeters - halfCellSizeMeters,
            yMeters: cell.yCenterMeters - halfCellSizeMeters,
          },
          {
            xMeters: cell.xCenterMeters + halfCellSizeMeters,
            yMeters: cell.yCenterMeters - halfCellSizeMeters,
          },
          {
            xMeters: cell.xCenterMeters + halfCellSizeMeters,
            yMeters: cell.yCenterMeters + halfCellSizeMeters,
          },
          {
            xMeters: cell.xCenterMeters - halfCellSizeMeters,
            yMeters: cell.yCenterMeters + halfCellSizeMeters,
          },
        ].map((point) => projectPoint(point, dataset)),
      })),
    },
    canals: dataset.canals.map((canal) => ({
      id: canal.id,
      name: canal.name,
      polyline: canal.centerline.map((point) => projectPoint(point, dataset)),
    })),
    wells: dataset.wells.map((well) => ({
      id: well.id,
      name: well.name,
      wellfieldId: well.wellfieldId,
      gridCellId: well.gridCellId,
      point: projectPoint(well.location, dataset),
    })),
    layers: [
      { id: "domain", label: "Domain", enabled: true, available: true },
      { id: "canals", label: "Model canals", enabled: true, available: true },
      { id: "wells", label: "Wells", enabled: true, available: true },
      { id: "head", label: "Head", enabled: false, available: false },
      { id: "interface", label: "Interface", enabled: false, available: false },
      { id: "risk", label: "Risk", enabled: false, available: false },
    ],
  };
}
