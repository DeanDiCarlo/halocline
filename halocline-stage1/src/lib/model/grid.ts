import type { Grid, GridCell } from "./types.ts";

export type CreateGridParams = {
  id: string;
  name: string;
  rowCount: number;
  colCount: number;
  cellSizeMeters: number;
  originXMeters?: number;
  originYMeters?: number;
  createCell?: (baseCell: GridCell) => Partial<GridCell>;
};

export type GridIndex = {
  byId: Map<string, GridCell>;
  byRowCol: Map<string, GridCell>;
};

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function createGrid(params: CreateGridParams): Grid {
  const originXMeters = params.originXMeters ?? 0;
  const originYMeters = params.originYMeters ?? 0;
  const cells: GridCell[] = [];

  for (let row = 0; row < params.rowCount; row += 1) {
    for (let col = 0; col < params.colCount; col += 1) {
      const baseCell: GridCell = {
        id: `r${row}-c${col}`,
        row,
        col,
        xCenterMeters: originXMeters + col * params.cellSizeMeters + params.cellSizeMeters / 2,
        yCenterMeters: originYMeters + row * params.cellSizeMeters + params.cellSizeMeters / 2,
        active: true,
        hydraulicConductivityMetersPerDay: 50,
        rechargeMetersPerDay: 0,
        pumpingCubicMetersPerDay: 0,
        isCoastalBoundary: false,
        isCanalBoundary: false,
      };

      cells.push({
        ...baseCell,
        ...(params.createCell?.(baseCell) ?? {}),
      });
    }
  }

  return {
    id: params.id,
    name: params.name,
    rowCount: params.rowCount,
    colCount: params.colCount,
    cellSizeMeters: params.cellSizeMeters,
    originXMeters,
    originYMeters,
    cells,
  };
}

export function createGridIndex(grid: Grid): GridIndex {
  const byId = new Map<string, GridCell>();
  const byRowCol = new Map<string, GridCell>();

  for (const cell of grid.cells) {
    byId.set(cell.id, cell);
    byRowCol.set(cellKey(cell.row, cell.col), cell);
  }

  return { byId, byRowCol };
}

export function getCellAt(gridIndex: GridIndex, row: number, col: number): GridCell | undefined {
  return gridIndex.byRowCol.get(cellKey(row, col));
}

export function getOrthogonalNeighbors(grid: Grid, cell: GridCell): GridCell[] {
  const gridIndex = createGridIndex(grid);
  const neighborCoordinates = [
    [cell.row - 1, cell.col],
    [cell.row + 1, cell.col],
    [cell.row, cell.col - 1],
    [cell.row, cell.col + 1],
  ] as const;

  return neighborCoordinates
    .map(([row, col]) => getCellAt(gridIndex, row, col))
    .filter((neighbor): neighbor is GridCell => Boolean(neighbor?.active));
}

export function cloneGrid(grid: Grid): Grid {
  return {
    ...grid,
    cells: grid.cells.map((cell) => ({ ...cell })),
  };
}
