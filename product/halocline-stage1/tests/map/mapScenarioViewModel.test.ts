import test from "node:test";
import assert from "node:assert/strict";

import { biscayneStage1Dataset } from "../../src/lib/data/biscayneStage1Dataset.ts";
import { buildMapScenarioViewModel } from "../../src/lib/map/mapScenarioViewModel.ts";
import { defaultModelTuning } from "../../src/lib/model/modelTuning.ts";

function cellHead(viewModel: ReturnType<typeof buildMapScenarioViewModel>, cellId: string): number {
  const cell = viewModel.grid.cells.find((candidate) => candidate.id === cellId);
  assert.ok(cell?.headMeters !== null && cell?.headMeters !== undefined, `missing head for ${cellId}`);
  return cell.headMeters;
}

function wellById(viewModel: ReturnType<typeof buildMapScenarioViewModel>, wellId: string) {
  const well = viewModel.wells.find((candidate) => candidate.id === wellId);
  assert.ok(well, `missing well ${wellId}`);
  return well;
}

function representativeActiveCellId(viewModel: ReturnType<typeof buildMapScenarioViewModel>): string {
  const inlandBoundaryCellIds = new Set(biscayneStage1Dataset.domain.inlandBoundaryCellIds);
  const cell = viewModel.grid.cells.find(
    (candidate) =>
      candidate.active &&
      !candidate.isCoastalBoundary &&
      !candidate.isCanalBoundary &&
      !inlandBoundaryCellIds.has(candidate.id) &&
      candidate.headMeters !== null,
  );
  assert.ok(cell, "missing representative active model cell");
  return cell.id;
}

type WellRiskRankingRow = ReturnType<
  typeof buildMapScenarioViewModel
>["wellRiskRanking"]["rows"][number];

function statusPriority(status: WellRiskRankingRow["changeStatus"]): number {
  switch (status) {
    case "worsened":
      return 2;
    case "unchanged":
      return 1;
    case "improved":
      return 0;
  }
}

function riskPriority(riskLevel: WellRiskRankingRow["riskLevel"]): number {
  const priorities: Record<WellRiskRankingRow["riskLevel"], number> = {
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
  };
  return priorities[riskLevel];
}

function declineMagnitude(value: number | null): number {
  return value !== null && value < 0 ? Math.abs(value) : 0;
}

function compareDecisionPriority(a: WellRiskRankingRow, b: WellRiskRankingRow): number {
  return (
    statusPriority(a.changeStatus) - statusPriority(b.changeStatus) ||
    riskPriority(a.riskLevel) - riskPriority(b.riskLevel) ||
    (a.riskRatio ?? Number.NEGATIVE_INFINITY) - (b.riskRatio ?? Number.NEGATIVE_INFINITY) ||
    declineMagnitude(a.headChangeMeters) - declineMagnitude(b.headChangeMeters) ||
    declineMagnitude(a.interfaceChangeMeters) - declineMagnitude(b.interfaceChangeMeters)
  );
}

function evidenceItem(
  viewModel: ReturnType<typeof buildMapScenarioViewModel>,
  wellId: string,
  itemId: string,
) {
  const row = viewModel.wellEvidence.rows.find((candidate) => candidate.wellId === wellId);
  assert.ok(row, `missing evidence row for ${wellId}`);
  const item = row.items.find((candidate) => candidate.id === itemId);
  assert.ok(item, `missing evidence item ${itemId}`);
  return item;
}

test("map scenario view model returns one cell per real-domain grid cell", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.equal(viewModel.grid.cells.length, biscayneStage1Dataset.grid.cells.length);
  assert.ok(viewModel.grid.cells.some((cell) => cell.active && cell.headMeters !== null));
  assert.ok(viewModel.grid.cells.some((cell) => !cell.active && cell.headMeters === null));
});

test("map scenario view model resolves baseline input and status", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.equal(viewModel.scenarioStatus, "baseline");
  assert.equal(viewModel.input.rechargeMultiplier, 1);
  assert.equal(viewModel.input.seaLevelRiseMeters, 0);
  assert.deepEqual(viewModel.input.wellPumpingCubicMetersPerDayById, {});
  assert.deepEqual(viewModel.input.wellfieldPumpingCubicMetersPerDayById, {});
  assert.deepEqual(viewModel.input.canalStageMetersById, {});
  assert.deepEqual(viewModel.input.modelTuning, {});
  assert.deepEqual(viewModel.input.resolvedModelTuning, defaultModelTuning);
  for (const well of biscayneStage1Dataset.wells) {
    assert.equal(
      viewModel.input.resolvedWellPumpingCubicMetersPerDayById[well.id],
      well.currentPumpingCubicMetersPerDay,
    );
  }
  for (const canal of biscayneStage1Dataset.canals) {
    assert.equal(
      viewModel.input.resolvedCanalStageMetersById[canal.id],
      canal.currentStageMeters,
    );
  }
});

test("map scenario view model exposes Sprint 10A scenario presets", () => {
  const viewModel = buildMapScenarioViewModel();
  const presets = viewModel.scenarioPresets;

  assert.deepEqual(
    presets.map((preset) => preset.id),
    ["baseline", "dry-recharge", "sea-level-rise", "pumping-stress", "combined-stress"],
  );
  assert.ok(presets.every((preset) => preset.label.length > 0));
  assert.ok(presets.every((preset) => preset.description.length > 0));
  assert.deepEqual(presets.find((preset) => preset.id === "baseline")?.inputPatch, {});
  assert.deepEqual(presets.find((preset) => preset.id === "baseline")?.affectedControls, []);
  assert.equal(
    presets.find((preset) => preset.id === "dry-recharge")?.inputPatch.rechargeMultiplier,
    0.7,
  );
  assert.equal(
    presets.find((preset) => preset.id === "sea-level-rise")?.inputPatch.seaLevelRiseMeters,
    0.5,
  );
  assert.equal(
    presets.find((preset) => preset.id === "pumping-stress")?.inputPatch
      .selectedWellfieldPumpingCubicMetersPerDay,
    5600,
  );
  assert.deepEqual(
    presets.find((preset) => preset.id === "combined-stress")?.affectedControls,
    ["recharge", "sea-level", "wellfield-pumping"],
  );
  assert.deepEqual(
    presets.flatMap((preset) => preset.affectedControls).filter((control, index, controls) => controls.indexOf(control) === index).sort(),
    ["recharge", "sea-level", "wellfield-pumping"],
  );
});

test("map scenario snapshot explains baseline Stage 1 conditions", () => {
  const viewModel = buildMapScenarioViewModel();
  const snapshot = viewModel.scenarioSnapshot;

  assert.equal(snapshot.scenarioStatusLabel, "Baseline");
  assert.equal(snapshot.headline, viewModel.scenarioNarrative.headline);
  assert.equal(snapshot.riskPosture, "neutral");
  assert.equal(snapshot.metrics.worsenedWellCount, 0);
  assert.equal(snapshot.metrics.maxDrawdownMeters, 0);
  assert.equal(snapshot.metrics.warningCount, viewModel.calibrationReadout.warningCount);
  assert.equal(snapshot.metrics.riskPostureRank, 0);
  assert.equal(snapshot.displayValues.worsenedWells, "0");
  assert.equal(snapshot.displayValues.maxDrawdown, "0.00 m");
  assert.ok(snapshot.displayValues.highestRiskWell.length > 0);
  assert.ok(snapshot.stage1Disclaimer.includes("simplified Stage 1"));
  assert.ok(snapshot.stage1Disclaimer.includes("not calibrated"));
  assert.ok(snapshot.stage1Disclaimer.includes("not regulatory"));
});

test("map scenario snapshot summarizes modified preset-equivalent scenarios", () => {
  const baseline = buildMapScenarioViewModel();
  const selectedWellfieldId = baseline.wells[1]!.wellfieldId;
  const viewModel = buildMapScenarioViewModel({
    input: {
      rechargeMultiplier: 0.7,
      seaLevelRiseMeters: 0.5,
      wellfieldPumpingCubicMetersPerDayById: {
        [selectedWellfieldId]: 5600,
      },
    },
  });
  const snapshot = viewModel.scenarioSnapshot;

  assert.equal(snapshot.scenarioStatusLabel, "Modified");
  assert.equal(snapshot.headline, viewModel.scenarioNarrative.headline);
  assert.ok(snapshot.dominantChange.length > 0);
  assert.ok(["neutral", "watch", "elevated", "severe"].includes(snapshot.riskPosture));
  assert.ok(snapshot.metrics.maxDrawdownMeters >= 0);
  assert.equal(snapshot.metrics.worsenedWellCount, viewModel.comparisonSummary.worsenedWellCount);
  assert.equal(snapshot.metrics.warningCount, viewModel.calibrationReadout.warningCount);
  assert.equal(snapshot.displayValues.warnings, String(viewModel.calibrationReadout.warningCount));
  assert.ok(snapshot.summary.length > 0);
});

test("map scenario snapshot preserves warning-heavy posture and counts", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      modelTuning: {
        regionalGradientMetersPerKilometer: 0,
        baseRechargeMillimetersPerYear: -100,
        hydraulicConductivityScale: -1,
      },
    },
  });
  const snapshot = viewModel.scenarioSnapshot;

  assert.equal(snapshot.scenarioStatusLabel, "Modified");
  assert.ok(snapshot.metrics.warningCount > 0);
  assert.equal(snapshot.metrics.warningCount, viewModel.diagnostics.warningDetails.length);
  assert.equal(snapshot.displayValues.warnings, String(viewModel.diagnostics.warningDetails.length));
  assert.ok(["watch", "elevated", "severe"].includes(snapshot.riskPosture));
  assert.ok(snapshot.metrics.riskPostureRank > 0);
});

test("map scenario model tuning input marks the scenario modified", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      modelTuning: {
        hydraulicConductivityScale: 0.7,
      },
    },
  });

  assert.equal(viewModel.scenarioStatus, "modified");
  assert.equal(viewModel.input.modelTuning.hydraulicConductivityScale, 0.7);
  assert.equal(viewModel.input.resolvedModelTuning.hydraulicConductivityScale, 0.7);
});

test("map scenario recharge input raises representative head", () => {
  const baseline = buildMapScenarioViewModel();
  const raisedRecharge = buildMapScenarioViewModel({ input: { rechargeMultiplier: 1.5 } });
  const cellId = representativeActiveCellId(baseline);

  assert.equal(raisedRecharge.scenarioStatus, "modified");
  assert.ok(cellHead(raisedRecharge, cellId) > cellHead(baseline, cellId));
});

test("map scenario pumping input lowers local head and updates well risk fields", () => {
  const baseline = buildMapScenarioViewModel();
  const selectedWellId = baseline.wells[0]!.id;
  const highPumping = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5000,
      },
    },
  });
  const baselineWell = wellById(baseline, selectedWellId);
  const highPumpingWell = wellById(highPumping, selectedWellId);

  assert.equal(highPumping.scenarioStatus, "modified");
  assert.equal(highPumpingWell.pumpingCubicMetersPerDay, 5000);
  assert.ok(highPumpingWell.localHeadMeters !== null);
  assert.ok(baselineWell.localHeadMeters !== null);
  assert.ok(highPumpingWell.localHeadMeters < baselineWell.localHeadMeters);
  assert.ok(["low", "moderate", "high", "critical"].includes(highPumpingWell.riskLevel));
});

test("map scenario sea-level input changes interface depth", () => {
  const baseline = buildMapScenarioViewModel();
  const raisedSeaLevel = buildMapScenarioViewModel({ input: { seaLevelRiseMeters: 0.3 } });
  const changedCell = baseline.grid.cells.find((baselineCell) => {
    const raisedCell = raisedSeaLevel.grid.cells.find((cell) => cell.id === baselineCell.id);
    return (
      baselineCell.active &&
      baselineCell.interfaceDepthMeters !== null &&
      raisedCell?.interfaceDepthMeters !== null &&
      raisedCell.interfaceDepthMeters !== baselineCell.interfaceDepthMeters
    );
  });

  assert.equal(raisedSeaLevel.scenarioStatus, "modified");
  assert.ok(changedCell, "expected sea-level input to change at least one interface-depth output");
});

test("map scenario canal-stage input updates canal metadata and scenario status", () => {
  const baseline = buildMapScenarioViewModel();
  const selectedCanal = baseline.canals[0]!;
  const staged = buildMapScenarioViewModel({
    input: {
      canalStageMetersById: {
        [selectedCanal.id]: 0.8,
      },
    },
  });
  const stagedCanal = staged.canals.find((canal) => canal.id === selectedCanal.id);

  assert.equal(staged.scenarioStatus, "modified");
  assert.equal(staged.input.canalStageMetersById[selectedCanal.id], 0.8);
  assert.equal(staged.input.resolvedCanalStageMetersById[selectedCanal.id], 0.8);
  assert.equal(stagedCanal?.currentStageMeters, 0.8);
  assert.equal(stagedCanal?.baselineStageMeters, selectedCanal.baselineStageMeters);
});

test("map scenario default canal-stage tuning updates canal metadata", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      modelTuning: {
        defaultCanalStageMeters: 0.8,
      },
    },
  });

  assert.equal(viewModel.scenarioStatus, "modified");
  assert.ok(viewModel.canals.length > 0);
  assert.ok(viewModel.canals.every((canal) => canal.currentStageMeters === 0.8));
});

test("map scenario wellfield pumping applies to every well in the target wellfield", () => {
  const baseline = buildMapScenarioViewModel();
  const selectedWell = baseline.wells[0]!;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellfieldPumpingCubicMetersPerDayById: {
        [selectedWell.wellfieldId]: 4000,
      },
    },
  });

  assert.equal(viewModel.scenarioStatus, "modified");
  assert.equal(wellById(viewModel, selectedWell.id).pumpingCubicMetersPerDay, 4000);
  assert.ok(
    viewModel.wells
      .filter((well) => well.wellfieldId !== selectedWell.wellfieldId)
      .every((well) => well.pumpingCubicMetersPerDay !== 4000),
  );
});

test("map scenario individual well pumping overrides wellfield pumping", () => {
  const baseline = buildMapScenarioViewModel();
  const selectedWell = baseline.wells[0]!;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellfieldPumpingCubicMetersPerDayById: {
        [selectedWell.wellfieldId]: 4000,
      },
      wellPumpingCubicMetersPerDayById: {
        [selectedWell.id]: 5000,
      },
    },
  });

  assert.equal(wellById(viewModel, selectedWell.id).pumpingCubicMetersPerDay, 5000);
});

test("map scenario exposes comparison colors and well diff fields", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      rechargeMultiplier: 1.5,
      wellPumpingCubicMetersPerDayById: {
        [buildMapScenarioViewModel().wells[1]!.id]: 5600,
      },
    },
  });
  const diffCell = viewModel.grid.cells.find((cell) => cell.headDifferenceMeters !== null);
  const diffWell = viewModel.wells.find((well) => well.pumpingCubicMetersPerDay === 5600);
  assert.ok(diffWell);

  assert.ok(diffCell);
  assert.equal(typeof diffCell.headDifferenceColor, "string");
  assert.equal(typeof diffCell.interfaceDifferenceColor, "string");
  assert.ok(Number.isFinite(diffCell.interfaceDifferenceOpacity));
  assert.ok(["low", "moderate", "high", "critical"].includes(diffWell.riskLevelBefore));
  assert.ok(["low", "moderate", "high", "critical"].includes(diffWell.riskLevelAfter));
  assert.ok(diffWell.riskRatioDifference === null || typeof diffWell.riskRatioDifference === "number");
  assert.ok(
    diffWell.qCritDifferenceCubicMetersPerDay === null ||
      typeof diffWell.qCritDifferenceCubicMetersPerDay === "number",
  );
  assert.ok(diffWell.localHeadDifferenceMeters === null || typeof diffWell.localHeadDifferenceMeters === "number");
  assert.ok(
    diffWell.interfaceDepthDifferenceMeters === null ||
      typeof diffWell.interfaceDepthDifferenceMeters === "number",
  );
  assert.ok(diffWell.riskChangeColor.startsWith("#"));
});

test("map scenario comparison summary reports key baseline changes", () => {
  const selectedWellId = buildMapScenarioViewModel().wells[1]!.id;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5600,
      },
    },
  });

  assert.ok(viewModel.comparisonSummary.highestRiskWellId);
  assert.ok(viewModel.comparisonSummary.worsenedWellCount >= 0);
  assert.ok(
    viewModel.comparisonSummary.largestHeadDeclineMeters === null ||
      viewModel.comparisonSummary.largestHeadDeclineMeters < 0,
  );
  assert.ok(
    viewModel.comparisonSummary.largestInterfaceDepthDecreaseMeters === null ||
      viewModel.comparisonSummary.largestInterfaceDepthDecreaseMeters < 0,
  );
});

test("map scenario narrative explains baseline Stage 1 conditions", () => {
  const viewModel = buildMapScenarioViewModel();
  const narrative = viewModel.scenarioNarrative;

  assert.equal(narrative.headline, "Baseline Stage 1 conditions");
  assert.equal(narrative.riskPosture, "neutral");
  assert.ok(narrative.body.includes("No scenario changes"));
  assert.ok(narrative.stage1Disclaimer.includes("not calibrated"));
  assert.ok(narrative.stage1Disclaimer.includes("not regulatory"));
  assert.deepEqual(
    narrative.beforeAfterCards.map((card) => card.label),
    [
      "Highest-risk well",
      "Worsened wells",
      "Max drawdown",
      "Largest interface decrease",
      "Warnings",
    ],
  );
  assert.notEqual(narrative.beforeAfterCards.find((card) => card.id === "warnings")?.currentValue, "0");
});

test("map scenario narrative summarizes modified drawdown scenarios", () => {
  const selectedWellId = buildMapScenarioViewModel().wells[1]!.id;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5600,
      },
    },
  });
  const narrative = viewModel.scenarioNarrative;

  assert.equal(viewModel.scenarioStatus, "modified");
  assert.ok(narrative.headline.length > 0);
  assert.notEqual(narrative.headline, "Baseline Stage 1 conditions");
  assert.ok(["watch", "elevated", "severe"].includes(narrative.riskPosture));
  assert.ok(narrative.beforeAfterCards.every((card) => card.baselineValue.length > 0));
  assert.ok(narrative.beforeAfterCards.every((card) => card.currentValue.length > 0));
  assert.ok(narrative.beforeAfterCards.some((card) => card.id === "max-drawdown"));
});

test("map scenario well risk ranking includes every modeled well", () => {
  const viewModel = buildMapScenarioViewModel();
  const ranking = viewModel.wellRiskRanking;

  assert.equal(ranking.defaultSort, "decision-priority");
  assert.equal(ranking.rows.length, viewModel.wells.length);
  assert.deepEqual(
    new Set(ranking.rows.map((row) => row.wellId)),
    new Set(viewModel.wells.map((well) => well.id)),
  );
  assert.deepEqual(
    ranking.sortOptions.map((option) => option.id),
    ["decision-priority", "risk-ratio", "drawdown", "interface-decrease", "pumping", "qcrit"],
  );
  assert.ok(ranking.sortOptions.every((option) => option.wellIds.length === viewModel.wells.length));
});

test("map scenario well risk ranking orders decision priorities first", () => {
  const selectedWellId = buildMapScenarioViewModel().wells[1]!.id;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5600,
      },
    },
  });
  const rows = viewModel.wellRiskRanking.rows;

  assert.equal(rows[0]?.wellId, selectedWellId);
  assert.equal(rows[0]?.changeStatus, "worsened");
  for (let index = 1; index < rows.length; index += 1) {
    assert.ok(compareDecisionPriority(rows[index - 1]!, rows[index]!) >= 0);
  }
});

test("map scenario well risk ranking constrains status values and explanations", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      seaLevelRiseMeters: 0.8,
    },
  });

  assert.ok(viewModel.wellRiskRanking.rows.length > 0);
  for (const row of viewModel.wellRiskRanking.rows) {
    assert.ok(["worsened", "improved", "unchanged"].includes(row.changeStatus));
    assert.ok(row.whyThisWellMatters.length > 0);
  }
});

test("map scenario well risk ranking explains scenario-specific rows", () => {
  const selectedWellId = buildMapScenarioViewModel().wells[1]!.id;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5600,
      },
    },
  });
  const selectedRow = viewModel.wellRiskRanking.rows.find((row) => row.wellId === selectedWellId);

  assert.equal(selectedRow?.changeStatus, "worsened");
  assert.match(selectedRow?.whyThisWellMatters ?? "", /drawdown|interface|risk/);
  assert.ok(selectedRow?.displayValues.riskRatio.length);
  assert.ok(selectedRow?.displayValues.headChange.endsWith(" m"));
  assert.ok(selectedRow?.displayValues.interfaceChange.endsWith(" m"));
});

test("map scenario well evidence includes every modeled well", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.equal(viewModel.wellEvidence.rows.length, viewModel.wells.length);
  assert.deepEqual(
    new Set(viewModel.wellEvidence.rows.map((row) => row.wellId)),
    new Set(viewModel.wells.map((well) => well.id)),
  );
  assert.ok(viewModel.wellEvidence.rows.every((row) => row.whyThisWellMatters.length > 0));
  assert.ok(viewModel.wellEvidence.rows.every((row) => ["worsened", "improved", "unchanged"].includes(row.changeStatus)));
});

test("map scenario well evidence exposes pumping scenario calculation readouts", () => {
  const selectedWellId = buildMapScenarioViewModel().wells[1]!.id;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5600,
      },
    },
  });
  const requiredItemIds = [
    "pumping",
    "qcrit",
    "risk-ratio",
    "risk-level",
    "head",
    "interface",
    "screen-bottom",
    "local-k",
  ];

  for (const itemId of requiredItemIds) {
    const item = evidenceItem(viewModel, selectedWellId, itemId);
    assert.ok(item.currentValue.length > 0);
    assert.ok(item.helperText.length > 0);
  }

  const head = evidenceItem(viewModel, selectedWellId, "head");
  const interfaceDepth = evidenceItem(viewModel, selectedWellId, "interface");
  assert.notEqual(head.baselineValue, "-");
  assert.notEqual(head.currentValue, "-");
  assert.notEqual(head.changeValue, "-");
  assert.notEqual(interfaceDepth.baselineValue, "-");
  assert.notEqual(interfaceDepth.currentValue, "-");
  assert.notEqual(interfaceDepth.changeValue, "-");
  assert.notEqual(evidenceItem(viewModel, selectedWellId, "risk-level").baselineValue, "-");
  assert.notEqual(evidenceItem(viewModel, selectedWellId, "risk-level").currentValue, "-");
});

test("map scenario well evidence includes explanatory notes and Stage 1 disclaimer", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.ok(viewModel.wellEvidence.calculationNotes.length >= 3);
  assert.ok(viewModel.wellEvidence.calculationNotes.some((note) => note.id === "risk-ratio"));
  assert.ok(viewModel.wellEvidence.calculationNotes.every((note) => note.title.length > 0 && note.body.length > 0));
  assert.ok(viewModel.wellEvidence.provenanceNotes.length >= 3);
  assert.ok(viewModel.wellEvidence.provenanceNotes.some((note) => note.id === "stage1-grid"));
  assert.ok(viewModel.wellEvidence.provenanceNotes.every((note) => note.title.length > 0 && note.body.length > 0));
  assert.ok(viewModel.wellEvidence.stage1Disclaimer.includes("simplified Stage 1"));
  assert.ok(viewModel.wellEvidence.stage1Disclaimer.includes("not calibrated"));
  assert.ok(viewModel.wellEvidence.stage1Disclaimer.includes("not regulatory"));
});

test("map scenario printable brief explains baseline Stage 1 conditions", () => {
  const viewModel = buildMapScenarioViewModel();
  const brief = viewModel.scenarioBrief;

  assert.equal(brief.title, "Halocline Stage 1 Scenario Brief");
  assert.equal(brief.scenarioStatusLabel, "Baseline");
  assert.equal(brief.headline, viewModel.scenarioNarrative.headline);
  assert.ok(brief.body.includes("No scenario changes"));
  assert.deepEqual(brief.beforeAfterCards, viewModel.scenarioNarrative.beforeAfterCards);
  assert.ok(brief.calibrationItems.some((item) => item.id === "active-head-range"));
  assert.ok(brief.calibrationItems.some((item) => item.id === "warnings" && item.value !== "0"));
  assert.ok(brief.modelAssumptions.some((assumption) => assumption.id === "regional-gradient"));
  assert.ok(brief.changeExplanations.some((explanation) => explanation.includes("Baseline run")));
  assert.ok(brief.warnings.some((warning) => warning.message.includes("aquifer-base guardrail")));
  assert.ok(brief.stage1Disclaimer.includes("simplified Stage 1"));
  assert.ok(brief.stage1Disclaimer.includes("not calibrated"));
  assert.ok(brief.stage1Disclaimer.includes("not regulatory"));
});

test("map scenario printable brief summarizes modified scenarios with well priority rows", () => {
  const selectedWellId = buildMapScenarioViewModel().wells[1]!.id;
  const viewModel = buildMapScenarioViewModel({
    input: {
      wellPumpingCubicMetersPerDayById: {
        [selectedWellId]: 5600,
      },
    },
  });
  const brief = viewModel.scenarioBrief;

  assert.equal(brief.scenarioStatusLabel, "Modified");
  assert.ok(brief.summary.length > 0);
  assert.ok(brief.dominantChange.length > 0);
  assert.equal(brief.wellPriorityRows.length, viewModel.wells.length);
  assert.equal(brief.wellPriorityRows[0]?.wellId, selectedWellId);
  assert.ok(brief.wellPriorityRows.every((row) => row.whyThisWellMatters.length > 0));
});

test("map scenario printable brief preserves warning details", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      modelTuning: {
        regionalGradientMetersPerKilometer: 0,
        baseRechargeMillimetersPerYear: -100,
        hydraulicConductivityScale: -1,
      },
    },
  });
  const brief = viewModel.scenarioBrief;

  assert.ok(brief.warnings.length > 0);
  assert.deepEqual(brief.warnings, viewModel.diagnostics.warningDetails);
  assert.equal(
    brief.calibrationItems.find((item) => item.id === "warnings")?.value,
    String(viewModel.diagnostics.warningDetails.length),
  );
});

test("map scenario view model returns one risk-colored marker per real-domain placeholder well", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.equal(viewModel.wells.length, biscayneStage1Dataset.wells.length);
  assert.ok(viewModel.wells.every((well) => well.riskColor.startsWith("#")));
  assert.ok(viewModel.wells.every((well) => ["low", "moderate", "high", "critical"].includes(well.riskLevel)));
});

test("map scenario view model includes modeled canal metadata", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.equal(viewModel.canals.length, biscayneStage1Dataset.canals.length);
  for (const canal of viewModel.canals) {
    assert.ok(canal.polyline.length > 0);
    assert.ok(canal.fixedHeadCellCount > 0);
    assert.equal(canal.fixedHeadCellIds.length, canal.fixedHeadCellCount);
    assert.equal(typeof canal.baselineStageMeters, "number");
    assert.equal(typeof canal.currentStageMeters, "number");
  }
});

test("map scenario wells include inspection fields for Sprint 5C", () => {
  const viewModel = buildMapScenarioViewModel();

  for (const well of viewModel.wells) {
    assert.equal(typeof well.screenBottomDepthMeters, "number");
    assert.equal(typeof well.pumpingCubicMetersPerDay, "number");
    assert.ok(well.localHeadMeters === null || typeof well.localHeadMeters === "number");
    assert.ok(well.interfaceDepthMeters === null || typeof well.interfaceDepthMeters === "number");
    assert.ok(well.qCritCubicMetersPerDay === null || typeof well.qCritCubicMetersPerDay === "number");
    assert.ok(well.riskRatio === null || typeof well.riskRatio === "number");
    assert.ok(well.localHydraulicConductivityMetersPerDay === null || typeof well.localHydraulicConductivityMetersPerDay === "number");
  }
});

test("map scenario view model includes finite head and interface ranges", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.ok(Number.isFinite(viewModel.ranges.headMeters.min));
  assert.ok(Number.isFinite(viewModel.ranges.headMeters.max));
  assert.ok(viewModel.ranges.headMeters.max > viewModel.ranges.headMeters.min);
  assert.ok(Number.isFinite(viewModel.ranges.interfaceDepthMeters.min));
  assert.ok(Number.isFinite(viewModel.ranges.interfaceDepthMeters.max));
  assert.ok(viewModel.ranges.interfaceDepthMeters.max > viewModel.ranges.interfaceDepthMeters.min);
});

test("map scenario view model exposes model layers as available", () => {
  const viewModel = buildMapScenarioViewModel();
  const layerAvailability = new Map(
    viewModel.layers.map((layer) => [layer.id, { enabled: layer.enabled, available: layer.available }]),
  );

  assert.deepEqual(layerAvailability.get("head"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("interface"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("risk"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("canals"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("reference-domain"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("reference-canals"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("isochlor-2018"), { enabled: true, available: true });
  assert.deepEqual(layerAvailability.get("isochlor-2022"), { enabled: true, available: true });
});

test("map scenario view model includes Sprint 7A reference layers", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.ok(Number.isFinite(viewModel.referenceBounds.west));
  assert.ok(Number.isFinite(viewModel.referenceBounds.east));
  assert.ok(viewModel.referenceLayers.domain.data.features.length > 0);
  assert.ok(viewModel.referenceLayers.canals.data.features.length > 0);
  assert.ok(viewModel.referenceLayers.isochlor2018.data.features.length > 0);
  assert.ok(viewModel.referenceLayers.isochlor2022.data.features.length > 0);
  assert.ok(
    viewModel.dataProvenance.some((entry) => entry.id === viewModel.referenceLayers.isochlor2022.id),
  );
});

test("map scenario view model includes aggregate model diagnostics", () => {
  const viewModel = buildMapScenarioViewModel();

  assert.equal(viewModel.diagnostics.converged, true);
  assert.ok(viewModel.diagnostics.iterationCount > 0);
  assert.equal(viewModel.diagnostics.massBalanceStatus, "ok");
  assert.ok((viewModel.diagnostics.massBalanceErrorPercent ?? 100) < 1);
  assert.ok(viewModel.diagnostics.runTimeMilliseconds >= 0);
  assert.ok(
    viewModel.diagnostics.warnings.some((warning) => warning.includes("aquifer-base guardrail")),
  );
  assert.ok(
    viewModel.diagnostics.warningDetails.some((warning) => warning.severity === "caution"),
  );
  assert.equal(viewModel.calibrationReadout.warningCount, viewModel.diagnostics.warnings.length);
  assert.ok(viewModel.calibrationReadout.activeHeadRangeMeters.max >= viewModel.calibrationReadout.activeHeadRangeMeters.min);
  assert.ok(viewModel.calibrationReadout.interfaceDepthRangeMeters.max >= viewModel.calibrationReadout.interfaceDepthRangeMeters.min);
  assert.ok(viewModel.calibrationReadout.tuningValues.some((value) => value.id === "k-scale"));
  assert.ok(viewModel.modelAssumptions.some((assumption) => assumption.id === "regional-gradient"));
  assert.ok(viewModel.changeExplanations.some((explanation) => explanation.includes("Baseline run")));
  assert.ok(viewModel.highestRiskWell);
  assert.ok(viewModel.wells.some((well) => well.id === viewModel.highestRiskWell?.id));
});

test("map scenario view model exposes plausibility warnings", () => {
  const viewModel = buildMapScenarioViewModel({
    input: {
      modelTuning: {
        regionalGradientMetersPerKilometer: 0,
        baseRechargeMillimetersPerYear: -100,
        hydraulicConductivityScale: -1,
      },
    },
  });

  assert.equal(viewModel.scenarioStatus, "modified");
  assert.ok(viewModel.diagnostics.warnings.length > 0);
  assert.ok(viewModel.diagnostics.warnings.some((warning) => warning.includes("Regional gradient")));
  assert.ok(viewModel.diagnostics.warningDetails.some((warning) => warning.severity === "caution"));
  assert.equal(viewModel.calibrationReadout.warningCount, viewModel.diagnostics.warnings.length);
  assert.ok(viewModel.changeExplanations.some((explanation) => explanation.includes("regional gradient")));
  assert.ok(["watch", "elevated", "severe"].includes(viewModel.scenarioNarrative.riskPosture));
  assert.ok(viewModel.scenarioNarrative.beforeAfterCards.some((card) => card.id === "warnings"));
});

test("map scenario view model serializes and parses cleanly", () => {
  const viewModel = buildMapScenarioViewModel();
  const parsed = JSON.parse(JSON.stringify(viewModel)) as typeof viewModel;

  assert.equal(parsed.grid.cells.length, viewModel.grid.cells.length);
  assert.equal(parsed.canals.length, viewModel.canals.length);
  assert.equal(parsed.wells.length, viewModel.wells.length);
  assert.equal(parsed.layers.find((layer) => layer.id === "risk")?.available, true);
  assert.equal(parsed.layers.find((layer) => layer.id === "isochlor-2022")?.available, true);
  assert.ok(parsed.grid.cells.every((cell) => typeof cell.headColor === "string"));
  assert.ok(parsed.comparisonSummary);
  assert.ok(parsed.scenarioNarrative);
  assert.ok(Array.isArray(parsed.scenarioNarrative.beforeAfterCards));
  assert.ok(parsed.wellRiskRanking);
  assert.ok(Array.isArray(parsed.wellRiskRanking.rows));
  assert.ok(Array.isArray(parsed.wellRiskRanking.sortOptions));
  assert.ok(parsed.wellEvidence);
  assert.ok(Array.isArray(parsed.wellEvidence.rows));
  assert.ok(Array.isArray(parsed.wellEvidence.calculationNotes));
  assert.ok(Array.isArray(parsed.wellEvidence.provenanceNotes));
  assert.ok(parsed.scenarioBrief);
  assert.ok(Array.isArray(parsed.scenarioBrief.beforeAfterCards));
  assert.ok(Array.isArray(parsed.scenarioBrief.wellPriorityRows));
  assert.ok(Array.isArray(parsed.scenarioBrief.calibrationItems));
  assert.ok(Array.isArray(parsed.scenarioPresets));
  assert.ok(parsed.scenarioPresets.some((preset) => preset.id === "combined-stress"));
  assert.ok(parsed.scenarioSnapshot);
  assert.ok(parsed.scenarioSnapshot.metrics);
  assert.equal(typeof parsed.scenarioSnapshot.displayValues.highestRiskWell, "string");
  assert.ok(parsed.calibrationReadout);
  assert.ok(Array.isArray(parsed.modelAssumptions));
  assert.ok(Array.isArray(parsed.changeExplanations));
  assert.ok(Array.isArray(parsed.diagnostics.warnings));
  assert.ok(Array.isArray(parsed.diagnostics.warningDetails));
  assert.deepEqual(parsed.input.resolvedModelTuning, viewModel.input.resolvedModelTuning);
  assert.ok(parsed.referenceLayers.isochlor2018.data.features.length > 0);
  assert.ok(parsed.dataProvenance.length > 0);
});
