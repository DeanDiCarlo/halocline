import { fixedHeadOrNull, isFixedHeadCell } from "./boundaryConditions.ts";
import { cloneGrid, createGridIndex, getCellAt, type GridIndex } from "./grid.ts";
import type { Grid, GridCell, ModelRunDiagnostics } from "./types.ts";

export type DarcySolverConfig = {
  maxIterations?: number;
  toleranceMeters?: number;
  relaxationOmega?: number;
  effectiveAquiferThicknessMeters?: number;
  initialHeadMeters?: number;
};

export type DarcySolveResult = {
  grid: Grid;
  headGridMeters: number[];
  diagnostics: ModelRunDiagnostics;
};

type MassBalanceDiagnostics = Pick<
  ModelRunDiagnostics,
  "massBalanceResidualCubicMetersPerDay" | "massBalanceErrorPercent" | "massBalanceStatus"
>;

const defaultSolverConfig = {
  maxIterations: 5000,
  toleranceMeters: 1e-4,
  relaxationOmega: 1.4,
  effectiveAquiferThicknessMeters: 30,
  initialHeadMeters: 0,
};

export function calculateConductanceBetweenCells(params: {
  cellA: GridCell;
  cellB: GridCell;
  cellSizeMeters: number;
  effectiveAquiferThicknessMeters?: number;
}): number {
  const effectiveAquiferThicknessMeters =
    params.effectiveAquiferThicknessMeters ??
    defaultSolverConfig.effectiveAquiferThicknessMeters;
  const kA = params.cellA.hydraulicConductivityMetersPerDay;
  const kB = params.cellB.hydraulicConductivityMetersPerDay;
  const harmonicHydraulicConductivityMetersPerDay = (2 * kA * kB) / (kA + kB);
  const faceWidthMeters = params.cellSizeMeters;
  const distanceMeters = params.cellSizeMeters;

  return (
    harmonicHydraulicConductivityMetersPerDay *
    effectiveAquiferThicknessMeters *
    (faceWidthMeters / distanceMeters)
  );
}

export function cellSourceTermCubicMetersPerDay(cell: GridCell, cellAreaSquareMeters: number): number {
  return cell.rechargeMetersPerDay * cellAreaSquareMeters - cell.pumpingCubicMetersPerDay;
}

function massBalanceStatusFor(errorPercent: number | null): ModelRunDiagnostics["massBalanceStatus"] {
  if (errorPercent === null || !Number.isFinite(errorPercent)) return "failure";
  if (errorPercent > 5) return "failure";
  if (errorPercent > 1) return "warning";
  return "ok";
}

function massBalanceWarnings(diagnostics: MassBalanceDiagnostics): string[] {
  const errorPercent = diagnostics.massBalanceErrorPercent;

  if (errorPercent === null || !Number.isFinite(errorPercent)) {
    return ["Mass balance could not be computed for this solve."];
  }

  if (diagnostics.massBalanceStatus === "failure") {
    return [
      `Mass balance error is ${errorPercent.toFixed(
        2,
      )}%, above the 5% Stage 1 failure threshold.`,
    ];
  }

  if (diagnostics.massBalanceStatus === "warning") {
    return [
      `Mass balance error is ${errorPercent.toFixed(
        2,
      )}%, above the 1% Stage 1 warning threshold.`,
    ];
  }

  return [];
}

function computeMassBalanceDiagnostics(params: {
  grid: Grid;
  gridIndex: GridIndex;
  cellAreaSquareMeters: number;
  effectiveAquiferThicknessMeters: number;
}): MassBalanceDiagnostics {
  let inflowCubicMetersPerDay = 0;
  let outflowCubicMetersPerDay = 0;

  for (const cell of params.grid.cells) {
    if (!cell.active || isFixedHeadCell(cell)) continue;

    const rechargeCubicMetersPerDay = cell.rechargeMetersPerDay * params.cellAreaSquareMeters;
    if (rechargeCubicMetersPerDay >= 0) {
      inflowCubicMetersPerDay += rechargeCubicMetersPerDay;
    } else {
      outflowCubicMetersPerDay += Math.abs(rechargeCubicMetersPerDay);
    }

    if (cell.pumpingCubicMetersPerDay >= 0) {
      outflowCubicMetersPerDay += cell.pumpingCubicMetersPerDay;
    } else {
      inflowCubicMetersPerDay += Math.abs(cell.pumpingCubicMetersPerDay);
    }

    for (const neighbor of activeOrthogonalNeighbors(params.gridIndex, cell)) {
      if (!isFixedHeadCell(neighbor)) continue;

      const conductance = calculateConductanceBetweenCells({
        cellA: cell,
        cellB: neighbor,
        cellSizeMeters: params.grid.cellSizeMeters,
        effectiveAquiferThicknessMeters: params.effectiveAquiferThicknessMeters,
      });
      const boundaryFluxIntoCellCubicMetersPerDay =
        conductance *
        ((neighbor.headMeters ?? neighbor.fixedHeadMeters ?? 0) - (cell.headMeters ?? 0));

      if (boundaryFluxIntoCellCubicMetersPerDay >= 0) {
        inflowCubicMetersPerDay += boundaryFluxIntoCellCubicMetersPerDay;
      } else {
        outflowCubicMetersPerDay += Math.abs(boundaryFluxIntoCellCubicMetersPerDay);
      }
    }
  }

  const residualCubicMetersPerDay = inflowCubicMetersPerDay - outflowCubicMetersPerDay;
  const denominatorCubicMetersPerDay = Math.max(inflowCubicMetersPerDay, outflowCubicMetersPerDay);
  const errorPercent =
    denominatorCubicMetersPerDay === 0
      ? 0
      : (Math.abs(residualCubicMetersPerDay) / denominatorCubicMetersPerDay) * 100;

  return {
    massBalanceResidualCubicMetersPerDay: residualCubicMetersPerDay,
    massBalanceErrorPercent: errorPercent,
    massBalanceStatus: massBalanceStatusFor(errorPercent),
  };
}

function averageFixedHeadMeters(grid: Grid): number | null {
  const fixedHeads = grid.cells
    .map(fixedHeadOrNull)
    .filter((fixedHead): fixedHead is number => fixedHead !== null);

  if (fixedHeads.length === 0) return null;

  return fixedHeads.reduce((sum, fixedHead) => sum + fixedHead, 0) / fixedHeads.length;
}

function activeOrthogonalNeighbors(gridIndex: GridIndex, cell: GridCell): GridCell[] {
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

export function solveDarcyHead(grid: Grid, config: DarcySolverConfig = {}): DarcySolveResult {
  const solverConfig = {
    ...defaultSolverConfig,
    ...config,
  };
  const startedAt = performance.now();
  const solvedGrid = cloneGrid(grid);
  const gridIndex = createGridIndex(solvedGrid);
  const initialHeadMeters =
    config.initialHeadMeters ?? averageFixedHeadMeters(solvedGrid) ?? solverConfig.initialHeadMeters;
  const cellAreaSquareMeters = solvedGrid.cellSizeMeters * solvedGrid.cellSizeMeters;
  const warnings: string[] = [];

  for (const cell of solvedGrid.cells) {
    if (!cell.active) continue;
    cell.headMeters = isFixedHeadCell(cell) ? cell.fixedHeadMeters : cell.headMeters ?? initialHeadMeters;
  }

  let iterationCount = 0;
  let maxHeadChangeMeters: number | null = null;

  const buildDiagnostics = (converged: boolean, extraWarnings: string[] = []): ModelRunDiagnostics => {
    const massBalanceDiagnostics = computeMassBalanceDiagnostics({
      grid: solvedGrid,
      gridIndex,
      cellAreaSquareMeters,
      effectiveAquiferThicknessMeters: solverConfig.effectiveAquiferThicknessMeters,
    });

    return {
      converged,
      iterationCount,
      maxHeadChangeMeters,
      ...massBalanceDiagnostics,
      runTimeMilliseconds: performance.now() - startedAt,
      warnings: [
        ...warnings,
        ...massBalanceWarnings(massBalanceDiagnostics),
        ...extraWarnings,
      ],
    };
  };

  for (let iteration = 1; iteration <= solverConfig.maxIterations; iteration += 1) {
    let iterationMaxHeadChangeMeters = 0;

    for (const cell of solvedGrid.cells) {
      if (!cell.active) continue;

      if (isFixedHeadCell(cell)) {
        const fixedHeadMeters = cell.fixedHeadMeters as number;
        iterationMaxHeadChangeMeters = Math.max(
          iterationMaxHeadChangeMeters,
          Math.abs((cell.headMeters ?? fixedHeadMeters) - fixedHeadMeters),
        );
        cell.headMeters = fixedHeadMeters;
        continue;
      }

      const neighbors = activeOrthogonalNeighbors(gridIndex, cell);

      if (neighbors.length === 0) {
        warnings.push(`Cell ${cell.id} has no active neighbors and was left at its initial head.`);
        continue;
      }

      let conductanceSum = 0;
      let conductanceWeightedNeighborHeadSum = 0;

      for (const neighbor of neighbors) {
        const neighborCell = getCellAt(gridIndex, neighbor.row, neighbor.col);
        if (!neighborCell) continue;

        const conductance = calculateConductanceBetweenCells({
          cellA: cell,
          cellB: neighborCell,
          cellSizeMeters: solvedGrid.cellSizeMeters,
          effectiveAquiferThicknessMeters: solverConfig.effectiveAquiferThicknessMeters,
        });

        conductanceSum += conductance;
        conductanceWeightedNeighborHeadSum += conductance * (neighborCell.headMeters ?? initialHeadMeters);
      }

      if (conductanceSum === 0) {
        warnings.push(`Cell ${cell.id} has zero conductance to active neighbors.`);
        continue;
      }

      const sourceTermCubicMetersPerDay = cellSourceTermCubicMetersPerDay(
        cell,
        cellAreaSquareMeters,
      );
      const unrelaxedHeadMeters =
        (conductanceWeightedNeighborHeadSum + sourceTermCubicMetersPerDay) / conductanceSum;
      const previousHeadMeters = cell.headMeters ?? initialHeadMeters;
      const relaxedHeadMeters =
        previousHeadMeters +
        solverConfig.relaxationOmega * (unrelaxedHeadMeters - previousHeadMeters);

      cell.headMeters = relaxedHeadMeters;
      iterationMaxHeadChangeMeters = Math.max(
        iterationMaxHeadChangeMeters,
        Math.abs(relaxedHeadMeters - previousHeadMeters),
      );
    }

    iterationCount = iteration;
    maxHeadChangeMeters = iterationMaxHeadChangeMeters;

    if (iterationMaxHeadChangeMeters <= solverConfig.toleranceMeters) {
      return {
        grid: solvedGrid,
        headGridMeters: solvedGrid.cells.map((cell) => cell.headMeters ?? Number.NaN),
        diagnostics: buildDiagnostics(true),
      };
    }
  }

  return {
    grid: solvedGrid,
    headGridMeters: solvedGrid.cells.map((cell) => cell.headMeters ?? Number.NaN),
    diagnostics: buildDiagnostics(false, [
      `Solver did not converge within ${solverConfig.maxIterations} iterations.`,
    ]),
  };
}
