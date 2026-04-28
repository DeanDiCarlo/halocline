import test from "node:test";
import assert from "node:assert/strict";

import { createGrid, createGridIndex, getCellAt, getOrthogonalNeighbors } from "../../src/lib/model/grid.ts";

test("creates a rectangular grid with unit-explicit cell geometry", () => {
  const grid = createGrid({
    id: "test-grid",
    name: "Test Grid",
    rowCount: 2,
    colCount: 3,
    cellSizeMeters: 100,
  });

  assert.equal(grid.cells.length, 6);
  assert.equal(grid.cells[0]?.id, "r0-c0");
  assert.equal(grid.cells[0]?.xCenterMeters, 50);
  assert.equal(grid.cells[0]?.yCenterMeters, 50);
  assert.equal(grid.cells[5]?.xCenterMeters, 250);
  assert.equal(grid.cells[5]?.yCenterMeters, 150);
});

test("indexes cells by row and column and returns orthogonal active neighbors", () => {
  const grid = createGrid({
    id: "neighbor-grid",
    name: "Neighbor Grid",
    rowCount: 3,
    colCount: 3,
    cellSizeMeters: 100,
    createCell: (cell) => ({
      active: !(cell.row === 1 && cell.col === 0),
    }),
  });
  const gridIndex = createGridIndex(grid);
  const centerCell = getCellAt(gridIndex, 1, 1);

  assert.ok(centerCell);
  assert.deepEqual(
    getOrthogonalNeighbors(grid, centerCell).map((cell) => cell.id).sort(),
    ["r0-c1", "r1-c2", "r2-c1"],
  );
});
