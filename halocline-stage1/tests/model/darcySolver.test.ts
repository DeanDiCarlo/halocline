import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateConductanceBetweenCells,
  cellSourceTermCubicMetersPerDay,
  solveDarcyHead,
} from "../../src/lib/model/darcySolver.ts";
import { createGrid, createGridIndex } from "../../src/lib/model/grid.ts";

function assertApproxEqual(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function headAt(result: ReturnType<typeof solveDarcyHead>, cellId: string): number {
  const cell = createGridIndex(result.grid).byId.get(cellId);
  assert.ok(cell?.headMeters !== undefined, `missing head for ${cellId}`);
  return cell.headMeters;
}

test("calculates harmonic conductance between adjacent cells", () => {
  const grid = createGrid({
    id: "conductance-grid",
    name: "Conductance Grid",
    rowCount: 1,
    colCount: 2,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      hydraulicConductivityMetersPerDay: cell.col === 0 ? 50 : 100,
    }),
  });

  const [cellA, cellB] = grid.cells;
  assert.ok(cellA);
  assert.ok(cellB);

  assertApproxEqual(
    calculateConductanceBetweenCells({
      cellA,
      cellB,
      cellSizeMeters: grid.cellSizeMeters,
      effectiveAquiferThicknessMeters: 30,
    }),
    2000,
  );
});

test("calculates recharge minus pumping source term", () => {
  const grid = createGrid({
    id: "source-grid",
    name: "Source Grid",
    rowCount: 1,
    colCount: 1,
    cellSizeMeters: 100,
    createCell: () => ({
      rechargeMetersPerDay: 0.001,
      pumpingCubicMetersPerDay: 3,
    }),
  });

  assert.equal(cellSourceTermCubicMetersPerDay(grid.cells[0]!, 10_000), 7);
});

test("solver converges on a simple fixed-head gradient", () => {
  const grid = createGrid({
    id: "gradient-grid",
    name: "Gradient Grid",
    rowCount: 1,
    colCount: 5,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 0 ? 1 : cell.col === 4 ? 0 : undefined,
    }),
  });

  const result = solveDarcyHead(grid, {
    relaxationOmega: 1.2,
    toleranceMeters: 1e-8,
  });

  assert.equal(result.diagnostics.converged, true);
  assert.equal(headAt(result, "r0-c0"), 1);
  assert.equal(headAt(result, "r0-c4"), 0);
  assert.ok(headAt(result, "r0-c1") > headAt(result, "r0-c2"));
  assert.ok(headAt(result, "r0-c2") > headAt(result, "r0-c3"));
});

test("increasing recharge raises head", () => {
  const baseGrid = createGrid({
    id: "recharge-base",
    name: "Recharge Base",
    rowCount: 3,
    colCount: 3,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 2 ? 0 : undefined,
      rechargeMetersPerDay: 0,
    }),
  });
  const rechargeGrid = createGrid({
    id: "recharge-raised",
    name: "Recharge Raised",
    rowCount: 3,
    colCount: 3,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 2 ? 0 : undefined,
      rechargeMetersPerDay: cell.col === 0 ? 0.001 : 0,
    }),
  });

  const baseResult = solveDarcyHead(baseGrid);
  const rechargeResult = solveDarcyHead(rechargeGrid);

  assert.equal(baseResult.diagnostics.converged, true);
  assert.equal(rechargeResult.diagnostics.converged, true);
  assert.ok(headAt(rechargeResult, "r1-c0") > headAt(baseResult, "r1-c0"));
});

test("increasing pumping lowers head near the pumping cell", () => {
  const baseGrid = createGrid({
    id: "pumping-base",
    name: "Pumping Base",
    rowCount: 3,
    colCount: 3,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 2 ? 0.4 : undefined,
      rechargeMetersPerDay: 0.001,
      pumpingCubicMetersPerDay: 0,
    }),
  });
  const pumpingGrid = createGrid({
    id: "pumping-raised",
    name: "Pumping Raised",
    rowCount: 3,
    colCount: 3,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 2 ? 0.4 : undefined,
      rechargeMetersPerDay: 0.001,
      pumpingCubicMetersPerDay: cell.row === 1 && cell.col === 0 ? 50 : 0,
    }),
  });

  const baseResult = solveDarcyHead(baseGrid);
  const pumpingResult = solveDarcyHead(pumpingGrid);

  assert.equal(baseResult.diagnostics.converged, true);
  assert.equal(pumpingResult.diagnostics.converged, true);
  assert.ok(headAt(pumpingResult, "r1-c0") < headAt(baseResult, "r1-c0"));
});

test("coastal and canal fixed-head cells remain fixed", () => {
  const grid = createGrid({
    id: "fixed-head-grid",
    name: "Fixed Head Grid",
    rowCount: 3,
    colCount: 4,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters:
        cell.col === 3 ? 0 : cell.row === 1 && cell.col === 1 ? 0.55 : undefined,
      isCoastalBoundary: cell.col === 3,
      isCanalBoundary: cell.row === 1 && cell.col === 1,
      rechargeMetersPerDay: 0.001,
      pumpingCubicMetersPerDay: cell.row === 1 && cell.col === 0 ? 50 : 0,
    }),
  });

  const result = solveDarcyHead(grid);

  assert.equal(result.diagnostics.converged, true);
  assert.equal(headAt(result, "r0-c3"), 0);
  assert.equal(headAt(result, "r1-c3"), 0);
  assert.equal(headAt(result, "r2-c3"), 0);
  assert.equal(headAt(result, "r1-c1"), 0.55);
});

test("solver returns iteration count, residual estimate, and convergence status", () => {
  const grid = createGrid({
    id: "diagnostics-grid",
    name: "Diagnostics Grid",
    rowCount: 2,
    colCount: 2,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 1 ? 0 : undefined,
      rechargeMetersPerDay: 0.0005,
    }),
  });

  const result = solveDarcyHead(grid);

  assert.equal(result.diagnostics.converged, true);
  assert.ok(result.diagnostics.iterationCount > 0);
  assert.ok(result.diagnostics.maxHeadChangeMeters !== null);
  assert.ok(result.diagnostics.maxHeadChangeMeters <= 1e-4);
  assert.equal(result.diagnostics.massBalanceStatus, "ok");
  assert.ok(result.diagnostics.massBalanceResidualCubicMetersPerDay !== null);
  assert.ok((result.diagnostics.massBalanceErrorPercent ?? 100) < 1);
  assert.ok(result.diagnostics.runTimeMilliseconds >= 0);
});

test("solver reports steady-state mass balance within tolerance", () => {
  const grid = createGrid({
    id: "mass-balance-grid",
    name: "Mass Balance Grid",
    rowCount: 1,
    colCount: 4,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      fixedHeadMeters: cell.col === 3 ? 0 : undefined,
      rechargeMetersPerDay: cell.col === 0 ? 0.001 : 0,
    }),
  });

  const result = solveDarcyHead(grid, {
    toleranceMeters: 1e-9,
  });

  assert.equal(result.diagnostics.converged, true);
  assert.equal(result.diagnostics.massBalanceStatus, "ok");
  assert.ok((result.diagnostics.massBalanceErrorPercent ?? 100) < 1);
});
