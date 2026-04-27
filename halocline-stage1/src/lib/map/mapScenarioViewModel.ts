import { biscayneStage1Dataset } from "../data/biscayneStage1Dataset.ts";
import {
  biscayneDataProvenance,
  biscayneReferenceBounds,
  biscayneReferenceLayers,
  type BiscayneDataProvenanceEntry,
  type BiscayneReferenceLayer,
} from "../data/biscayneReferenceLayers.ts";
import { baselineScenario } from "../model/baselineScenario.ts";
import {
  defaultModelTuning,
  modelTuningIsDefault,
  resolveModelTuning,
  type ModelTuningInput,
  type ResolvedModelTuning,
} from "../model/modelTuning.ts";
import { runScenario } from "../model/scenarioRunner.ts";
import type { RiskLevel, Scenario, Stage1Dataset } from "../model/types.ts";
import {
  buildMapShellViewModel,
  type MapShellCanal,
  type MapPoint,
  type MapShellViewModel,
} from "./mapShellViewModel.ts";

export type MapScenarioCell = {
  id: string;
  row: number;
  col: number;
  polygon: MapPoint[];
  active: boolean;
  isCoastalBoundary: boolean;
  isCanalBoundary: boolean;
  headMeters: number | null;
  interfaceDepthMeters: number | null;
  headDifferenceMeters: number | null;
  interfaceDepthDifferenceMeters: number | null;
  headColor: string;
  interfaceOpacity: number;
  headDifferenceColor: string;
  interfaceDifferenceColor: string;
  interfaceDifferenceOpacity: number;
};

export type MapScenarioWell = {
  id: string;
  name: string;
  wellfieldId: string;
  gridCellId: string;
  point: MapPoint;
  screenBottomDepthMeters: number;
  localHydraulicConductivityMetersPerDay: number | null;
  pumpingCubicMetersPerDay: number;
  localHeadMeters: number | null;
  interfaceDepthMeters: number | null;
  qCritCubicMetersPerDay: number | null;
  riskRatio: number | null;
  riskLevel: RiskLevel;
  riskColor: string;
  riskLevelBefore: RiskLevel;
  riskLevelAfter: RiskLevel;
  riskRatioDifference: number | null;
  qCritDifferenceCubicMetersPerDay: number | null;
  localHeadDifferenceMeters: number | null;
  interfaceDepthDifferenceMeters: number | null;
  riskChangeColor: string;
};

export type MapScenarioCanal = MapShellCanal & {
  baselineStageMeters: number;
  currentStageMeters: number;
  fixedHeadCellCount: number;
  fixedHeadCellIds: string[];
};

export type MapScenarioInput = {
  rechargeMultiplier?: number;
  seaLevelRiseMeters?: number;
  wellPumpingCubicMetersPerDayById?: Record<string, number>;
  wellfieldPumpingCubicMetersPerDayById?: Record<string, number>;
  canalStageMetersById?: Record<string, number>;
  modelTuning?: ModelTuningInput;
};

export type ResolvedMapScenarioInput = Required<
  Pick<MapScenarioInput, "rechargeMultiplier" | "seaLevelRiseMeters">
> & {
  wellPumpingCubicMetersPerDayById: Record<string, number>;
  wellfieldPumpingCubicMetersPerDayById: Record<string, number>;
  canalStageMetersById: Record<string, number>;
  modelTuning: ModelTuningInput;
  resolvedWellPumpingCubicMetersPerDayById: Record<string, number>;
  resolvedCanalStageMetersById: Record<string, number>;
  resolvedModelTuning: ResolvedModelTuning;
};

export type MapComparisonSummary = {
  highestRiskWellId: string | null;
  highestRiskWellName: string | null;
  highestRiskLevel: RiskLevel | null;
  worsenedWellCount: number;
  largestHeadDeclineCellId: string | null;
  largestHeadDeclineMeters: number | null;
  largestInterfaceDepthDecreaseCellId: string | null;
  largestInterfaceDepthDecreaseMeters: number | null;
};

export type MapWarningSeverity = "info" | "caution" | "severe";

export type MapWarningDetail = {
  severity: MapWarningSeverity;
  message: string;
};

export type ModelAssumption = {
  id: string;
  label: string;
  displayValue: string;
  explanation: string;
};

export type CalibrationReadout = {
  activeHeadRangeMeters: {
    min: number;
    max: number;
  };
  interfaceDepthRangeMeters: {
    min: number;
    max: number;
  };
  maxDrawdownMeters: number | null;
  highestRiskWellName: string | null;
  highestRiskLevel: RiskLevel | null;
  warningCount: number;
  tuningValues: ModelAssumption[];
};

export type ScenarioRiskPosture = "neutral" | "watch" | "elevated" | "severe";

export type ScenarioNarrativeCard = {
  id: string;
  label: string;
  baselineValue: string;
  currentValue: string;
  posture: ScenarioRiskPosture;
  helperText: string;
};

export type ScenarioNarrative = {
  headline: string;
  body: string;
  dominantChange: string;
  riskPosture: ScenarioRiskPosture;
  beforeAfterCards: ScenarioNarrativeCard[];
  stage1Disclaimer: string;
};

export type WellRankingSortId =
  | "decision-priority"
  | "risk-ratio"
  | "drawdown"
  | "interface-decrease"
  | "pumping"
  | "qcrit";

export type WellChangeStatus = "worsened" | "improved" | "unchanged";

export type WellRiskRankingRow = {
  rank: number;
  wellId: string;
  wellName: string;
  riskLevel: RiskLevel;
  riskRatio: number | null;
  pumpingCubicMetersPerDay: number;
  qCritCubicMetersPerDay: number | null;
  headChangeMeters: number | null;
  interfaceChangeMeters: number | null;
  changeStatus: WellChangeStatus;
  displayValues: {
    riskLevel: string;
    riskRatio: string;
    pumping: string;
    qCrit: string;
    headChange: string;
    interfaceChange: string;
  };
  whyThisWellMatters: string;
};

export type WellRiskRankingSortOption = {
  id: WellRankingSortId;
  label: string;
  wellIds: string[];
};

export type WellRiskRanking = {
  defaultSort: WellRankingSortId;
  rows: WellRiskRankingRow[];
  sortOptions: WellRiskRankingSortOption[];
};

export type ScenarioBriefCalibrationItem = {
  id: string;
  label: string;
  value: string;
};

export type ScenarioBrief = {
  title: string;
  scenarioStatusLabel: string;
  summary: string;
  headline: string;
  body: string;
  dominantChange: string;
  riskPosture: ScenarioRiskPosture;
  beforeAfterCards: ScenarioNarrativeCard[];
  wellPriorityRows: WellRiskRankingRow[];
  calibrationItems: ScenarioBriefCalibrationItem[];
  modelAssumptions: ModelAssumption[];
  changeExplanations: string[];
  warnings: MapWarningDetail[];
  stage1Disclaimer: string;
};

export type WellEvidenceItem = {
  id: string;
  label: string;
  baselineValue: string;
  currentValue: string;
  changeValue: string;
  helperText: string;
};

export type WellEvidenceRow = {
  wellId: string;
  wellName: string;
  changeStatus: WellChangeStatus;
  whyThisWellMatters: string;
  items: WellEvidenceItem[];
};

export type WellEvidenceNote = {
  id: string;
  title: string;
  body: string;
};

export type WellEvidence = {
  rows: WellEvidenceRow[];
  calculationNotes: WellEvidenceNote[];
  provenanceNotes: WellEvidenceNote[];
  stage1Disclaimer: string;
};

export type ScenarioPresetId =
  | "baseline"
  | "dry-recharge"
  | "sea-level-rise"
  | "pumping-stress"
  | "combined-stress";

export type ScenarioPresetControl =
  | "recharge"
  | "sea-level"
  | "wellfield-pumping";

export type ScenarioPresetInputPatch = {
  rechargeMultiplier?: number;
  seaLevelRiseMeters?: number;
  selectedWellfieldPumpingCubicMetersPerDay?: number;
};

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  affectedControls: ScenarioPresetControl[];
  inputPatch: ScenarioPresetInputPatch;
};

export type ScenarioSnapshot = {
  scenarioStatusLabel: string;
  headline: string;
  dominantChange: string;
  riskPosture: ScenarioRiskPosture;
  highestRiskWellId: string | null;
  highestRiskWellName: string | null;
  highestRiskLevel: RiskLevel | null;
  displayValues: {
    highestRiskWell: string;
    worsenedWells: string;
    maxDrawdown: string;
    warnings: string;
  };
  metrics: {
    worsenedWellCount: number;
    maxDrawdownMeters: number;
    warningCount: number;
    riskPostureRank: number;
  };
  summary: string;
  stage1Disclaimer: string;
};

export type MapScenarioViewModel = Omit<MapShellViewModel, "grid" | "canals" | "wells" | "layers"> & {
  input: ResolvedMapScenarioInput;
  scenarioStatus: "baseline" | "modified";
  scenarioPresets: ScenarioPreset[];
  scenarioSnapshot: ScenarioSnapshot;
  comparisonSummary: MapComparisonSummary;
  scenarioNarrative: ScenarioNarrative;
  wellRiskRanking: WellRiskRanking;
  wellEvidence: WellEvidence;
  scenarioBrief: ScenarioBrief;
  calibrationReadout: CalibrationReadout;
  modelAssumptions: ModelAssumption[];
  changeExplanations: string[];
  grid: {
    rowCount: number;
    colCount: number;
    cells: MapScenarioCell[];
  };
  canals: MapScenarioCanal[];
  wells: MapScenarioWell[];
  layers: MapShellViewModel["layers"];
  referenceBounds: typeof biscayneReferenceBounds;
  referenceLayers: Record<string, BiscayneReferenceLayer>;
  dataProvenance: BiscayneDataProvenanceEntry[];
  ranges: {
    headMeters: {
      min: number;
      max: number;
    };
    interfaceDepthMeters: {
      min: number;
      max: number;
    };
  };
  diagnostics: {
    converged: boolean;
    iterationCount: number;
    massBalanceResidualCubicMetersPerDay: number | null;
    massBalanceErrorPercent: number | null;
    massBalanceStatus: "ok" | "warning" | "failure";
    runTimeMilliseconds: number;
    warnings: string[];
    warningDetails: MapWarningDetail[];
  };
  summary: string;
  highestRiskWell: MapScenarioWell | null;
};

function finiteValues(values: Array<number | null>): number[] {
  return values.filter((value): value is number => value !== null && Number.isFinite(value));
}

function rangeFor(values: Array<number | null>): { min: number; max: number } {
  const finite = finiteValues(values);
  return {
    min: Math.min(...finite),
    max: Math.max(...finite),
  };
}

function normalize(value: number | null, min: number, max: number): number {
  if (value === null) return 0;
  const span = Math.max(0.0001, max - min);
  return Math.max(0, Math.min(1, (value - min) / span));
}

function headColorFor(value: number | null, min: number, max: number): string {
  if (value === null) return "rgba(255, 255, 255, 0)";

  const ratio = normalize(value, min, max);
  const lightness = 91 - ratio * 45;
  const saturation = 42 + ratio * 16;
  return `hsl(201 ${saturation}% ${lightness}%)`;
}

function differenceColorFor(value: number | null, maxAbs: number): string {
  if (value === null || !Number.isFinite(value) || maxAbs <= 0) {
    return "#e9eef0";
  }

  const ratio = Math.min(1, Math.abs(value) / maxAbs);
  if (value < 0) {
    return `hsl(12 ${42 + ratio * 32}% ${88 - ratio * 42}%)`;
  }

  return `hsl(190 ${36 + ratio * 28}% ${88 - ratio * 38}%)`;
}

function riskColorFor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "critical":
      return "#b03a2e";
    case "high":
      return "#b7791f";
    case "moderate":
      return "#d6a72c";
    case "low":
      return "#2f7d5c";
  }
}

function riskChangeColorFor(before: RiskLevel, after: RiskLevel): string {
  const beforeRank = riskRank(before);
  const afterRank = riskRank(after);

  if (afterRank > beforeRank) return "#b03a2e";
  if (afterRank < beforeRank) return "#2f7d5c";
  return "#6c7a82";
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

function formatDisplayNumber(value: number, digits = 2): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatDisplayInteger(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDisplayMaybeNumber(value: number | null, digits = 2): string {
  return value === null ? "0.00" : formatDisplayNumber(value, digits);
}

function formatDisplayNullableNumber(value: number | null, digits = 2): string {
  return value === null ? "-" : formatDisplayNumber(value, digits);
}

function formatSignedDisplayNumber(value: number | null, digits = 2, unit = ""): string {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatDisplayNumber(value, digits)}${unit}`;
}

function formatSignedDisplayInteger(value: number | null, unit = ""): string {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatDisplayInteger(value)}${unit}`;
}

function formatDisplayNullableValue(value: number | null, digits = 2, unit = ""): string {
  return value === null ? "-" : `${formatDisplayNumber(value, digits)}${unit}`;
}

function formatDisplayNullableIntegerValue(value: number | null, unit = ""): string {
  return value === null ? "-" : `${formatDisplayInteger(value)}${unit}`;
}

function baselineValueFor(currentValue: number | null, differenceValue: number | null): number | null {
  if (
    currentValue === null ||
    differenceValue === null ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(differenceValue)
  ) {
    return null;
  }

  return currentValue - differenceValue;
}

function formatRiskLabel(riskLevel: RiskLevel | null): string {
  if (riskLevel === null) return "-";
  return `${riskLevel[0]!.toUpperCase()}${riskLevel.slice(1)} risk`;
}

function finiteOrZero(value: number | null): number {
  return value === null || !Number.isFinite(value) ? 0 : value;
}

function finiteOrNegativeInfinity(value: number | null): number {
  return value === null || !Number.isFinite(value) ? Number.NEGATIVE_INFINITY : value;
}

function finiteOrPositiveInfinity(value: number | null): number {
  return value === null || !Number.isFinite(value) ? Number.POSITIVE_INFINITY : value;
}

function drawdownMagnitude(well: Pick<WellRiskRankingRow, "headChangeMeters">): number {
  return well.headChangeMeters !== null && well.headChangeMeters < 0
    ? Math.abs(well.headChangeMeters)
    : 0;
}

function interfaceDecreaseMagnitude(
  well: Pick<WellRiskRankingRow, "interfaceChangeMeters">,
): number {
  return well.interfaceChangeMeters !== null && well.interfaceChangeMeters < 0
    ? Math.abs(well.interfaceChangeMeters)
    : 0;
}

function changeStatusRank(status: WellChangeStatus): number {
  switch (status) {
    case "worsened":
      return 2;
    case "unchanged":
      return 1;
    case "improved":
      return 0;
  }
}

function scenarioRiskPostureRank(posture: ScenarioRiskPosture): number {
  switch (posture) {
    case "severe":
      return 3;
    case "elevated":
      return 2;
    case "watch":
      return 1;
    case "neutral":
      return 0;
  }
}

function warningSeverityFor(message: string): MapWarningSeverity {
  const lower = message.toLowerCase();

  if (
    lower.includes("not converged") ||
    lower.includes("no finite active-cell") ||
    lower.includes("outside the stage 1 plausibility range") ||
    lower.includes("exceed 450 m") ||
    lower.includes("failure threshold") ||
    lower.includes("freshwater lens is inverted")
  ) {
    return "severe";
  }

  if (
    lower.includes("should be") ||
    lower.includes("not finite") ||
    lower.includes("default scale was used") ||
    lower.includes("stress case") ||
    lower.includes("outside the stage 1 tuning slider range") ||
    lower.includes("aquifer-base guardrail") ||
    lower.includes("warning threshold")
  ) {
    return "caution";
  }

  return "info";
}

function warningDetailsFor(warnings: string[]): MapWarningDetail[] {
  return warnings.map((message) => ({
    severity: warningSeverityFor(message),
    message,
  }));
}

function modelAssumptionsFor(input: ResolvedMapScenarioInput): ModelAssumption[] {
  const tuning = input.resolvedModelTuning;

  return [
    {
      id: "initial-head",
      label: "Initial head",
      displayValue: `${formatDisplayNumber(tuning.initialHeadMeters)} m`,
      explanation:
        "Starting freshwater head used by the solver before it relaxes toward fixed boundaries, recharge, pumping, and canal support.",
    },
    {
      id: "regional-gradient",
      label: "Regional gradient",
      displayValue: `${formatDisplayNumber(tuning.regionalGradientMetersPerKilometer, 3)} m/km`,
      explanation:
        "Adds inland fixed-head support so the simplified grid starts with a land-to-coast freshwater slope.",
    },
    {
      id: "base-recharge",
      label: "Base recharge",
      displayValue: `${formatDisplayInteger(tuning.baseRechargeMillimetersPerYear)} mm/yr`,
      explanation:
        "Sets the background recharge source term before the scenario recharge multiplier is applied.",
    },
    {
      id: "k-scale",
      label: "Hydraulic K scale",
      displayValue: `${formatDisplayNumber(tuning.hydraulicConductivityScale)}x`,
      explanation:
        "Scales provisional hydraulic conductivity bands; lower values usually make pumping drawdown more concentrated.",
    },
    {
      id: "default-canal-stage",
      label: "Default canal stage",
      displayValue: `${formatDisplayNumber(tuning.defaultCanalStageMeters)} m`,
      explanation:
        "Sets the fallback fixed head for modeled canal cells unless a selected canal has its own override.",
    },
  ];
}

function changeExplanationsFor(input: ResolvedMapScenarioInput): string[] {
  const explanations: string[] = [];
  const tuning = input.resolvedModelTuning;

  if (input.rechargeMultiplier !== 1) {
    explanations.push(
      input.rechargeMultiplier > 1
        ? "Higher recharge adds more freshwater to active cells, which tends to raise heads and deepen the estimated interface."
        : "Lower recharge removes freshwater support, which tends to lower heads and make the interface shallower.",
    );
  }

  if (input.seaLevelRiseMeters !== 0) {
    explanations.push(
      "Sea-level rise raises coastal fixed-head boundaries and reduces freshwater head relative to the coast, increasing saltwater-intrusion pressure.",
    );
  }

  if (Object.keys(input.canalStageMetersById).length > 0) {
    explanations.push(
      "Selected canal-stage overrides change local fixed-head support along rasterized canal cells; nearby cells can gain or lose head depending on the stage.",
    );
  }

  if (tuning.defaultCanalStageMeters !== defaultModelTuning.defaultCanalStageMeters) {
    explanations.push(
      "The default canal stage changes fixed-head support for modeled canals that do not have their own selected override.",
    );
  }

  if (tuning.hydraulicConductivityScale !== defaultModelTuning.hydraulicConductivityScale) {
    explanations.push(
      tuning.hydraulicConductivityScale < defaultModelTuning.hydraulicConductivityScale
        ? "Lower K scale makes the aquifer transmit water less readily, so pumping stress produces larger local drawdown."
        : "Higher K scale makes the aquifer transmit water more readily, spreading stress and usually reducing localized drawdown.",
    );
  }

  if (tuning.regionalGradientMetersPerKilometer !== defaultModelTuning.regionalGradientMetersPerKilometer) {
    explanations.push(
      "The regional gradient changes inland freshwater support; a stronger gradient generally lifts inland heads relative to the coast.",
    );
  }

  if (tuning.baseRechargeMillimetersPerYear !== defaultModelTuning.baseRechargeMillimetersPerYear) {
    explanations.push(
      "Base recharge changes the background freshwater source term before the live recharge multiplier is applied.",
    );
  }

  if (tuning.initialHeadMeters !== defaultModelTuning.initialHeadMeters) {
    explanations.push(
      "Initial head changes the solver starting point, mainly affecting convergence behavior and stress-test interpretation.",
    );
  }

  if (
    Object.keys(input.wellPumpingCubicMetersPerDayById).length > 0 ||
    Object.keys(input.wellfieldPumpingCubicMetersPerDayById).length > 0
  ) {
    explanations.push(
      "Pumping removes freshwater at well cells; higher pumping lowers local head and can raise upconing risk.",
    );
  }

  return explanations.length > 0
    ? explanations
    : ["Baseline run: outputs reflect current placeholder pumping, recharge, sea level, canal stages, and Stage 1 default tuning."];
}

function scenarioNarrativeFor(params: {
  scenarioStatus: "baseline" | "modified";
  comparisonSummary: MapComparisonSummary;
  calibrationReadout: CalibrationReadout;
  highestRiskWell: MapScenarioWell | null;
  warningDetails: MapWarningDetail[];
  changeExplanations: string[];
}): ScenarioNarrative {
  const {
    scenarioStatus,
    comparisonSummary,
    calibrationReadout,
    highestRiskWell,
    warningDetails,
    changeExplanations,
  } = params;
  const hasSevereWarning = warningDetails.some((warning) => warning.severity === "severe");
  const hasWarnings = warningDetails.length > 0;
  const maxDrawdownMeters = calibrationReadout.maxDrawdownMeters;
  const interfaceDecreaseMeters =
    comparisonSummary.largestInterfaceDepthDecreaseMeters === null
      ? null
      : Math.abs(comparisonSummary.largestInterfaceDepthDecreaseMeters);
  const highestRiskBaseline = highestRiskWell
    ? `${highestRiskWell.name} · ${formatRiskLabel(highestRiskWell.riskLevelBefore)}`
    : "-";
  const highestRiskCurrent = highestRiskWell
    ? `${highestRiskWell.name} · ${formatRiskLabel(highestRiskWell.riskLevelAfter)}`
    : "-";
  const highestRiskWorsened =
    highestRiskWell !== null &&
    riskRank(highestRiskWell.riskLevelAfter) > riskRank(highestRiskWell.riskLevelBefore);
  let headline = "Baseline Stage 1 conditions";
  let body =
    "No scenario changes are applied yet. Outputs reflect current placeholder pumping, recharge, sea level, canal stages, and Stage 1 default tuning.";
  let dominantChange = "Use the scenario controls to compare a modified run against this baseline.";
  let riskPosture: ScenarioRiskPosture = "neutral";

  if (scenarioStatus === "modified") {
    if (hasSevereWarning) {
      headline = "Model review needed before interpreting this run";
      body =
        "This scenario produced severe plausibility warnings. Treat the map as a stress case until the Stage 1 assumptions are reviewed.";
      dominantChange = warningDetails.find((warning) => warning.severity === "severe")?.message ?? "Severe warning present.";
      riskPosture = "severe";
    } else if (comparisonSummary.worsenedWellCount > 0) {
      headline = "Scenario increases well risk";
      body = `${comparisonSummary.worsenedWellCount} well${
        comparisonSummary.worsenedWellCount === 1 ? "" : "s"
      } moved to a higher risk class relative to baseline. Highest current risk is ${
        highestRiskWell ? `${highestRiskWell.name} (${highestRiskWell.riskLevel})` : "not available"
      }.`;
      dominantChange = highestRiskWell
        ? `${highestRiskWell.name} changed from ${highestRiskWell.riskLevelBefore} to ${highestRiskWell.riskLevelAfter} risk.`
        : "One or more wells worsened relative to baseline.";
      riskPosture = "elevated";
    } else if (maxDrawdownMeters !== null && maxDrawdownMeters > 0) {
      headline = "Scenario creates localized aquifer stress";
      body =
        "The run shows modeled head decline without moving any well to a worse risk class. Use change mode to inspect where drawdown concentrates.";
      dominantChange = comparisonSummary.largestHeadDeclineCellId
        ? `Max modeled drawdown is ${formatDisplayNumber(maxDrawdownMeters)} m at ${comparisonSummary.largestHeadDeclineCellId}.`
        : `Max modeled drawdown is ${formatDisplayNumber(maxDrawdownMeters)} m.`;
      riskPosture = hasWarnings ? "elevated" : "watch";
    } else {
      headline = hasWarnings
        ? "Scenario changed with warnings to review"
        : "Scenario changed without material risk worsening";
      body = hasWarnings
        ? "The model response changed and produced non-severe warnings. Review assumptions before using this as a demo conclusion."
        : "The model response changed, but well risk classes did not worsen and no modeled drawdown was detected.";
      dominantChange = changeExplanations[0] ?? "Scenario inputs changed from baseline.";
      riskPosture = hasWarnings ? "watch" : "neutral";
    }
  }

  return {
    headline,
    body,
    dominantChange,
    riskPosture,
    beforeAfterCards: [
      {
        id: "highest-risk-well",
        label: "Highest-risk well",
        baselineValue: highestRiskBaseline,
        currentValue: highestRiskCurrent,
        posture: highestRiskWorsened ? "elevated" : "neutral",
        helperText: "Uses the current highest-risk well and its baseline-to-current risk class.",
      },
      {
        id: "worsened-wells",
        label: "Worsened wells",
        baselineValue: "0",
        currentValue: formatDisplayInteger(comparisonSummary.worsenedWellCount),
        posture: comparisonSummary.worsenedWellCount > 0 ? "elevated" : "neutral",
        helperText: "Counts wells that moved to a higher risk class.",
      },
      {
        id: "max-drawdown",
        label: "Max drawdown",
        baselineValue: "0.00 m",
        currentValue: `${formatDisplayMaybeNumber(maxDrawdownMeters)} m`,
        posture: maxDrawdownMeters !== null && maxDrawdownMeters > 0 ? "watch" : "neutral",
        helperText: "Largest modeled head decline relative to baseline.",
      },
      {
        id: "largest-interface-decrease",
        label: "Largest interface decrease",
        baselineValue: "0.00 m",
        currentValue: `${formatDisplayMaybeNumber(interfaceDecreaseMeters)} m`,
        posture: interfaceDecreaseMeters !== null && interfaceDecreaseMeters > 0 ? "watch" : "neutral",
        helperText: "Largest shallowing of the estimated freshwater-saltwater interface.",
      },
      {
        id: "warnings",
        label: "Warnings",
        baselineValue: "0",
        currentValue: formatDisplayInteger(calibrationReadout.warningCount),
        posture: hasSevereWarning ? "severe" : hasWarnings ? "watch" : "neutral",
        helperText: "Plausibility flags from the Stage 1 solver and tuning checks.",
      },
    ],
    stage1Disclaimer:
      "This narrative is a simplified Stage 1 readout for scenario exploration. It is not calibrated, not regulatory, and not a replacement for a reviewed groundwater model.",
  };
}

function wellChangeStatusFor(well: MapScenarioWell): WellChangeStatus {
  const riskDelta = riskRank(well.riskLevelAfter) - riskRank(well.riskLevelBefore);
  const riskRatioDelta = finiteOrZero(well.riskRatioDifference);
  const headChange = finiteOrZero(well.localHeadDifferenceMeters);
  const interfaceChange = finiteOrZero(well.interfaceDepthDifferenceMeters);

  if (
    riskDelta > 0 ||
    riskRatioDelta > 0.001 ||
    headChange < -0.01 ||
    interfaceChange < -0.01
  ) {
    return "worsened";
  }

  if (
    riskDelta < 0 ||
    riskRatioDelta < -0.001 ||
    headChange > 0.01 ||
    interfaceChange > 0.01
  ) {
    return "improved";
  }

  return "unchanged";
}

function whyThisWellMattersFor(well: MapScenarioWell, status: WellChangeStatus): string {
  const riskDelta = riskRank(well.riskLevelAfter) - riskRank(well.riskLevelBefore);
  const drawdown = drawdownMagnitude({ headChangeMeters: well.localHeadDifferenceMeters });
  const interfaceDecrease = interfaceDecreaseMagnitude({
    interfaceChangeMeters: well.interfaceDepthDifferenceMeters,
  });

  if (status === "worsened" && riskDelta > 0) {
    return `${well.name} moved from ${well.riskLevelBefore} to ${well.riskLevelAfter} risk; inspect pumping and local head response first.`;
  }

  if (status === "worsened" && drawdown > 0.01) {
    return `${well.name} shows ${formatDisplayNumber(drawdown)} m of modeled drawdown in this scenario.`;
  }

  if (status === "worsened" && interfaceDecrease > 0.01) {
    return `${well.name} has a ${formatDisplayNumber(interfaceDecrease)} m shallower estimated interface than baseline.`;
  }

  if (["high", "critical"].includes(well.riskLevel)) {
    return `${well.name} is currently ${well.riskLevel} risk, so it remains a priority even if its class did not worsen.`;
  }

  if (status === "improved") {
    return `${well.name} improved relative to baseline; use it as contrast against wells showing stress.`;
  }

  return `${well.name} is unchanged in risk class; keep it as context while reviewing higher-priority wells.`;
}

function rankingRowFor(well: MapScenarioWell, rank: number): WellRiskRankingRow {
  const changeStatus = wellChangeStatusFor(well);

  return {
    rank,
    wellId: well.id,
    wellName: well.name,
    riskLevel: well.riskLevel,
    riskRatio: well.riskRatio,
    pumpingCubicMetersPerDay: well.pumpingCubicMetersPerDay,
    qCritCubicMetersPerDay: well.qCritCubicMetersPerDay,
    headChangeMeters: well.localHeadDifferenceMeters,
    interfaceChangeMeters: well.interfaceDepthDifferenceMeters,
    changeStatus,
    displayValues: {
      riskLevel: formatRiskLabel(well.riskLevel),
      riskRatio: formatDisplayNullableNumber(well.riskRatio, 3),
      pumping: `${formatDisplayInteger(well.pumpingCubicMetersPerDay)} m3/day`,
      qCrit:
        well.qCritCubicMetersPerDay === null
          ? "-"
          : `${formatDisplayInteger(well.qCritCubicMetersPerDay)} m3/day`,
      headChange: formatSignedDisplayNumber(well.localHeadDifferenceMeters, 2, " m"),
      interfaceChange: formatSignedDisplayNumber(well.interfaceDepthDifferenceMeters, 2, " m"),
    },
    whyThisWellMatters: whyThisWellMattersFor(well, changeStatus),
  };
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "en-US");
}

function compareRowsFor(sortId: WellRankingSortId, a: WellRiskRankingRow, b: WellRiskRankingRow): number {
  switch (sortId) {
    case "decision-priority":
      return (
        changeStatusRank(b.changeStatus) - changeStatusRank(a.changeStatus) ||
        riskRank(b.riskLevel) - riskRank(a.riskLevel) ||
        finiteOrNegativeInfinity(b.riskRatio) - finiteOrNegativeInfinity(a.riskRatio) ||
        drawdownMagnitude(b) - drawdownMagnitude(a) ||
        interfaceDecreaseMagnitude(b) - interfaceDecreaseMagnitude(a) ||
        compareText(a.wellName, b.wellName)
      );
    case "risk-ratio":
      return (
        finiteOrNegativeInfinity(b.riskRatio) - finiteOrNegativeInfinity(a.riskRatio) ||
        riskRank(b.riskLevel) - riskRank(a.riskLevel) ||
        compareText(a.wellName, b.wellName)
      );
    case "drawdown":
      return (
        drawdownMagnitude(b) - drawdownMagnitude(a) ||
        riskRank(b.riskLevel) - riskRank(a.riskLevel) ||
        compareText(a.wellName, b.wellName)
      );
    case "interface-decrease":
      return (
        interfaceDecreaseMagnitude(b) - interfaceDecreaseMagnitude(a) ||
        riskRank(b.riskLevel) - riskRank(a.riskLevel) ||
        compareText(a.wellName, b.wellName)
      );
    case "pumping":
      return (
        b.pumpingCubicMetersPerDay - a.pumpingCubicMetersPerDay ||
        riskRank(b.riskLevel) - riskRank(a.riskLevel) ||
        compareText(a.wellName, b.wellName)
      );
    case "qcrit":
      return (
        finiteOrPositiveInfinity(a.qCritCubicMetersPerDay) -
          finiteOrPositiveInfinity(b.qCritCubicMetersPerDay) ||
        riskRank(b.riskLevel) - riskRank(a.riskLevel) ||
        compareText(a.wellName, b.wellName)
      );
  }
}

function sortedWellIds(rows: WellRiskRankingRow[], sortId: WellRankingSortId): string[] {
  return [...rows].sort((a, b) => compareRowsFor(sortId, a, b)).map((row) => row.wellId);
}

function wellRiskRankingFor(wells: MapScenarioWell[]): WellRiskRanking {
  const defaultSort: WellRankingSortId = "decision-priority";
  const baseRows = wells.map((well) => rankingRowFor(well, 0));
  const defaultWellIds = sortedWellIds(baseRows, defaultSort);
  const defaultRankByWellId = new Map(defaultWellIds.map((wellId, index) => [wellId, index + 1]));
  const rows = [...baseRows]
    .sort((a, b) => compareRowsFor(defaultSort, a, b))
    .map((row) => ({
      ...row,
      rank: defaultRankByWellId.get(row.wellId) ?? 0,
    }));
  const sortOptionLabels: Array<{ id: WellRankingSortId; label: string }> = [
    { id: "decision-priority", label: "Decision priority" },
    { id: "risk-ratio", label: "Risk ratio" },
    { id: "drawdown", label: "Drawdown" },
    { id: "interface-decrease", label: "Interface decrease" },
    { id: "pumping", label: "Pumping" },
    { id: "qcrit", label: "Qcrit" },
  ];

  return {
    defaultSort,
    rows,
    sortOptions: sortOptionLabels.map((option) => ({
      ...option,
      wellIds: sortedWellIds(rows, option.id),
    })),
  };
}

function wellEvidenceItem(params: {
  id: string;
  label: string;
  baselineValue?: string;
  currentValue: string;
  changeValue?: string;
  helperText: string;
}): WellEvidenceItem {
  return {
    id: params.id,
    label: params.label,
    baselineValue: params.baselineValue ?? "-",
    currentValue: params.currentValue,
    changeValue: params.changeValue ?? "-",
    helperText: params.helperText,
  };
}

function wellEvidenceRowFor(well: MapScenarioWell, rankingRow: WellRiskRankingRow): WellEvidenceRow {
  const baselineHeadMeters = baselineValueFor(well.localHeadMeters, well.localHeadDifferenceMeters);
  const baselineInterfaceMeters = baselineValueFor(
    well.interfaceDepthMeters,
    well.interfaceDepthDifferenceMeters,
  );
  const baselineQCrit = baselineValueFor(
    well.qCritCubicMetersPerDay,
    well.qCritDifferenceCubicMetersPerDay,
  );
  const baselineRiskRatio = baselineValueFor(well.riskRatio, well.riskRatioDifference);

  return {
    wellId: well.id,
    wellName: well.name,
    changeStatus: rankingRow.changeStatus,
    whyThisWellMatters: rankingRow.whyThisWellMatters,
    items: [
      wellEvidenceItem({
        id: "pumping",
        label: "Pumping",
        currentValue: `${formatDisplayInteger(well.pumpingCubicMetersPerDay)} m3/day`,
        helperText: "Scenario pumping applied at the selected well cell.",
      }),
      wellEvidenceItem({
        id: "qcrit",
        label: "Qcrit",
        baselineValue: formatDisplayNullableIntegerValue(baselineQCrit, " m3/day"),
        currentValue: formatDisplayNullableIntegerValue(well.qCritCubicMetersPerDay, " m3/day"),
        changeValue: formatSignedDisplayInteger(well.qCritDifferenceCubicMetersPerDay, " m3/day"),
        helperText: "Estimated critical pumping threshold before upconing risk becomes elevated in this simplified model.",
      }),
      wellEvidenceItem({
        id: "risk-ratio",
        label: "Risk ratio",
        baselineValue: formatDisplayNullableNumber(baselineRiskRatio, 3),
        currentValue: formatDisplayNullableNumber(well.riskRatio, 3),
        changeValue: formatSignedDisplayNumber(well.riskRatioDifference, 3),
        helperText: "Current pumping divided by Qcrit; higher values indicate less modeled safety margin.",
      }),
      wellEvidenceItem({
        id: "risk-level",
        label: "Risk level",
        baselineValue: formatRiskLabel(well.riskLevelBefore),
        currentValue: formatRiskLabel(well.riskLevelAfter),
        changeValue: `${well.riskLevelBefore} -> ${well.riskLevelAfter}`,
        helperText: "Risk class translated from the modeled risk ratio and interface position.",
      }),
      wellEvidenceItem({
        id: "head",
        label: "Local head",
        baselineValue: formatDisplayNullableValue(baselineHeadMeters, 2, " m"),
        currentValue: formatDisplayNullableValue(well.localHeadMeters, 2, " m"),
        changeValue: formatSignedDisplayNumber(well.localHeadDifferenceMeters, 2, " m"),
        helperText: "Freshwater head at the modeled well cell; decline indicates drawdown.",
      }),
      wellEvidenceItem({
        id: "interface",
        label: "Interface depth",
        baselineValue: formatDisplayNullableValue(baselineInterfaceMeters, 2, " m"),
        currentValue: formatDisplayNullableValue(well.interfaceDepthMeters, 2, " m"),
        changeValue: formatSignedDisplayNumber(well.interfaceDepthDifferenceMeters, 2, " m"),
        helperText: "Estimated freshwater-saltwater interface depth at the modeled well cell.",
      }),
      wellEvidenceItem({
        id: "screen-bottom",
        label: "Screen bottom",
        currentValue: `${formatDisplayNumber(well.screenBottomDepthMeters)} m`,
        helperText: "Placeholder screen-bottom depth used for Stage 1 upconing risk classification.",
      }),
      wellEvidenceItem({
        id: "local-k",
        label: "Local hydraulic K",
        currentValue: formatDisplayNullableValue(well.localHydraulicConductivityMetersPerDay, 2, " m/day"),
        helperText: "Hydraulic conductivity assigned to the well cell before calibration-lite K scaling.",
      }),
    ],
  };
}

function wellEvidenceFor(wells: MapScenarioWell[], wellRiskRanking: WellRiskRanking): WellEvidence {
  const wellsById = new Map(wells.map((well) => [well.id, well]));
  const rows = wellRiskRanking.rows
    .map((rankingRow) => {
      const well = wellsById.get(rankingRow.wellId);
      return well ? wellEvidenceRowFor(well, rankingRow) : null;
    })
    .filter((row): row is WellEvidenceRow => row !== null);

  return {
    rows,
    calculationNotes: [
      {
        id: "risk-ratio",
        title: "Risk ratio",
        body:
          "Risk ratio is the selected well pumping divided by Qcrit. A larger ratio means pumping is closer to the simplified critical threshold.",
      },
      {
        id: "qcrit",
        title: "Qcrit",
        body:
          "Qcrit is a Stage 1 critical-pumping estimate based on local head, interface depth, screen depth, and local aquifer properties.",
      },
      {
        id: "head-interface",
        title: "Head and interface change",
        body:
          "Head decline and shallower interface estimates are treated as stress signals because they reduce freshwater separation near the well.",
      },
    ],
    provenanceNotes: [
      {
        id: "placeholder-wells",
        title: "Placeholder well inputs",
        body:
          "Well locations, pumping, screen depths, and wellfield groupings are Stage 1 placeholder inputs for scenario exploration.",
      },
      {
        id: "stage1-grid",
        title: "Simplified Stage 1 grid",
        body:
          "Head and interface values come from the simplified Biscayne-domain grid and are intended for relative comparison.",
      },
      {
        id: "calibration-lite",
        title: "Calibration-lite assumptions",
        body:
          "Recharge, K scale, canal stage, sea level, and regional-gradient assumptions are provisional tuning controls, not calibrated parameters.",
      },
    ],
    stage1Disclaimer:
      "This evidence trace is a simplified Stage 1 explanation. It is not calibrated, not regulatory, and not a substitute for reviewed groundwater modeling.",
  };
}

function scenarioBriefFor(params: {
  scenarioStatus: "baseline" | "modified";
  summary: string;
  scenarioNarrative: ScenarioNarrative;
  wellRiskRanking: WellRiskRanking;
  calibrationReadout: CalibrationReadout;
  modelAssumptions: ModelAssumption[];
  changeExplanations: string[];
  warningDetails: MapWarningDetail[];
}): ScenarioBrief {
  const {
    scenarioStatus,
    summary,
    scenarioNarrative,
    wellRiskRanking,
    calibrationReadout,
    modelAssumptions,
    changeExplanations,
    warningDetails,
  } = params;
  const highestRiskWell =
    calibrationReadout.highestRiskWellName === null
      ? "-"
      : `${calibrationReadout.highestRiskWellName} · ${formatRiskLabel(calibrationReadout.highestRiskLevel)}`;

  return {
    title: "Halocline Stage 1 Scenario Brief",
    scenarioStatusLabel: scenarioStatus === "baseline" ? "Baseline" : "Modified",
    summary,
    headline: scenarioNarrative.headline,
    body: scenarioNarrative.body,
    dominantChange: scenarioNarrative.dominantChange,
    riskPosture: scenarioNarrative.riskPosture,
    beforeAfterCards: scenarioNarrative.beforeAfterCards,
    wellPriorityRows: wellRiskRanking.rows,
    calibrationItems: [
      {
        id: "active-head-range",
        label: "Active head range",
        value: `${formatDisplayNumber(calibrationReadout.activeHeadRangeMeters.min)} to ${formatDisplayNumber(
          calibrationReadout.activeHeadRangeMeters.max,
        )} m`,
      },
      {
        id: "interface-depth-range",
        label: "Interface-depth range",
        value: `${formatDisplayNumber(calibrationReadout.interfaceDepthRangeMeters.min)} to ${formatDisplayNumber(
          calibrationReadout.interfaceDepthRangeMeters.max,
        )} m`,
      },
      {
        id: "max-drawdown",
        label: "Max drawdown",
        value: `${formatDisplayMaybeNumber(calibrationReadout.maxDrawdownMeters)} m`,
      },
      {
        id: "highest-risk-well",
        label: "Highest-risk well",
        value: highestRiskWell,
      },
      {
        id: "warnings",
        label: "Warnings",
        value: formatDisplayInteger(calibrationReadout.warningCount),
      },
    ],
    modelAssumptions,
    changeExplanations,
    warnings: warningDetails,
    stage1Disclaimer:
      "This printable brief is a simplified Stage 1 scenario readout. It is not calibrated, not regulatory, and not a substitute for a reviewed groundwater model.",
  };
}

function scenarioSnapshotFor(params: {
  scenarioStatus: "baseline" | "modified";
  summary: string;
  scenarioNarrative: ScenarioNarrative;
  comparisonSummary: MapComparisonSummary;
  calibrationReadout: CalibrationReadout;
  highestRiskWell: MapScenarioWell | null;
}): ScenarioSnapshot {
  const {
    scenarioStatus,
    summary,
    scenarioNarrative,
    comparisonSummary,
    calibrationReadout,
    highestRiskWell,
  } = params;
  const maxDrawdownMeters = calibrationReadout.maxDrawdownMeters ?? 0;
  const highestRiskWellDisplay = highestRiskWell
    ? `${highestRiskWell.name} · ${formatRiskLabel(highestRiskWell.riskLevel)}`
    : "-";

  return {
    scenarioStatusLabel: scenarioStatus === "baseline" ? "Baseline" : "Modified",
    headline: scenarioNarrative.headline,
    dominantChange: scenarioNarrative.dominantChange,
    riskPosture: scenarioNarrative.riskPosture,
    highestRiskWellId: highestRiskWell?.id ?? null,
    highestRiskWellName: highestRiskWell?.name ?? null,
    highestRiskLevel: highestRiskWell?.riskLevel ?? null,
    displayValues: {
      highestRiskWell: highestRiskWellDisplay,
      worsenedWells: formatDisplayInteger(comparisonSummary.worsenedWellCount),
      maxDrawdown: `${formatDisplayNumber(maxDrawdownMeters)} m`,
      warnings: formatDisplayInteger(calibrationReadout.warningCount),
    },
    metrics: {
      worsenedWellCount: comparisonSummary.worsenedWellCount,
      maxDrawdownMeters,
      warningCount: calibrationReadout.warningCount,
      riskPostureRank: scenarioRiskPostureRank(scenarioNarrative.riskPosture),
    },
    summary,
    stage1Disclaimer:
      "This snapshot is a simplified Stage 1 scenario comparison. It is not calibrated, not regulatory, and not a substitute for a reviewed groundwater model.",
  };
}

function scenarioPresetsFor(): ScenarioPreset[] {
  return [
    {
      id: "baseline",
      label: "Baseline",
      description: "Return to the original Stage 1 placeholder inputs before scenario adjustments.",
      affectedControls: [],
      inputPatch: {},
    },
    {
      id: "dry-recharge",
      label: "Dry recharge",
      description: "Lower recharge to 0.70x to test reduced freshwater support.",
      affectedControls: ["recharge"],
      inputPatch: {
        rechargeMultiplier: 0.7,
      },
    },
    {
      id: "sea-level-rise",
      label: "Sea-level rise",
      description: "Raise coastal sea level by 0.50 m while leaving other surface controls at baseline.",
      affectedControls: ["sea-level"],
      inputPatch: {
        seaLevelRiseMeters: 0.5,
      },
    },
    {
      id: "pumping-stress",
      label: "Pumping stress",
      description: "Apply 5,600 m3/day to the currently selected wellfield.",
      affectedControls: ["wellfield-pumping"],
      inputPatch: {
        selectedWellfieldPumpingCubicMetersPerDay: 5600,
      },
    },
    {
      id: "combined-stress",
      label: "Combined stress",
      description: "Combine 0.70x recharge, 0.50 m sea-level rise, and 5,600 m3/day selected-wellfield pumping.",
      affectedControls: ["recharge", "sea-level", "wellfield-pumping"],
      inputPatch: {
        rechargeMultiplier: 0.7,
        seaLevelRiseMeters: 0.5,
        selectedWellfieldPumpingCubicMetersPerDay: 5600,
      },
    },
  ];
}

function resolveMapScenarioInput(
  input: MapScenarioInput,
  dataset: Stage1Dataset,
): ResolvedMapScenarioInput {
  const wellPumpingCubicMetersPerDayById: Record<string, number> = {};
  const wellfieldPumpingCubicMetersPerDayById = {
    ...(input.wellfieldPumpingCubicMetersPerDayById ?? {}),
  };
  const explicitWellPumpingCubicMetersPerDayById = {
    ...(input.wellPumpingCubicMetersPerDayById ?? {}),
  };
  const canalStageMetersById = {
    ...(input.canalStageMetersById ?? {}),
  };
  const modelTuning = {
    ...(input.modelTuning ?? {}),
  };
  const resolvedModelTuning = resolveModelTuning(modelTuning);
  const resolvedWellPumpingCubicMetersPerDayById: Record<string, number> = {};
  const resolvedCanalStageMetersById: Record<string, number> = {};

  for (const well of dataset.wells) {
    resolvedWellPumpingCubicMetersPerDayById[well.id] =
      wellfieldPumpingCubicMetersPerDayById[well.wellfieldId] ??
      well.currentPumpingCubicMetersPerDay;
  }

  for (const well of dataset.wells) {
    resolvedWellPumpingCubicMetersPerDayById[well.id] =
      explicitWellPumpingCubicMetersPerDayById[well.id] ??
      resolvedWellPumpingCubicMetersPerDayById[well.id];
  }

  for (const canal of dataset.canals) {
    resolvedCanalStageMetersById[canal.id] =
      canalStageMetersById[canal.id] ?? resolvedModelTuning.defaultCanalStageMeters;
  }

  return {
    rechargeMultiplier: input.rechargeMultiplier ?? 1,
    seaLevelRiseMeters: input.seaLevelRiseMeters ?? 0,
    wellPumpingCubicMetersPerDayById: explicitWellPumpingCubicMetersPerDayById,
    wellfieldPumpingCubicMetersPerDayById,
    canalStageMetersById,
    modelTuning,
    resolvedWellPumpingCubicMetersPerDayById,
    resolvedCanalStageMetersById,
    resolvedModelTuning,
  };
}

function scenarioFromInput(input: ResolvedMapScenarioInput): Scenario {
  const wellfieldAdjustments = Object.entries(input.wellfieldPumpingCubicMetersPerDayById).map(
    ([wellfieldId, pumpingCubicMetersPerDay]) => ({
      targetType: "wellfield" as const,
      targetId: wellfieldId,
      pumpingCubicMetersPerDay,
    }),
  );
  const wellAdjustments = Object.entries(input.wellPumpingCubicMetersPerDayById).map(
    ([wellId, pumpingCubicMetersPerDay]) => ({
      targetType: "well" as const,
      targetId: wellId,
      pumpingCubicMetersPerDay,
    }),
  );
  const canalStageAdjustments = Object.entries(input.canalStageMetersById).map(
    ([canalId, stageMeters]) => ({
      canalId,
      stageMeters,
    }),
  );

  return {
    id: "map-scenario",
    name: "Map Scenario",
    description: "Map scenario generated from live Stage 1 controls.",
    rechargeMultiplier: input.rechargeMultiplier,
    seaLevelRiseMeters: input.seaLevelRiseMeters,
    pumpingAdjustments: [...wellfieldAdjustments, ...wellAdjustments],
    canalStageAdjustments,
  };
}

function scenarioStatusFor(input: ResolvedMapScenarioInput, dataset: Stage1Dataset): "baseline" | "modified" {
  if (input.rechargeMultiplier !== 1 || input.seaLevelRiseMeters !== 0) {
    return "modified";
  }

  for (const well of dataset.wells) {
    if (
      input.resolvedWellPumpingCubicMetersPerDayById[well.id] !==
      well.currentPumpingCubicMetersPerDay
    ) {
      return "modified";
    }
  }

  for (const canal of dataset.canals) {
    if (input.resolvedCanalStageMetersById[canal.id] !== canal.currentStageMeters) {
      return "modified";
    }
  }

  if (!modelTuningIsDefault(input.resolvedModelTuning)) {
    return "modified";
  }

  return "baseline";
}

function maxAbsFor(values: Array<number | null>): number {
  const finite = finiteValues(values).map((value) => Math.abs(value));
  return Math.max(0.0001, ...finite);
}

function mostNegativeDiff(
  diffs: Array<{ id: string; value: number | null }>,
): { id: string | null; value: number | null } {
  const finite = diffs.filter((diff): diff is { id: string; value: number } => diff.value !== null);
  const negative = finite.filter((diff) => diff.value < 0).sort((a, b) => a.value - b.value);

  return {
    id: negative[0]?.id ?? null,
    value: negative[0]?.value ?? null,
  };
}

export function buildMapScenarioViewModel(params: {
  dataset?: Stage1Dataset;
  scenario?: Scenario;
  input?: MapScenarioInput;
} = {}): MapScenarioViewModel {
  const dataset = params.dataset ?? biscayneStage1Dataset;
  const input = resolveMapScenarioInput(params.input ?? {}, dataset);
  const scenario = params.scenario ?? scenarioFromInput(input);
  const shell = buildMapShellViewModel(dataset);
  const modelResult = runScenario({
    scenario,
    dataset,
    baselineScenario,
    modelTuning: input.resolvedModelTuning,
  });
  const modelCellsById = new Map(modelResult.cells.map((cell) => [cell.id, cell]));
  const cellDiffsById = new Map(modelResult.diff?.cellDiffs.map((diff) => [diff.cellId, diff]) ?? []);
  const modelWellsById = new Map(
    modelResult.wellRiskResults.map((wellRisk) => [wellRisk.wellId, wellRisk]),
  );
  const wellDiffsById = new Map(modelResult.diff?.wellDiffs.map((diff) => [diff.wellId, diff]) ?? []);
  const headRange = rangeFor(modelResult.cells.map((cell) => cell.headMeters));
  const interfaceRange = rangeFor(modelResult.cells.map((cell) => cell.interfaceDepthMeters));
  const maxHeadDiff = maxAbsFor(modelResult.diff?.cellDiffs.map((diff) => diff.headDifferenceMeters) ?? []);
  const maxInterfaceDiff = maxAbsFor(
    modelResult.diff?.cellDiffs.map((diff) => diff.interfaceDepthDifferenceMeters) ?? [],
  );

  const cells: MapScenarioCell[] = shell.grid.cells.map((cell) => {
    const modelCell = modelCellsById.get(cell.id);
    const cellDiff = cellDiffsById.get(cell.id);
    const interfaceRatio = normalize(modelCell?.interfaceDepthMeters ?? null, interfaceRange.min, interfaceRange.max);
    const isModeledCell = cell.active && modelCell?.headMeters !== null;

    return {
      ...cell,
      headMeters: modelCell?.headMeters ?? null,
      interfaceDepthMeters: modelCell?.interfaceDepthMeters ?? null,
      headDifferenceMeters: cellDiff?.headDifferenceMeters ?? null,
      interfaceDepthDifferenceMeters: cellDiff?.interfaceDepthDifferenceMeters ?? null,
      headColor: isModeledCell
        ? headColorFor(modelCell?.headMeters ?? null, headRange.min, headRange.max)
        : "rgba(255, 255, 255, 0)",
      interfaceOpacity: isModeledCell ? 0.1 + interfaceRatio * 0.5 : 0,
      headDifferenceColor: isModeledCell
        ? differenceColorFor(cellDiff?.headDifferenceMeters ?? null, maxHeadDiff)
        : "rgba(255, 255, 255, 0)",
      interfaceDifferenceColor: isModeledCell
        ? differenceColorFor(cellDiff?.interfaceDepthDifferenceMeters ?? null, maxInterfaceDiff)
        : "rgba(255, 255, 255, 0)",
      interfaceDifferenceOpacity: !isModeledCell
        ? 0
        : cellDiff?.interfaceDepthDifferenceMeters === null ||
          cellDiff?.interfaceDepthDifferenceMeters === undefined
          ? 0.12
          : 0.16 + normalize(Math.abs(cellDiff.interfaceDepthDifferenceMeters), 0, maxInterfaceDiff) * 0.5,
    };
  });

  const wells: MapScenarioWell[] = shell.wells.map((well) => {
    const modelWell = modelWellsById.get(well.id);
    const wellDiff = wellDiffsById.get(well.id);
    const cellDiff = cellDiffsById.get(well.gridCellId);
    const datasetWell = dataset.wells.find((candidate) => candidate.id === well.id);
    const datasetCell = dataset.grid.cells.find((cell) => cell.id === well.gridCellId);
    const riskLevel = modelWell?.riskLevel ?? "low";
    const riskLevelBefore = wellDiff?.riskLevelBefore ?? riskLevel;
    const riskLevelAfter = wellDiff?.riskLevelAfter ?? riskLevel;

    return {
      ...well,
      screenBottomDepthMeters: datasetWell?.screenBottomDepthMeters ?? 0,
      localHydraulicConductivityMetersPerDay:
        datasetCell?.hydraulicConductivityMetersPerDay ?? null,
      pumpingCubicMetersPerDay: modelWell?.pumpingCubicMetersPerDay ?? 0,
      localHeadMeters: modelWell?.localHeadMeters ?? null,
      interfaceDepthMeters: modelWell?.interfaceDepthMeters ?? null,
      qCritCubicMetersPerDay: modelWell?.qCritCubicMetersPerDay ?? null,
      riskRatio: modelWell?.riskRatio ?? null,
      riskLevel,
      riskColor: riskColorFor(riskLevel),
      riskLevelBefore,
      riskLevelAfter,
      riskRatioDifference: wellDiff?.riskRatioDifference ?? null,
      qCritDifferenceCubicMetersPerDay: wellDiff?.qCritDifferenceCubicMetersPerDay ?? null,
      localHeadDifferenceMeters: cellDiff?.headDifferenceMeters ?? null,
      interfaceDepthDifferenceMeters: cellDiff?.interfaceDepthDifferenceMeters ?? null,
      riskChangeColor: riskChangeColorFor(riskLevelBefore, riskLevelAfter),
    };
  });
  const datasetCanalsById = new Map(dataset.canals.map((canal) => [canal.id, canal]));
  const canals: MapScenarioCanal[] = shell.canals.map((canal) => {
    const datasetCanal = datasetCanalsById.get(canal.id);

    return {
      ...canal,
      baselineStageMeters: datasetCanal?.baselineStageMeters ?? 0,
      currentStageMeters:
        input.resolvedCanalStageMetersById[canal.id] ??
        datasetCanal?.currentStageMeters ??
        0,
      fixedHeadCellCount: datasetCanal?.fixedHeadCellIds.length ?? 0,
      fixedHeadCellIds: [...(datasetCanal?.fixedHeadCellIds ?? [])],
    };
  });
  const highestRiskWell = [...wells].sort(
    (a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel) || (b.riskRatio ?? -1) - (a.riskRatio ?? -1),
  )[0] ?? null;
  const largestHeadDecline = mostNegativeDiff(
    cells.map((cell) => ({ id: cell.id, value: cell.headDifferenceMeters })),
  );
  const largestInterfaceDepthDecrease = mostNegativeDiff(
    cells.map((cell) => ({ id: cell.id, value: cell.interfaceDepthDifferenceMeters })),
  );
  const warningDetails = warningDetailsFor(modelResult.diagnostics.warnings);
  const modelAssumptions = modelAssumptionsFor(input);
  const maxDrawdownMeters =
    largestHeadDecline.value === null ? null : Math.abs(largestHeadDecline.value);
  const scenarioStatus = scenarioStatusFor(input, dataset);
  const comparisonSummary: MapComparisonSummary = {
    highestRiskWellId: highestRiskWell?.id ?? null,
    highestRiskWellName: highestRiskWell?.name ?? null,
    highestRiskLevel: highestRiskWell?.riskLevel ?? null,
    worsenedWellCount: wells.filter(
      (well) => riskRank(well.riskLevelAfter) > riskRank(well.riskLevelBefore),
    ).length,
    largestHeadDeclineCellId: largestHeadDecline.id,
    largestHeadDeclineMeters: largestHeadDecline.value,
    largestInterfaceDepthDecreaseCellId: largestInterfaceDepthDecrease.id,
    largestInterfaceDepthDecreaseMeters: largestInterfaceDepthDecrease.value,
  };
  const calibrationReadout: CalibrationReadout = {
    activeHeadRangeMeters: headRange,
    interfaceDepthRangeMeters: interfaceRange,
    maxDrawdownMeters,
    highestRiskWellName: highestRiskWell?.name ?? null,
    highestRiskLevel: highestRiskWell?.riskLevel ?? null,
    warningCount: modelResult.diagnostics.warnings.length,
    tuningValues: modelAssumptions,
  };
  const changeExplanations = changeExplanationsFor(input);
  const scenarioNarrative = scenarioNarrativeFor({
    scenarioStatus,
    comparisonSummary,
    calibrationReadout,
    highestRiskWell,
    warningDetails,
    changeExplanations,
  });
  const wellRiskRanking = wellRiskRankingFor(wells);
  const wellEvidence = wellEvidenceFor(wells, wellRiskRanking);
  const scenarioPresets = scenarioPresetsFor();
  const scenarioSnapshot = scenarioSnapshotFor({
    scenarioStatus,
    summary: modelResult.summary,
    scenarioNarrative,
    comparisonSummary,
    calibrationReadout,
    highestRiskWell,
  });
  const scenarioBrief = scenarioBriefFor({
    scenarioStatus,
    summary: modelResult.summary,
    scenarioNarrative,
    wellRiskRanking,
    calibrationReadout,
    modelAssumptions,
    changeExplanations,
    warningDetails,
  });

  return {
    ...shell,
    input,
    scenarioStatus,
    scenarioPresets,
    scenarioSnapshot,
    comparisonSummary,
    scenarioNarrative,
    wellRiskRanking,
    wellEvidence,
    scenarioBrief,
    calibrationReadout,
    modelAssumptions,
    changeExplanations,
    grid: {
      ...shell.grid,
      cells,
    },
    canals,
    wells,
    layers: [
      ...shell.layers.map((layer) =>
        ["head", "interface", "risk"].includes(layer.id)
          ? { ...layer, enabled: true, available: true }
          : layer,
      ),
      { id: "reference-domain", label: "Reference domain", enabled: true, available: true },
      { id: "reference-canals", label: "SFWMD canals", enabled: true, available: true },
      { id: "isochlor-2018", label: "2018 isochlor", enabled: true, available: true },
      { id: "isochlor-2022", label: "2022 isochlor", enabled: true, available: true },
    ],
    referenceBounds: biscayneReferenceBounds,
    referenceLayers: biscayneReferenceLayers,
    dataProvenance: biscayneDataProvenance,
    ranges: {
      headMeters: headRange,
      interfaceDepthMeters: interfaceRange,
    },
    diagnostics: {
      converged: modelResult.diagnostics.converged,
      iterationCount: modelResult.diagnostics.iterationCount,
      massBalanceResidualCubicMetersPerDay:
        modelResult.diagnostics.massBalanceResidualCubicMetersPerDay,
      massBalanceErrorPercent: modelResult.diagnostics.massBalanceErrorPercent,
      massBalanceStatus: modelResult.diagnostics.massBalanceStatus,
      runTimeMilliseconds: modelResult.diagnostics.runTimeMilliseconds,
      warnings: modelResult.diagnostics.warnings,
      warningDetails,
    },
    summary: modelResult.summary,
    highestRiskWell,
  };
}
