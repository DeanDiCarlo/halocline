import test from "node:test";
import assert from "node:assert/strict";

import { biscayneStage1Dataset } from "../../src/lib/data/biscayneStage1Dataset.ts";
import { runCheckpointScenario } from "../../src/lib/checkpoint/checkpointScenarioRunner.ts";

function cellHead(result: ReturnType<typeof runCheckpointScenario>, cellId: string): number {
  const cell = result.grid.cells.find((candidate) => candidate.id === cellId);
  assert.ok(cell?.headMeters !== null && cell?.headMeters !== undefined, `missing head for ${cellId}`);
  return cell.headMeters;
}

test("baseline scenario returns diagnostics and one result per real-domain placeholder well", () => {
  const result = runCheckpointScenario();

  assert.equal(result.diagnostics.converged, true);
  assert.equal(result.wells.length, biscayneStage1Dataset.wells.length);
  assert.equal(result.grid.cells.length, biscayneStage1Dataset.grid.cells.length);
  assert.ok(result.grid.cells.some((cell) => cell.active));
  assert.ok(result.grid.cells.some((cell) => !cell.active));
  assert.ok(result.summary.includes("Solver converged"));
});

test("increasing recharge raises representative head", () => {
  const baseline = runCheckpointScenario();
  const raisedRecharge = runCheckpointScenario({ rechargeMultiplier: 1.5 });

  assert.ok(raisedRecharge.grid.representativeHeadMeters !== null);
  assert.ok(baseline.grid.representativeHeadMeters !== null);
  assert.ok(raisedRecharge.grid.representativeHeadMeters > baseline.grid.representativeHeadMeters);
});

test("increasing pumping lowers head near the selected well", () => {
  const baseline = runCheckpointScenario();
  const selectedWell = baseline.wells[0]!;
  const highPumping = runCheckpointScenario({
    wellPumpingCubicMetersPerDayById: {
      [selectedWell.wellId]: 5000,
    },
  });

  assert.ok(cellHead(highPumping, selectedWell.gridCellId) < cellHead(baseline, selectedWell.gridCellId));
});

test("sea-level rise changes interface-depth output", () => {
  const baseline = runCheckpointScenario();
  const raisedSeaLevel = runCheckpointScenario({ seaLevelRiseMeters: 0.3 });
  const changedCell = baseline.grid.cells.find((baselineCell) => {
    const raisedCell = raisedSeaLevel.grid.cells.find((cell) => cell.id === baselineCell.id);
    return (
      baselineCell.active &&
      baselineCell.interfaceDepthMeters !== null &&
      raisedCell?.interfaceDepthMeters !== null &&
      raisedCell?.interfaceDepthMeters !== baselineCell.interfaceDepthMeters
    );
  });

  assert.ok(changedCell, "expected sea-level rise to change at least one interface-depth output");
});

test("well risk results include critical pumping, risk ratio, and risk level", () => {
  const result = runCheckpointScenario();

  for (const well of result.wells) {
    assert.equal(typeof well.qCritCubicMetersPerDay, "number");
    assert.ok(typeof well.riskRatio === "number" || well.riskRatio === null);
    assert.ok(["low", "moderate", "high", "critical"].includes(well.riskLevel));
  }
});

test("checkpoint scenario result is serializable for endpoint and UI use", () => {
  const result = runCheckpointScenario({
    rechargeMultiplier: 1.2,
    seaLevelRiseMeters: 0.25,
    wellPumpingCubicMetersPerDayById: {
      [runCheckpointScenario().wells[0]!.wellId]: 5600,
    },
  });
  const parsed = JSON.parse(JSON.stringify(result)) as typeof result;

  assert.equal(parsed.input.rechargeMultiplier, 1.2);
  assert.equal(parsed.input.seaLevelRiseMeters, 0.25);
  assert.equal(parsed.wells.length, result.wells.length);
  assert.equal(parsed.diagnostics.converged, true);
  assert.ok(parsed.grid.cells.every((cell) => Array.isArray(cell.wellIds)));
});
