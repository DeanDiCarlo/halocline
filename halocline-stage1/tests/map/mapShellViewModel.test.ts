import test from "node:test";
import assert from "node:assert/strict";

import { biscayneStage1Dataset } from "../../src/lib/data/biscayneStage1Dataset.ts";
import { mockStage1Dataset } from "../../src/lib/data/mockDataset.ts";
import { buildMapShellViewModel, mapPointsToSvgPoints } from "../../src/lib/map/mapShellViewModel.ts";

test("map shell view model defaults to real-domain bounds", () => {
  const viewModel = buildMapShellViewModel();

  assert.deepEqual(viewModel.domain.boundsMeters, biscayneStage1Dataset.domain.boundingBox);
  assert.equal(viewModel.domain.name, "Biscayne Stage 1 Real-Domain Grid");
});

test("map shell view model returns projected domain polygon and grid cells", () => {
  const viewModel = buildMapShellViewModel();

  assert.equal(viewModel.domain.polygon.length, 4);
  assert.equal(viewModel.grid.cells.length, biscayneStage1Dataset.grid.cells.length);
  assert.ok(viewModel.grid.cells.every((cell) => cell.polygon.length === 4));
  assert.ok(viewModel.grid.cells.every((cell) => cell.polygon.every((point) => point.x >= 0 && point.x <= 100)));
  assert.ok(viewModel.grid.cells.every((cell) => cell.polygon.every((point) => point.y >= 0 && point.y <= 100)));
});

test("map shell view model keeps mock canal polyline geometry when given the mock fixture", () => {
  const viewModel = buildMapShellViewModel(mockStage1Dataset);

  assert.equal(viewModel.canals.length, 1);
  assert.equal(viewModel.canals[0]?.name, "Mock Inland Canal");
  assert.deepEqual(viewModel.canals[0]?.polyline, [
    { x: 35.714285714285715, y: 80 },
    { x: 35.714285714285715, y: 20 },
  ]);
});

test("map shell view model keeps mock well marker geometry when given the mock fixture", () => {
  const viewModel = buildMapShellViewModel(mockStage1Dataset);

  assert.equal(viewModel.wells.length, 3);
  assert.deepEqual(viewModel.wells[0], {
    id: "well-a1",
    name: "Well A1",
    wellfieldId: "wellfield-a",
    gridCellId: "r1-c1",
    point: { x: 21.428571428571427, y: 70 },
  });
});

test("map shell view model exposes available and future layers", () => {
  const viewModel = buildMapShellViewModel();

  assert.deepEqual(
    viewModel.layers.map((layer) => [layer.id, layer.enabled, layer.available]),
    [
      ["domain", true, true],
      ["canals", true, true],
      ["wells", true, true],
      ["head", false, false],
      ["interface", false, false],
      ["risk", false, false],
    ],
  );
});

test("map shell view model serializes and parses cleanly", () => {
  const viewModel = buildMapShellViewModel();
  const parsed = JSON.parse(JSON.stringify(viewModel)) as typeof viewModel;

  assert.equal(parsed.grid.cells.length, viewModel.grid.cells.length);
  assert.equal(parsed.wells.length, viewModel.wells.length);
  assert.equal(mapPointsToSvgPoints(parsed.domain.polygon), "0,100 100,100 100,0 0,0");
});
