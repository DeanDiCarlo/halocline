import test from "node:test";
import assert from "node:assert/strict";

import { mockStage1Dataset } from "../../src/lib/data/mockDataset.ts";
import { baselineScenario } from "../../src/lib/model/baselineScenario.ts";
import { runScenario } from "../../src/lib/model/scenarioRunner.ts";
import type { Scenario } from "../../src/lib/model/types.ts";

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    ...baselineScenario,
    id: overrides.id ?? "test-scenario",
    name: overrides.name ?? "Test Scenario",
    description: overrides.description ?? "Test scenario",
    rechargeMultiplier: overrides.rechargeMultiplier ?? baselineScenario.rechargeMultiplier,
    seaLevelRiseMeters: overrides.seaLevelRiseMeters ?? baselineScenario.seaLevelRiseMeters,
    pumpingAdjustments: overrides.pumpingAdjustments ?? baselineScenario.pumpingAdjustments,
    canalStageAdjustments:
      overrides.canalStageAdjustments ?? baselineScenario.canalStageAdjustments,
  };
}

function cellHead(result: ReturnType<typeof runScenario>, cellId: string): number {
  const cell = result.cells.find((candidate) => candidate.id === cellId);
  assert.ok(cell?.headMeters !== null && cell?.headMeters !== undefined, `missing head for ${cellId}`);
  return cell.headMeters;
}

function cellInterfaceDepth(result: ReturnType<typeof runScenario>, cellId: string): number {
  const cell = result.cells.find((candidate) => candidate.id === cellId);
  assert.ok(
    cell?.interfaceDepthMeters !== null && cell?.interfaceDepthMeters !== undefined,
    `missing interface depth for ${cellId}`,
  );
  return cell.interfaceDepthMeters;
}

function wellRisk(result: ReturnType<typeof runScenario>, wellId: string) {
  const risk = result.wellRiskResults.find((candidate) => candidate.wellId === wellId);
  assert.ok(risk, `missing risk for ${wellId}`);
  return risk;
}

test("full baseline scenario returns cells, wells, diagnostics, diffs, and summary", () => {
  const result = runScenario({
    scenario: baselineScenario,
    dataset: mockStage1Dataset,
  });

  assert.equal(result.scenarioId, "baseline");
  assert.equal(result.scenarioName, "Baseline");
  assert.equal(result.cells.length, mockStage1Dataset.grid.cells.length);
  assert.equal(result.wellRiskResults.length, mockStage1Dataset.wells.length);
  assert.equal(result.diagnostics.converged, true);
  assert.ok(result.diff);
  assert.equal(result.diff.cellDiffs.length, mockStage1Dataset.grid.cells.length);
  assert.equal(result.diff.wellDiffs.length, mockStage1Dataset.wells.length);
  assert.ok(result.summary.includes("Solver converged"));
});

test("pumping adjustment updates local head, interface depth, and well risk together", () => {
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: mockStage1Dataset,
  });
  const highPumping = runScenario({
    scenario: scenario({
      pumpingAdjustments: [
        {
          targetType: "well",
          targetId: "well-a1",
          pumpingCubicMetersPerDay: 5000,
        },
      ],
    }),
    dataset: mockStage1Dataset,
  });

  assert.ok(cellHead(highPumping, "r1-c1") < cellHead(baseline, "r1-c1"));
  assert.ok(cellInterfaceDepth(highPumping, "r1-c1") < cellInterfaceDepth(baseline, "r1-c1"));
  assert.ok(
    (wellRisk(highPumping, "well-a1").riskRatio ?? 0) >
      (wellRisk(baseline, "well-a1").riskRatio ?? 0),
  );
});

test("sea-level rise changes relative head and interface depth", () => {
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: mockStage1Dataset,
  });
  const seaLevelRise = runScenario({
    scenario: scenario({ seaLevelRiseMeters: 0.3 }),
    dataset: mockStage1Dataset,
  });

  assert.notEqual(cellHead(seaLevelRise, "r1-c1"), cellHead(baseline, "r1-c1"));
  assert.notEqual(
    cellInterfaceDepth(seaLevelRise, "r2-c2"),
    cellInterfaceDepth(baseline, "r2-c2"),
  );
});

test("freshwater-lens inversion emits a scenario warning", () => {
  const result = runScenario({
    scenario: scenario({ seaLevelRiseMeters: 5 }),
    dataset: mockStage1Dataset,
  });

  assert.ok(
    result.diagnostics.warnings.some((warning) => warning.includes("freshwater lens is inverted")),
  );
});

test("recharge multiplier raises representative head", () => {
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: mockStage1Dataset,
  });
  const raisedRecharge = runScenario({
    scenario: scenario({ rechargeMultiplier: 1.5 }),
    dataset: mockStage1Dataset,
  });

  assert.ok(cellHead(raisedRecharge, "r1-c1") > cellHead(baseline, "r1-c1"));
});

test("canal-stage adjustment preserves fixed-head canal behavior", () => {
  const result = runScenario({
    scenario: scenario({
      canalStageAdjustments: [
        {
          canalId: "canal-primary",
          stageMeters: 0.8,
        },
      ],
    }),
    dataset: mockStage1Dataset,
  });

  for (const cellId of ["r1-c2", "r2-c2", "r3-c2"]) {
    const cell = result.cells.find((candidate) => candidate.id === cellId);
    assert.equal(cell?.fixedHeadMeters, 0.8);
    assert.equal(cell?.headMeters, 0.8);
  }
});

test("wellfield pumping adjustment applies to every well in the target wellfield", () => {
  const result = runScenario({
    scenario: scenario({
      pumpingAdjustments: [
        {
          targetType: "wellfield",
          targetId: "wellfield-a",
          pumpingCubicMetersPerDay: 4000,
        },
      ],
    }),
    dataset: mockStage1Dataset,
  });

  assert.equal(wellRisk(result, "well-a1").pumpingCubicMetersPerDay, 4000);
  assert.equal(wellRisk(result, "well-a2").pumpingCubicMetersPerDay, 4000);
  assert.notEqual(wellRisk(result, "well-b1").pumpingCubicMetersPerDay, 4000);
});

test("baseline-vs-scenario diffs are present and numerically meaningful", () => {
  const result = runScenario({
    scenario: scenario({
      rechargeMultiplier: 1.3,
      seaLevelRiseMeters: 0.3,
      pumpingAdjustments: [
        {
          targetType: "well",
          targetId: "well-b1",
          pumpingCubicMetersPerDay: 5600,
        },
      ],
    }),
    dataset: mockStage1Dataset,
  });
  const headCellDiff = result.diff?.cellDiffs.find((diff) => diff.cellId === "r3-c4");
  const interfaceCellDiff = result.diff?.cellDiffs.find((diff) => diff.cellId === "r2-c2");
  const wellDiff = result.diff?.wellDiffs.find((diff) => diff.wellId === "well-b1");

  assert.ok(result.diff);
  assert.notEqual(headCellDiff?.headDifferenceMeters, 0);
  assert.notEqual(interfaceCellDiff?.interfaceDepthDifferenceMeters, 0);
  assert.notEqual(wellDiff?.riskRatioDifference, 0);
});

test("scenario result serializes and parses cleanly", () => {
  const result = runScenario({
    scenario: scenario({ seaLevelRiseMeters: 0.25 }),
    dataset: mockStage1Dataset,
  });
  const parsed = JSON.parse(JSON.stringify(result)) as typeof result;

  assert.equal(parsed.scenarioId, "test-scenario");
  assert.equal(parsed.cells.length, result.cells.length);
  assert.equal(parsed.wellRiskResults.length, result.wellRiskResults.length);
  assert.ok(parsed.diff);
  assert.ok(parsed.cells.every((cell) => Array.isArray(cell.wellIds)));
});
