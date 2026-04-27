import test from "node:test";
import assert from "node:assert/strict";

import { biscayneStage1Dataset } from "../../src/lib/data/biscayneStage1Dataset.ts";
import { baselineScenario } from "../../src/lib/model/baselineScenario.ts";
import { defaultModelTuning } from "../../src/lib/model/modelTuning.ts";
import { runScenario } from "../../src/lib/model/scenarioRunner.ts";
import type { Scenario } from "../../src/lib/model/types.ts";

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    ...baselineScenario,
    id: overrides.id ?? "biscayne-test-scenario",
    name: overrides.name ?? "Biscayne Test Scenario",
    description: overrides.description ?? "Biscayne test scenario",
    rechargeMultiplier: overrides.rechargeMultiplier ?? baselineScenario.rechargeMultiplier,
    seaLevelRiseMeters: overrides.seaLevelRiseMeters ?? baselineScenario.seaLevelRiseMeters,
    pumpingAdjustments: overrides.pumpingAdjustments ?? baselineScenario.pumpingAdjustments,
    canalStageAdjustments:
      overrides.canalStageAdjustments ?? baselineScenario.canalStageAdjustments,
  };
}

function representativeCellId(): string {
  const inlandBoundaryCellIds = new Set(biscayneStage1Dataset.domain.inlandBoundaryCellIds);
  const cell = biscayneStage1Dataset.grid.cells.find(
    (candidate) =>
      candidate.active &&
      !candidate.isCoastalBoundary &&
      !candidate.isCanalBoundary &&
      !inlandBoundaryCellIds.has(candidate.id),
  );
  assert.ok(cell, "missing representative real-domain cell");
  return cell.id;
}

function unclampedRepresentativeCellId(): string {
  const inlandBoundaryCellIds = new Set(biscayneStage1Dataset.domain.inlandBoundaryCellIds);
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const drought = runScenario({
    scenario: scenario({ rechargeMultiplier: 0.5 }),
    dataset: biscayneStage1Dataset,
  });
  const cell = baseline.cells.find((candidate) => {
    const droughtCell = drought.cells.find((droughtCandidate) => droughtCandidate.id === candidate.id);
    if (!droughtCell) return false;

    return (
      candidate.active &&
      !candidate.isCoastalBoundary &&
      !candidate.isCanalBoundary &&
      !inlandBoundaryCellIds.has(candidate.id) &&
      candidate.headMeters !== null &&
      droughtCell.headMeters !== null &&
      candidate.interfaceDepthMeters !== null &&
      droughtCell.interfaceDepthMeters !== null &&
      candidate.interfaceDepthMeters > 0 &&
      candidate.interfaceDepthMeters < 60 &&
      droughtCell.interfaceDepthMeters < candidate.interfaceDepthMeters
    );
  });

  assert.ok(cell, "missing unclamped representative real-domain cell");
  return cell.id;
}

function nearbyFreeCellId(anchorCellId: string): string {
  const anchor = biscayneStage1Dataset.grid.cells.find((cell) => cell.id === anchorCellId);
  assert.ok(anchor, `missing anchor cell ${anchorCellId}`);
  const inlandBoundaryCellIds = new Set(biscayneStage1Dataset.domain.inlandBoundaryCellIds);
  const nearby = biscayneStage1Dataset.grid.cells
    .filter(
      (cell) =>
        cell.active &&
        !cell.isCoastalBoundary &&
        !cell.isCanalBoundary &&
        !inlandBoundaryCellIds.has(cell.id),
    )
    .sort((cellA, cellB) => {
      const distanceA = Math.abs(cellA.row - anchor.row) + Math.abs(cellA.col - anchor.col);
      const distanceB = Math.abs(cellB.row - anchor.row) + Math.abs(cellB.col - anchor.col);
      return distanceA - distanceB;
    })[0];

  assert.ok(nearby, `missing free cell near ${anchorCellId}`);
  return nearby.id;
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
  assert.ok(risk, `missing well risk ${wellId}`);
  return risk;
}

test("real-domain baseline scenario returns cells, wells, diagnostics, diffs, and summary", () => {
  const result = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });

  assert.equal(result.cells.length, biscayneStage1Dataset.grid.cells.length);
  assert.equal(result.wellRiskResults.length, biscayneStage1Dataset.wells.length);
  assert.equal(result.diagnostics.converged, true);
  assert.ok(result.diff);
  assert.ok(result.summary.includes("Solver converged"));
});

test("real-domain default model tuning is applied and stays JSON-safe", () => {
  const result = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const parsed = JSON.parse(JSON.stringify(result)) as typeof result;

  assert.equal(result.diagnostics.converged, true);
  assert.ok(result.cells.some((cell) => cell.active && cell.headMeters !== null));
  assert.ok(result.wellRiskResults.every((risk) => risk.localHeadMeters !== null));
  assert.ok(
    result.diagnostics.warnings.some((warning) => warning.includes("aquifer-base guardrail")),
  );
  assert.equal(result.diagnostics.massBalanceStatus, "ok");
  assert.ok((result.diagnostics.massBalanceErrorPercent ?? 100) < 1);
  assert.equal(parsed.cells.length, result.cells.length);
});

test("real-domain recharge and sea-level scenarios update modeled outputs", () => {
  const cellId = representativeCellId();
  const interfaceCellId = unclampedRepresentativeCellId();
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const raisedRecharge = runScenario({
    scenario: scenario({ rechargeMultiplier: 1.5 }),
    dataset: biscayneStage1Dataset,
  });
  const raisedSeaLevel = runScenario({
    scenario: scenario({ seaLevelRiseMeters: 0.3 }),
    dataset: biscayneStage1Dataset,
  });

  assert.ok(cellHead(raisedRecharge, cellId) > cellHead(baseline, cellId));
  assert.notEqual(
    cellInterfaceDepth(raisedSeaLevel, interfaceCellId),
    cellInterfaceDepth(baseline, interfaceCellId),
  );
});

test("real-domain drought lowers inland heads and shallows the interface", () => {
  const cellId = unclampedRepresentativeCellId();
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const drought = runScenario({
    scenario: scenario({ rechargeMultiplier: 0.5 }),
    dataset: biscayneStage1Dataset,
  });

  assert.ok(cellHead(drought, cellId) < cellHead(baseline, cellId));
  assert.ok(cellInterfaceDepth(drought, cellId) < cellInterfaceDepth(baseline, cellId));
});

test("real-domain sea-level rise worsens selected well risk", () => {
  const well = biscayneStage1Dataset.wells[0]!;
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const raisedSeaLevel = runScenario({
    scenario: scenario({ seaLevelRiseMeters: 0.8 }),
    dataset: biscayneStage1Dataset,
  });
  const baselineWell = wellRisk(baseline, well.id);
  const raisedWell = wellRisk(raisedSeaLevel, well.id);

  assert.ok(raisedWell.interfaceDepthMeters !== null);
  assert.ok(baselineWell.interfaceDepthMeters !== null);
  assert.ok(raisedWell.interfaceDepthMeters < baselineWell.interfaceDepthMeters);
  assert.ok((raisedWell.riskRatio ?? 0) > (baselineWell.riskRatio ?? 0));
});

test("real-domain pumping scenario lowers selected well local head and updates risk", () => {
  const well = biscayneStage1Dataset.wells[0]!;
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const pumped = runScenario({
    scenario: scenario({
      pumpingAdjustments: [
        {
          targetType: "well",
          targetId: well.id,
          pumpingCubicMetersPerDay: 5000,
        },
      ],
    }),
    dataset: biscayneStage1Dataset,
  });
  const baselineWell = baseline.wellRiskResults.find((candidate) => candidate.wellId === well.id);
  const pumpedWell = pumped.wellRiskResults.find((candidate) => candidate.wellId === well.id);

  assert.ok(baselineWell?.localHeadMeters !== null && baselineWell?.localHeadMeters !== undefined);
  assert.ok(pumpedWell?.localHeadMeters !== null && pumpedWell?.localHeadMeters !== undefined);
  assert.ok(pumpedWell.localHeadMeters < baselineWell.localHeadMeters);
  assert.equal(pumpedWell.pumpingCubicMetersPerDay, 5000);
  assert.ok(["low", "moderate", "high", "critical"].includes(pumpedWell.riskLevel));
});

test("real-domain canal-stage scenario changes modeled canal fixed-head cells", () => {
  const canal = biscayneStage1Dataset.canals[0]!;
  const staged = runScenario({
    scenario: scenario({
      canalStageAdjustments: [
        {
          canalId: canal.id,
          stageMeters: 0.8,
        },
      ],
    }),
    dataset: biscayneStage1Dataset,
  });

  for (const cellId of canal.fixedHeadCellIds) {
    const cell = staged.cells.find((candidate) => candidate.id === cellId);
    assert.equal(cell?.isCanalBoundary, true);
    assert.equal(cell?.isCoastalBoundary, false);
    assert.equal(cell?.fixedHeadMeters, 0.8);
    assert.equal(cell?.headMeters, 0.8);
  }
});

test("real-domain default canal-stage tuning raises canal cells and nearby heads", () => {
  const canal = biscayneStage1Dataset.canals[0]!;
  const canalCellId = canal.fixedHeadCellIds[0]!;
  const nearbyCellId = nearbyFreeCellId(canalCellId);
  const baseline = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const raisedCanalDefault = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
    modelTuning: { defaultCanalStageMeters: 0.8 },
  });

  assert.equal(cellHead(raisedCanalDefault, canalCellId), 0.8);
  assert.ok(cellHead(raisedCanalDefault, nearbyCellId) > cellHead(baseline, nearbyCellId));
});

test("real-domain lower K scale increases pumping drawdown", () => {
  const well = biscayneStage1Dataset.wells[0]!;
  const pumpedScenario = scenario({
    pumpingAdjustments: [
      {
        targetType: "well",
        targetId: well.id,
        pumpingCubicMetersPerDay: 5000,
      },
    ],
  });
  const baselineNormalK = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
  });
  const normalK = runScenario({
    scenario: pumpedScenario,
    dataset: biscayneStage1Dataset,
  });
  const baselineLowK = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
    modelTuning: { hydraulicConductivityScale: 0.5 },
  });
  const lowK = runScenario({
    scenario: pumpedScenario,
    dataset: biscayneStage1Dataset,
    modelTuning: { hydraulicConductivityScale: 0.5 },
  });
  const normalDrawdown =
    wellRisk(baselineNormalK, well.id).localHeadMeters! -
    wellRisk(normalK, well.id).localHeadMeters!;
  const lowKDrawdown =
    wellRisk(baselineLowK, well.id).localHeadMeters! -
    wellRisk(lowK, well.id).localHeadMeters!;

  assert.ok(lowKDrawdown > normalDrawdown);
});

test("real-domain invalid or extreme tuning emits plausibility warnings", () => {
  const result = runScenario({
    scenario: baselineScenario,
    dataset: biscayneStage1Dataset,
    modelTuning: {
      ...defaultModelTuning,
      regionalGradientMetersPerKilometer: 0,
      baseRechargeMillimetersPerYear: -100,
      hydraulicConductivityScale: -1,
      initialHeadMeters: 20,
    },
  });

  assert.ok(result.diagnostics.warnings.length >= 3);
  assert.ok(result.diagnostics.warnings.some((warning) => warning.includes("Regional gradient")));
  assert.ok(result.diagnostics.warnings.some((warning) => warning.includes("Base recharge")));
  assert.ok(result.diagnostics.warnings.some((warning) => warning.includes("Hydraulic conductivity")));
});

test("real-domain coastal and canal fixed-head boundaries stay separate", () => {
  const canal = biscayneStage1Dataset.canals[0]!;
  const coastalCellId = biscayneStage1Dataset.domain.coastlineCellIds[0]!;
  const staged = runScenario({
    scenario: scenario({
      seaLevelRiseMeters: 0.3,
      canalStageAdjustments: [
        {
          canalId: canal.id,
          stageMeters: 0.8,
        },
      ],
    }),
    dataset: biscayneStage1Dataset,
  });
  const coastalCell = staged.cells.find((candidate) => candidate.id === coastalCellId);
  const canalCell = staged.cells.find((candidate) => candidate.id === canal.fixedHeadCellIds[0]);

  assert.equal(coastalCell?.isCoastalBoundary, true);
  assert.equal(coastalCell?.fixedHeadMeters, 0.3);
  assert.equal(coastalCell?.headMeters, 0.3);
  assert.equal(canalCell?.isCanalBoundary, true);
  assert.equal(canalCell?.isCoastalBoundary, false);
  assert.equal(canalCell?.fixedHeadMeters, 0.8);
  assert.equal(canalCell?.headMeters, 0.8);
});
