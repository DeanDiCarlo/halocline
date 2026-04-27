import { baselineScenario as defaultBaselineScenario } from "./baselineScenario.ts";
import { solveDarcyHead, type DarcySolverConfig } from "./darcySolver.ts";
import { estimateInterfaceDepthFromHead, type InterfaceDepthEstimate } from "./ghybenHerzberg.ts";
import { cloneGrid, createGridIndex } from "./grid.ts";
import {
  defaultModelTuning,
  resolveModelTuning,
  type ModelTuningInput,
  type ResolvedModelTuning,
} from "./modelTuning.ts";
import { computeUpconingRisk } from "./upconing.ts";
import { millimetersPerYearToMetersPerDay } from "../units/conversions.ts";
import type {
  GridCell,
  ModelCellDiffResult,
  ModelDiffResult,
  ModelResult,
  ModelWellDiffResult,
  RiskLevel,
  Scenario,
  Stage1Dataset,
  WellRiskResult,
} from "./types.ts";

export type RunScenarioParams = {
  scenario: Scenario;
  dataset: Stage1Dataset;
  baselineScenario?: Scenario;
  solverConfig?: DarcySolverConfig;
  modelTuning?: ModelTuningInput;
  baselineModelTuning?: ModelTuningInput;
};

type ResolvedScenario = {
  rechargeMultiplier: number;
  seaLevelRiseMeters: number;
  wellPumpingCubicMetersPerDayById: Record<string, number>;
  canalStageMetersById: Record<string, number>;
  modelTuning: ResolvedModelTuning;
};

type CoreRunResult = Omit<ModelResult, "diff" | "summary">;

function finiteOrNull(value: number | undefined): number | null {
  return value === undefined || !Number.isFinite(value) ? null : value;
}

function differenceOrNull(after: number | null, before: number | null): number | null {
  if (after === null || before === null) return null;
  return after - before;
}

function resolvedScenarioFrom(
  scenario: Scenario,
  dataset: Stage1Dataset,
  modelTuning: ResolvedModelTuning,
): ResolvedScenario {
  const wellPumpingCubicMetersPerDayById: Record<string, number> = {};
  const canalStageMetersById: Record<string, number> = {};

  for (const well of dataset.wells) {
    wellPumpingCubicMetersPerDayById[well.id] = well.currentPumpingCubicMetersPerDay;
  }

  for (const adjustment of scenario.pumpingAdjustments) {
    if (adjustment.targetType !== "wellfield") continue;

    for (const well of dataset.wells) {
      if (well.wellfieldId === adjustment.targetId) {
        wellPumpingCubicMetersPerDayById[well.id] = adjustment.pumpingCubicMetersPerDay;
      }
    }
  }

  for (const adjustment of scenario.pumpingAdjustments) {
    if (adjustment.targetType === "well") {
      wellPumpingCubicMetersPerDayById[adjustment.targetId] = adjustment.pumpingCubicMetersPerDay;
    }
  }

  for (const canal of dataset.canals) {
    canalStageMetersById[canal.id] = modelTuning.defaultCanalStageMeters;
  }

  for (const adjustment of scenario.canalStageAdjustments) {
    canalStageMetersById[adjustment.canalId] = adjustment.stageMeters;
  }

  return {
    rechargeMultiplier: scenario.rechargeMultiplier,
    seaLevelRiseMeters: scenario.seaLevelRiseMeters,
    wellPumpingCubicMetersPerDayById,
    canalStageMetersById,
    modelTuning,
  };
}

function finiteOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function tuningWarnings(tuning: ResolvedModelTuning): string[] {
  const warnings: string[] = [];

  if (!Number.isFinite(tuning.initialHeadMeters)) {
    warnings.push("Initial head tuning is not finite; the default initial head was used.");
  }

  if (
    !Number.isFinite(tuning.regionalGradientMetersPerKilometer) ||
    tuning.regionalGradientMetersPerKilometer <= 0
  ) {
    warnings.push("Regional gradient should be positive for a physically plausible inland-to-coastal head pattern.");
  }

  if (
    !Number.isFinite(tuning.baseRechargeMillimetersPerYear) ||
    tuning.baseRechargeMillimetersPerYear < 0
  ) {
    warnings.push("Base recharge should be a non-negative finite value.");
  }

  if (
    !Number.isFinite(tuning.hydraulicConductivityScale) ||
    tuning.hydraulicConductivityScale <= 0
  ) {
    warnings.push("Hydraulic conductivity scale should be positive; the default scale was used for the solve.");
  }

  if (!Number.isFinite(tuning.defaultCanalStageMeters)) {
    warnings.push("Default canal stage is not finite; the default canal stage was used.");
  } else if (tuning.defaultCanalStageMeters < 0 || tuning.defaultCanalStageMeters > 1.2) {
    warnings.push("Default canal stage is outside the Stage 1 tuning slider range.");
  }

  return warnings;
}

function applyScenarioToGrid(
  scenario: Scenario,
  dataset: Stage1Dataset,
  modelTuning: ResolvedModelTuning,
) {
  const resolvedScenario = resolvedScenarioFrom(scenario, dataset, modelTuning);
  const grid = cloneGrid(dataset.grid);
  const gridIndex = createGridIndex(grid);
  const baseRechargeMetersPerDay = millimetersPerYearToMetersPerDay(
    finiteOrDefault(
      modelTuning.baseRechargeMillimetersPerYear,
      defaultModelTuning.baseRechargeMillimetersPerYear,
    ),
  );
  const hydraulicConductivityScale =
    Number.isFinite(modelTuning.hydraulicConductivityScale) &&
    modelTuning.hydraulicConductivityScale > 0
      ? modelTuning.hydraulicConductivityScale
      : defaultModelTuning.hydraulicConductivityScale;
  const initialHeadMeters = finiteOrDefault(
    modelTuning.initialHeadMeters,
    defaultModelTuning.initialHeadMeters,
  );
  const regionalGradientMetersPerKilometer = finiteOrDefault(
    modelTuning.regionalGradientMetersPerKilometer,
    defaultModelTuning.regionalGradientMetersPerKilometer,
  );
  const modelMaxXMeters = dataset.domain.boundingBox.maxXMeters;

  for (const cell of grid.cells) {
    if (cell.active) {
      cell.rechargeMetersPerDay = baseRechargeMetersPerDay * resolvedScenario.rechargeMultiplier;
      cell.hydraulicConductivityMetersPerDay *= hydraulicConductivityScale;
    }
    cell.pumpingCubicMetersPerDay = 0;

    if (cell.isCoastalBoundary) {
      cell.fixedHeadMeters = resolvedScenario.seaLevelRiseMeters;
    }
  }

  for (const cellId of dataset.domain.inlandBoundaryCellIds) {
    const cell = gridIndex.byId.get(cellId);
    if (!cell || !cell.active || cell.isCoastalBoundary) continue;

    const distanceToCoastKilometers = Math.max(
      0,
      (modelMaxXMeters - cell.xCenterMeters) / 1000,
    );
    cell.fixedHeadMeters =
      initialHeadMeters + regionalGradientMetersPerKilometer * distanceToCoastKilometers;
  }

  for (const canal of dataset.canals) {
    for (const cellId of canal.fixedHeadCellIds) {
      const cell = gridIndex.byId.get(cellId);
      if (cell && !cell.isCoastalBoundary) {
        cell.fixedHeadMeters = resolvedScenario.canalStageMetersById[canal.id];
      }
    }
  }

  for (const well of dataset.wells) {
    const cell = gridIndex.byId.get(well.gridCellId);
    if (cell) {
      cell.pumpingCubicMetersPerDay +=
        resolvedScenario.wellPumpingCubicMetersPerDayById[well.id] ?? 0;
    }
  }

  return { grid, resolvedScenario };
}

function cellWellIds(cell: GridCell, dataset: Stage1Dataset): string[] {
  return dataset.wells.filter((well) => well.gridCellId === cell.id).map((well) => well.id);
}

function riskRank(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case "critical":
      return 3;
    case "high":
      return 2;
    case "moderate":
      return 1;
    case "low":
      return 0;
  }
}

function runScenarioCore(
  scenario: Scenario,
  dataset: Stage1Dataset,
  modelTuning: ResolvedModelTuning,
  solverConfig?: DarcySolverConfig,
): CoreRunResult {
  const { grid, resolvedScenario } = applyScenarioToGrid(scenario, dataset, modelTuning);
  const solveResult = solveDarcyHead(grid, {
    ...solverConfig,
    initialHeadMeters:
      solverConfig?.initialHeadMeters ??
      finiteOrDefault(modelTuning.initialHeadMeters, defaultModelTuning.initialHeadMeters),
  });
  const solvedGridIndex = createGridIndex(solveResult.grid);
  const interfaceDepthByCellId = new Map<string, number>();
  const interfaceEstimateByCellId = new Map<string, InterfaceDepthEstimate>();

  for (const cell of solveResult.grid.cells) {
    const interfaceEstimate = estimateInterfaceDepthFromHead({
      freshwaterHeadMeters: cell.headMeters ?? Number.NaN,
      seaLevelMeters: resolvedScenario.seaLevelRiseMeters,
      aquiferBaseDepthMeters: cell.aquiferBaseDepthMeters,
    });
    const interfaceDepthMeters = interfaceEstimate.depthMeters;
    interfaceDepthByCellId.set(cell.id, interfaceDepthMeters);
    interfaceEstimateByCellId.set(cell.id, interfaceEstimate);
    cell.interfaceDepthMeters = interfaceDepthMeters;
  }

  const cells = solveResult.grid.cells.map((cell) => ({
    id: cell.id,
    row: cell.row,
    col: cell.col,
    active: cell.active,
    aquiferBaseDepthMeters: finiteOrNull(cell.aquiferBaseDepthMeters),
    isCoastalBoundary: cell.isCoastalBoundary,
    isCanalBoundary: cell.isCanalBoundary,
    headMeters: finiteOrNull(cell.headMeters),
    interfaceDepthMeters: finiteOrNull(interfaceDepthByCellId.get(cell.id)),
    pumpingCubicMetersPerDay: cell.pumpingCubicMetersPerDay,
    rechargeMetersPerDay: cell.rechargeMetersPerDay,
    fixedHeadMeters: finiteOrNull(cell.fixedHeadMeters),
    wellIds: cellWellIds(cell, dataset),
  }));

  const wellRiskResults: WellRiskResult[] = dataset.wells.map((well) => {
    const cell = solvedGridIndex.byId.get(well.gridCellId);
    const localHeadMeters = finiteOrNull(cell?.headMeters);
    const interfaceDepthMeters = finiteOrNull(interfaceDepthByCellId.get(well.gridCellId));
    const upconingRisk = computeUpconingRisk({
      pumpingCubicMetersPerDay: resolvedScenario.wellPumpingCubicMetersPerDayById[well.id] ?? 0,
      localHydraulicConductivityMetersPerDay: cell?.hydraulicConductivityMetersPerDay ?? 0,
      wellScreenBottomDepthMeters: well.screenBottomDepthMeters,
      interfaceDepthMeters: interfaceDepthMeters ?? 0,
    });

    return {
      wellId: well.id,
      wellName: well.name,
      gridCellId: well.gridCellId,
      pumpingCubicMetersPerDay: resolvedScenario.wellPumpingCubicMetersPerDayById[well.id] ?? 0,
      localHeadMeters,
      interfaceDepthMeters,
      qCritCubicMetersPerDay: finiteOrNull(upconingRisk.qCritCubicMetersPerDay),
      riskRatio: finiteOrNull(upconingRisk.riskRatio),
      riskLevel: upconingRisk.riskLevel,
    };
  });
  const diagnostics = {
    ...solveResult.diagnostics,
    warnings: [
      ...solveResult.diagnostics.warnings,
      ...interfaceGuardrailWarnings(solveResult.grid.cells, interfaceEstimateByCellId),
      ...tuningWarnings(modelTuning),
      ...plausibilityWarnings(cells),
    ],
  };

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    cells,
    headGridMeters: solveResult.headGridMeters,
    interfaceDepthGridMeters: cells.map((cell) => cell.interfaceDepthMeters ?? Number.NaN),
    wellRiskResults,
    diagnostics,
  };
}

function interfaceGuardrailWarnings(
  cells: GridCell[],
  interfaceEstimateByCellId: Map<string, InterfaceDepthEstimate>,
): string[] {
  const activeCells = cells.filter((cell) => cell.active);
  const clampedCells = activeCells.filter(
    (cell) => interfaceEstimateByCellId.get(cell.id)?.clampedAtAquiferBase,
  );
  const invertedCells = activeCells.filter(
    (cell) => interfaceEstimateByCellId.get(cell.id)?.invertedFreshwaterLens,
  );
  const warnings: string[] = [];

  if (clampedCells.length > 0) {
    const aquiferBaseDepthMeters =
      clampedCells.find((cell) => Number.isFinite(cell.aquiferBaseDepthMeters))
        ?.aquiferBaseDepthMeters ?? 0;
    warnings.push(
      `${clampedCells.length} active cell${
        clampedCells.length === 1 ? "" : "s"
      } exceeded the provisional ${aquiferBaseDepthMeters} m aquifer-base guardrail; interface depths were capped for Stage 1 display.`,
    );
  }

  if (invertedCells.length > 0) {
    warnings.push(
      `${invertedCells.length} active cell${
        invertedCells.length === 1 ? "" : "s"
      } had freshwater head below sea level; the local freshwater lens is inverted and interface depth was capped at 0 m.`,
    );
  }

  return warnings;
}

function plausibilityWarnings(cells: CoreRunResult["cells"]): string[] {
  const warnings: string[] = [];
  const activeCells = cells.filter((cell) => cell.active);
  const activeHeads = activeCells
    .map((cell) => cell.headMeters)
    .filter((head): head is number => head !== null && Number.isFinite(head));
  const activeInterfaces = activeCells
    .map((cell) => cell.interfaceDepthMeters)
    .filter((depth): depth is number => depth !== null && Number.isFinite(depth));

  if (activeCells.length > 0 && activeHeads.length === 0) {
    warnings.push("No finite active-cell head outputs were produced.");
  }

  if (activeCells.length > 0 && activeInterfaces.length === 0) {
    warnings.push("No finite active-cell interface-depth outputs were produced.");
  }

  if (activeHeads.some((head) => head < -2 || head > 12)) {
    warnings.push("One or more active-cell heads are outside the Stage 1 plausibility range of -2 m to 12 m.");
  }

  if (activeInterfaces.some((depth) => depth > 450)) {
    warnings.push("One or more interface-depth estimates exceed 450 m; treat this scenario as a tuning stress case.");
  }

  return warnings;
}

function buildDiff(result: CoreRunResult, baselineResult: CoreRunResult): ModelDiffResult {
  const baselineCellsById = new Map(baselineResult.cells.map((cell) => [cell.id, cell]));
  const baselineWellsById = new Map(
    baselineResult.wellRiskResults.map((wellRisk) => [wellRisk.wellId, wellRisk]),
  );

  const cellDiffs: ModelCellDiffResult[] = result.cells.map((cell) => {
    const baselineCell = baselineCellsById.get(cell.id);

    return {
      cellId: cell.id,
      headDifferenceMeters: differenceOrNull(cell.headMeters, baselineCell?.headMeters ?? null),
      interfaceDepthDifferenceMeters: differenceOrNull(
        cell.interfaceDepthMeters,
        baselineCell?.interfaceDepthMeters ?? null,
      ),
    };
  });

  const wellDiffs: ModelWellDiffResult[] = result.wellRiskResults.map((wellRisk) => {
    const baselineWellRisk = baselineWellsById.get(wellRisk.wellId);

    return {
      wellId: wellRisk.wellId,
      riskLevelBefore: baselineWellRisk?.riskLevel ?? "low",
      riskLevelAfter: wellRisk.riskLevel,
      riskRatioDifference: differenceOrNull(
        wellRisk.riskRatio,
        baselineWellRisk?.riskRatio ?? null,
      ),
      qCritDifferenceCubicMetersPerDay: differenceOrNull(
        wellRisk.qCritCubicMetersPerDay,
        baselineWellRisk?.qCritCubicMetersPerDay ?? null,
      ),
    };
  });

  return { cellDiffs, wellDiffs };
}

function summarizeScenario(result: CoreRunResult, diff: ModelDiffResult | null): string {
  const criticalCount = result.wellRiskResults.filter(
    (wellRisk) => wellRisk.riskLevel === "critical",
  ).length;
  const highCount = result.wellRiskResults.filter((wellRisk) => wellRisk.riskLevel === "high")
    .length;
  const worsenedWellCount =
    diff?.wellDiffs.filter(
      (wellDiff) => riskRank(wellDiff.riskLevelAfter) > riskRank(wellDiff.riskLevelBefore),
    ).length ?? 0;

  const riskSentence =
    criticalCount > 0
      ? `${criticalCount} well${criticalCount === 1 ? "" : "s"} exceed the simplified upconing threshold.`
      : highCount > 0
        ? `${highCount} well${highCount === 1 ? "" : "s"} sit above 75% of the simplified upconing threshold.`
        : "No wells exceed the simplified upconing threshold.";
  const diffSentence =
    diff === null
      ? "No baseline comparison was generated."
      : `${worsenedWellCount} well${worsenedWellCount === 1 ? "" : "s"} worsened relative to baseline.`;
  const convergenceSentence = `Solver ${
    result.diagnostics.converged ? "converged" : "did not converge"
  } in ${result.diagnostics.iterationCount} iterations.`;

  return `${riskSentence} ${diffSentence} ${convergenceSentence}`;
}

export function runScenario(params: RunScenarioParams): ModelResult {
  const modelTuning = resolveModelTuning(params.modelTuning);
  const baselineModelTuning = resolveModelTuning(params.baselineModelTuning);
  const result = runScenarioCore(
    params.scenario,
    params.dataset,
    modelTuning,
    params.solverConfig,
  );
  const baselineResult = runScenarioCore(
    params.baselineScenario ?? defaultBaselineScenario,
    params.dataset,
    baselineModelTuning,
    params.solverConfig,
  );
  const diff = buildDiff(result, baselineResult);

  return {
    ...result,
    diff,
    summary: summarizeScenario(result, diff),
  };
}
