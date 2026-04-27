import type { RiskLevel } from "./types.ts";

export type ComputeUpconingRiskParams = {
  pumpingCubicMetersPerDay: number;
  localHydraulicConductivityMetersPerDay: number;
  wellScreenBottomDepthMeters: number;
  interfaceDepthMeters: number;
  densityContrastRatio?: number;
};

export type UpconingRiskResult = {
  dMeters: number;
  zCritMeters: number;
  qCritCubicMetersPerDay: number;
  riskRatio: number;
  riskLevel: RiskLevel;
};

export function classifyRisk(riskRatio: number): RiskLevel {
  if (!Number.isFinite(riskRatio)) return "critical";
  if (riskRatio >= 1.0) return "critical";
  if (riskRatio >= 0.75) return "high";
  if (riskRatio >= 0.5) return "moderate";
  return "low";
}

export function computeUpconingRisk(params: ComputeUpconingRiskParams): UpconingRiskResult {
  const densityContrastRatio = params.densityContrastRatio ?? 0.025;
  const dMeters = params.interfaceDepthMeters - params.wellScreenBottomDepthMeters;

  if (dMeters <= 0) {
    return {
      dMeters,
      zCritMeters: 0,
      qCritCubicMetersPerDay: 0,
      riskRatio: Infinity,
      riskLevel: "critical",
    };
  }

  const zCritMeters = 0.3 * dMeters;
  const qCritCubicMetersPerDay =
    2 *
    Math.PI *
    dMeters *
    params.localHydraulicConductivityMetersPerDay *
    densityContrastRatio *
    zCritMeters;
  const riskRatio = params.pumpingCubicMetersPerDay / qCritCubicMetersPerDay;

  return {
    dMeters,
    zCritMeters,
    qCritCubicMetersPerDay,
    riskRatio,
    riskLevel: classifyRisk(riskRatio),
  };
}
