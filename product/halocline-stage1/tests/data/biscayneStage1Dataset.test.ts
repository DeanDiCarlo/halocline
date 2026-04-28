import test from "node:test";
import assert from "node:assert/strict";

import {
  biscayneStage1Assumptions,
  biscayneStage1CanalStageMeters,
  biscayneStage1CellSizeMeters,
  biscayneStage1Dataset,
  biscayneStage1KZones,
} from "../../src/lib/data/biscayneStage1Dataset.ts";
import { runScenario } from "../../src/lib/model/scenarioRunner.ts";
import { baselineScenario } from "../../src/lib/model/baselineScenario.ts";

test("Biscayne Stage 1 dataset builds a real-domain grid with active and inactive cells", () => {
  const activeCells = biscayneStage1Dataset.grid.cells.filter((cell) => cell.active);
  const inactiveCells = biscayneStage1Dataset.grid.cells.filter((cell) => !cell.active);

  assert.equal(biscayneStage1Dataset.grid.cellSizeMeters, biscayneStage1CellSizeMeters);
  assert.ok(biscayneStage1Dataset.grid.rowCount > 5);
  assert.ok(biscayneStage1Dataset.grid.colCount > 7);
  assert.ok(activeCells.length > 0);
  assert.ok(inactiveCells.length > 0);
  assert.ok(Number.isFinite(biscayneStage1Dataset.domain.boundingBox.maxXMeters));
  assert.ok(Number.isFinite(biscayneStage1Dataset.domain.boundingBox.maxYMeters));
});

test("Biscayne Stage 1 active cells include model inputs and boundary flags", () => {
  const activeCells = biscayneStage1Dataset.grid.cells.filter((cell) => cell.active);

  for (const cell of activeCells) {
    assert.ok(cell.hydraulicConductivityMetersPerDay > 0);
    assert.ok(cell.rechargeMetersPerDay > 0);
    assert.equal(typeof cell.pumpingCubicMetersPerDay, "number");
    assert.equal(typeof cell.isCoastalBoundary, "boolean");
    assert.equal(typeof cell.isCanalBoundary, "boolean");
  }
});

test("Biscayne Stage 1 grid has active coastal fixed-head cells", () => {
  const coastalCells = biscayneStage1Dataset.grid.cells.filter((cell) => cell.isCoastalBoundary);

  assert.ok(coastalCells.length > 0);
  assert.deepEqual(
    coastalCells.map((cell) => cell.id).sort(),
    [...biscayneStage1Dataset.domain.coastlineCellIds].sort(),
  );
  assert.ok(coastalCells.every((cell) => cell.active));
  assert.ok(coastalCells.every((cell) => cell.fixedHeadMeters === 0));
});

test("Biscayne Stage 1 canals rasterize to active non-coastal fixed-head cells", () => {
  const cellsById = new Map(biscayneStage1Dataset.grid.cells.map((cell) => [cell.id, cell]));

  assert.ok(biscayneStage1Dataset.canals.length > 0);

  for (const canal of biscayneStage1Dataset.canals) {
    assert.ok(canal.centerline.length > 0, `${canal.id} is missing a centerline`);
    assert.equal(canal.baselineStageMeters, biscayneStage1CanalStageMeters);
    assert.equal(canal.currentStageMeters, biscayneStage1CanalStageMeters);
    assert.ok(canal.fixedHeadCellIds.length > 0, `${canal.id} has no fixed-head cells`);

    for (const cellId of canal.fixedHeadCellIds) {
      const cell = cellsById.get(cellId);
      assert.ok(cell, `${canal.id} references missing cell ${cellId}`);
      assert.equal(cell.active, true);
      assert.equal(cell.isCoastalBoundary, false);
      assert.equal(cell.isCanalBoundary, true);
      assert.equal(cell.fixedHeadMeters, biscayneStage1CanalStageMeters);
    }
  }
});

test("Biscayne Stage 1 inactive cells do not receive finite model outputs", () => {
  const result = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const inactiveCells = result.cells.filter((cell) => !cell.active);

  assert.ok(inactiveCells.length > 0);
  assert.ok(inactiveCells.every((cell) => cell.headMeters === null));
  assert.ok(inactiveCells.every((cell) => cell.interfaceDepthMeters === null));
});

test("Biscayne Stage 1 wells snap to active grid cells", () => {
  const activeCellIds = new Set(
    biscayneStage1Dataset.grid.cells.filter((cell) => cell.active).map((cell) => cell.id),
  );

  assert.equal(biscayneStage1Dataset.wells.length, 3);
  for (const well of biscayneStage1Dataset.wells) {
    assert.ok(well.name.toLowerCase().includes("placeholder"));
    assert.ok(activeCellIds.has(well.gridCellId), `${well.id} did not snap to an active cell`);
  }
});

test("Biscayne Stage 1 K zones and limitations are documented", () => {
  assert.ok(biscayneStage1KZones.length >= 3);
  assert.ok(
    new Set(
      biscayneStage1Dataset.grid.cells
        .filter((cell) => cell.active)
        .map((cell) => cell.hydraulicConductivityMetersPerDay),
    ).size >= 2,
  );
  assert.ok(biscayneStage1Assumptions.some((assumption) => assumption.includes("not calibrated")));
  assert.ok(biscayneStage1Assumptions.some((assumption) => assumption.includes("rasterized")));
});
