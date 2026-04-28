export type ModelTuningInput = {
  initialHeadMeters?: number;
  regionalGradientMetersPerKilometer?: number;
  baseRechargeMillimetersPerYear?: number;
  hydraulicConductivityScale?: number;
  defaultCanalStageMeters?: number;
};

export type ResolvedModelTuning = Required<ModelTuningInput>;

export const defaultModelTuning = {
  initialHeadMeters: 0.6,
  regionalGradientMetersPerKilometer: 0.025,
  baseRechargeMillimetersPerYear: 1300,
  hydraulicConductivityScale: 1,
  defaultCanalStageMeters: 0.55,
} satisfies ResolvedModelTuning;

export function resolveModelTuning(input: ModelTuningInput = {}): ResolvedModelTuning {
  return {
    initialHeadMeters: input.initialHeadMeters ?? defaultModelTuning.initialHeadMeters,
    regionalGradientMetersPerKilometer:
      input.regionalGradientMetersPerKilometer ??
      defaultModelTuning.regionalGradientMetersPerKilometer,
    baseRechargeMillimetersPerYear:
      input.baseRechargeMillimetersPerYear ??
      defaultModelTuning.baseRechargeMillimetersPerYear,
    hydraulicConductivityScale:
      input.hydraulicConductivityScale ?? defaultModelTuning.hydraulicConductivityScale,
    defaultCanalStageMeters:
      input.defaultCanalStageMeters ?? defaultModelTuning.defaultCanalStageMeters,
  };
}

export function modelTuningIsDefault(tuning: ResolvedModelTuning): boolean {
  return (
    tuning.initialHeadMeters === defaultModelTuning.initialHeadMeters &&
    tuning.regionalGradientMetersPerKilometer ===
      defaultModelTuning.regionalGradientMetersPerKilometer &&
    tuning.baseRechargeMillimetersPerYear ===
      defaultModelTuning.baseRechargeMillimetersPerYear &&
    tuning.hydraulicConductivityScale === defaultModelTuning.hydraulicConductivityScale &&
    tuning.defaultCanalStageMeters === defaultModelTuning.defaultCanalStageMeters
  );
}
