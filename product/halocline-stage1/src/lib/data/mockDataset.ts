import type { Canal, Domain, Grid, GridCell, Stage1Dataset, Well } from "../model/types.ts";
import { mgdToCubicMetersPerDay, millimetersPerYearToMetersPerDay } from "../units/conversions.ts";

const cellSizeMeters = 1000;
const rowCount = 5;
const colCount = 7;

function cellId(row: number, col: number): string {
  return `r${row}-c${col}`;
}

function createMockCells(): GridCell[] {
  const rechargeMetersPerDay = millimetersPerYearToMetersPerDay(1300);

  return Array.from({ length: rowCount * colCount }, (_, index) => {
    const row = Math.floor(index / colCount);
    const col = index % colCount;
    const isCoastalBoundary = col === colCount - 1;
    const isCanalBoundary = col === 2 && row >= 1 && row <= 3;

    return {
      id: cellId(row, col),
      row,
      col,
      xCenterMeters: col * cellSizeMeters + cellSizeMeters / 2,
      yCenterMeters: row * cellSizeMeters + cellSizeMeters / 2,
      active: true,
      aquiferBaseDepthMeters: 60,
      hydraulicConductivityMetersPerDay: col >= 3 ? 70 : 45,
      rechargeMetersPerDay,
      pumpingCubicMetersPerDay: 0,
      fixedHeadMeters: isCoastalBoundary ? 0 : isCanalBoundary ? 0.55 : undefined,
      isCoastalBoundary,
      isCanalBoundary,
    };
  });
}

export const mockDomain: Domain = {
  id: "mock-biscayne-domain",
  name: "Mock Biscayne Training Domain",
  boundingBox: {
    minXMeters: 0,
    minYMeters: 0,
    maxXMeters: colCount * cellSizeMeters,
    maxYMeters: rowCount * cellSizeMeters,
  },
  coastlineCellIds: Array.from({ length: rowCount }, (_, row) => cellId(row, colCount - 1)),
  inlandBoundaryCellIds: Array.from({ length: rowCount }, (_, row) => cellId(row, 0)),
};

export const mockGrid: Grid = {
  id: "mock-grid-5x7",
  name: "Mock 5 x 7 finite-difference grid",
  rowCount,
  colCount,
  cellSizeMeters,
  originXMeters: 0,
  originYMeters: 0,
  cells: createMockCells(),
};

export const mockWells: Well[] = [
  {
    id: "well-a1",
    name: "Well A1",
    wellfieldId: "wellfield-a",
    location: { xMeters: 1500, yMeters: 1500 },
    gridCellId: cellId(1, 1),
    screenBottomDepthMeters: 18,
    baselinePumpingCubicMetersPerDay: mgdToCubicMetersPerDay(0.45),
    currentPumpingCubicMetersPerDay: mgdToCubicMetersPerDay(0.45),
  },
  {
    id: "well-a2",
    name: "Well A2",
    wellfieldId: "wellfield-a",
    location: { xMeters: 2500, yMeters: 2500 },
    gridCellId: cellId(2, 2),
    screenBottomDepthMeters: 22,
    baselinePumpingCubicMetersPerDay: mgdToCubicMetersPerDay(0.55),
    currentPumpingCubicMetersPerDay: mgdToCubicMetersPerDay(0.55),
  },
  {
    id: "well-b1",
    name: "Well B1",
    wellfieldId: "wellfield-b",
    location: { xMeters: 4500, yMeters: 3500 },
    gridCellId: cellId(3, 4),
    screenBottomDepthMeters: 25,
    baselinePumpingCubicMetersPerDay: mgdToCubicMetersPerDay(0.35),
    currentPumpingCubicMetersPerDay: mgdToCubicMetersPerDay(0.35),
  },
];

export const mockCanals: Canal[] = [
  {
    id: "canal-primary",
    name: "Mock Inland Canal",
    centerline: [
      { xMeters: 2500, yMeters: 1000 },
      { xMeters: 2500, yMeters: 4000 },
    ],
    baselineStageMeters: 0.55,
    currentStageMeters: 0.55,
    fixedHeadCellIds: [cellId(1, 2), cellId(2, 2), cellId(3, 2)],
  },
];

export const mockStage1Dataset: Stage1Dataset = {
  domain: mockDomain,
  grid: mockGrid,
  wells: mockWells,
  canals: mockCanals,
};
