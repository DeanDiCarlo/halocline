import { biscayneStage1Dataset } from "../data/biscayneStage1Dataset.ts";
import { baselineScenario } from "../model/baselineScenario.ts";
import { runScenario } from "../model/scenarioRunner.ts";
import type { ModelCellResult, ModelRunDiagnostics, RiskLevel, Scenario, Stage1Dataset } from "../model/types.ts";

export type CheckpointScenarioInput = {
  rechargeMultiplier?: number;
  seaLevelRiseMeters?: number;
  wellPumpingCubicMetersPerDayById?: Record<string, number>;
};

export type CheckpointGridCellResult = Omit<ModelCellResult, "fixedHeadMeters">;

export type CheckpointWellRiskResult = {
  wellId: string;
  wellName: string;
  gridCellId: string;
  pumpingCubicMetersPerDay: number;
  localHeadMeters: number | null;
  interfaceDepthMeters: number | null;
  qCritCubicMetersPerDay: number | null;
  riskRatio: number | null;
  riskLevel: RiskLevel;
};

export type CheckpointScenarioResult = {
  input: Required<Pick<CheckpointScenarioInput, "rechargeMultiplier" | "seaLevelRiseMeters">> & {
    wellPumpingCubicMetersPerDayById: Record<string, number>;
  };
  grid: {
    rowCount: number;
    colCount: number;
    cells: CheckpointGridCellResult[];
    minHeadMeters: number;
    maxHeadMeters: number;
    representativeHeadMeters: number | null;
  };
  wells: CheckpointWellRiskResult[];
  diagnostics: ModelRunDiagnostics;
  summary: string;
};

function finiteHeads(cells: ModelCellResult[]): number[] {
  return cells
    .map((cell) => cell.headMeters)
    .filter((headMeters): headMeters is number => headMeters !== null);
}

function checkpointInputToScenario(
  input: CheckpointScenarioInput,
  dataset: Stage1Dataset,
): {
  scenario: Scenario;
  resolvedInput: CheckpointScenarioResult["input"];
} {
  const wellPumpingCubicMetersPerDayById: Record<string, number> = {};

  for (const well of dataset.wells) {
    wellPumpingCubicMetersPerDayById[well.id] =
      input.wellPumpingCubicMetersPerDayById?.[well.id] ??
      well.currentPumpingCubicMetersPerDay;
  }

  const scenario: Scenario = {
    id: "checkpoint",
    name: "Stage 1 Checkpoint",
    description: "Internal checkpoint scenario generated from local UI controls.",
    rechargeMultiplier: input.rechargeMultiplier ?? 1,
    seaLevelRiseMeters: input.seaLevelRiseMeters ?? 0,
    pumpingAdjustments: Object.entries(wellPumpingCubicMetersPerDayById).map(
      ([wellId, pumpingCubicMetersPerDay]) => ({
        targetType: "well" as const,
        targetId: wellId,
        pumpingCubicMetersPerDay,
      }),
    ),
    canalStageAdjustments: [],
  };

  return {
    scenario,
    resolvedInput: {
      rechargeMultiplier: scenario.rechargeMultiplier,
      seaLevelRiseMeters: scenario.seaLevelRiseMeters,
      wellPumpingCubicMetersPerDayById,
    },
  };
}

export function runCheckpointScenario(
  input: CheckpointScenarioInput = {},
  dataset: Stage1Dataset = biscayneStage1Dataset,
): CheckpointScenarioResult {
  const { scenario, resolvedInput } = checkpointInputToScenario(input, dataset);
  const modelResult = runScenario({
    scenario,
    dataset,
    baselineScenario,
  });
  const heads = finiteHeads(modelResult.cells);
  const representativeCell = modelResult.cells.find(
    (cell) => cell.id === dataset.wells[0]?.gridCellId,
  );

  return {
    input: resolvedInput,
    grid: {
      rowCount: dataset.grid.rowCount,
      colCount: dataset.grid.colCount,
      cells: modelResult.cells.map(({ fixedHeadMeters: _fixedHeadMeters, ...cell }) => cell),
      minHeadMeters: Math.min(...heads),
      maxHeadMeters: Math.max(...heads),
      representativeHeadMeters: representativeCell?.headMeters ?? null,
    },
    wells: modelResult.wellRiskResults,
    diagnostics: modelResult.diagnostics,
    summary: modelResult.summary,
  };
}
