import test from "node:test";
import assert from "node:assert/strict";

import { loadMockStage1ViewModel } from "../../app/mockStage1ViewModel.ts";
import { mockStage1Dataset } from "../../src/lib/data/mockDataset.ts";

test("mock dataset includes a loadable domain, wells, canals, and grid", () => {
  assert.equal(mockStage1Dataset.domain.name, "Mock Biscayne Training Domain");
  assert.equal(mockStage1Dataset.grid.cells.length, 35);
  assert.equal(mockStage1Dataset.wells.length, 3);
  assert.equal(mockStage1Dataset.canals.length, 1);
});

test("mock grid includes fixed-head coastal and canal cells", () => {
  const coastalCells = mockStage1Dataset.grid.cells.filter((cell) => cell.isCoastalBoundary);
  const canalCells = mockStage1Dataset.grid.cells.filter((cell) => cell.isCanalBoundary);

  assert.equal(coastalCells.length, 5);
  assert.equal(canalCells.length, 3);
  assert.ok(coastalCells.every((cell) => cell.fixedHeadMeters === 0));
  assert.ok(canalCells.every((cell) => cell.fixedHeadMeters === 0.55));
});

test("mock UI view model can load fake domain and fake wells without solver logic", () => {
  const viewModel = loadMockStage1ViewModel();

  assert.deepEqual(viewModel, {
    domainName: "Mock Biscayne Training Domain",
    gridLabel: "5 x 7",
    wellCount: 3,
    canalCount: 1,
    activeCellCount: 35,
    baselineScenarioName: "Baseline",
  });
});
