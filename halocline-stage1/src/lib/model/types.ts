export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type CoordinateMeters = {
  xMeters: number;
  yMeters: number;
};

export type BoundingBoxMeters = {
  minXMeters: number;
  minYMeters: number;
  maxXMeters: number;
  maxYMeters: number;
};

export type GridCell = {
  id: string;
  row: number;
  col: number;
  xCenterMeters: number;
  yCenterMeters: number;
  active: boolean;
  aquiferBaseDepthMeters?: number;
  hydraulicConductivityMetersPerDay: number;
  rechargeMetersPerDay: number;
  pumpingCubicMetersPerDay: number;
  fixedHeadMeters?: number;
  isCoastalBoundary: boolean;
  isCanalBoundary: boolean;
  headMeters?: number;
  interfaceDepthMeters?: number;
};

export type Grid = {
  id: string;
  name: string;
  rowCount: number;
  colCount: number;
  cellSizeMeters: number;
  originXMeters: number;
  originYMeters: number;
  cells: GridCell[];
};

export type Well = {
  id: string;
  name: string;
  wellfieldId: string;
  location: CoordinateMeters;
  gridCellId: string;
  screenBottomDepthMeters: number;
  baselinePumpingCubicMetersPerDay: number;
  currentPumpingCubicMetersPerDay: number;
};

export type Canal = {
  id: string;
  name: string;
  centerline: CoordinateMeters[];
  baselineStageMeters: number;
  currentStageMeters: number;
  fixedHeadCellIds: string[];
};

export type Domain = {
  id: string;
  name: string;
  boundingBox: BoundingBoxMeters;
  coastlineCellIds: string[];
  inlandBoundaryCellIds: string[];
};

export type PumpingAdjustment = {
  targetType: "well" | "wellfield";
  targetId: string;
  pumpingCubicMetersPerDay: number;
};

export type CanalStageAdjustment = {
  canalId: string;
  stageMeters: number;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  rechargeMultiplier: number;
  seaLevelRiseMeters: number;
  pumpingAdjustments: PumpingAdjustment[];
  canalStageAdjustments: CanalStageAdjustment[];
};

export type WellRiskResult = {
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

export type ModelCellResult = {
  id: string;
  row: number;
  col: number;
  active: boolean;
  aquiferBaseDepthMeters: number | null;
  isCoastalBoundary: boolean;
  isCanalBoundary: boolean;
  headMeters: number | null;
  interfaceDepthMeters: number | null;
  pumpingCubicMetersPerDay: number;
  rechargeMetersPerDay: number;
  fixedHeadMeters: number | null;
  wellIds: string[];
};

export type ModelCellDiffResult = {
  cellId: string;
  headDifferenceMeters: number | null;
  interfaceDepthDifferenceMeters: number | null;
};

export type ModelWellDiffResult = {
  wellId: string;
  riskLevelBefore: RiskLevel;
  riskLevelAfter: RiskLevel;
  riskRatioDifference: number | null;
  qCritDifferenceCubicMetersPerDay: number | null;
};

export type ModelDiffResult = {
  cellDiffs: ModelCellDiffResult[];
  wellDiffs: ModelWellDiffResult[];
};

export type ModelRunDiagnostics = {
  converged: boolean;
  iterationCount: number;
  maxHeadChangeMeters: number | null;
  massBalanceResidualCubicMetersPerDay: number | null;
  massBalanceErrorPercent: number | null;
  massBalanceStatus: "ok" | "warning" | "failure";
  runTimeMilliseconds: number;
  warnings: string[];
};

export type ModelResult = {
  scenarioId: string;
  scenarioName: string;
  cells: ModelCellResult[];
  headGridMeters: number[];
  interfaceDepthGridMeters: number[];
  wellRiskResults: WellRiskResult[];
  diff: ModelDiffResult | null;
  diagnostics: ModelRunDiagnostics;
  summary: string;
};

export type Stage1Dataset = {
  domain: Domain;
  grid: Grid;
  wells: Well[];
  canals: Canal[];
};
