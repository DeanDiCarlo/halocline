from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ResolvedModelTuning:
    initial_head_meters: float = 0.6
    regional_gradient_meters_per_kilometer: float = 0.025
    base_recharge_millimeters_per_year: float = 1300
    hydraulic_conductivity_scale: float = 1
    default_canal_stage_meters: float = 0.55


default_model_tuning = ResolvedModelTuning()


def resolve_model_tuning(
    tuning: ResolvedModelTuning | dict[str, float] | None = None,
) -> ResolvedModelTuning:
    if tuning is None:
        return default_model_tuning
    if isinstance(tuning, ResolvedModelTuning):
        return tuning
    return ResolvedModelTuning(
        initial_head_meters=tuning.get("initial_head_meters", tuning.get("initialHeadMeters", default_model_tuning.initial_head_meters)),
        regional_gradient_meters_per_kilometer=tuning.get(
            "regional_gradient_meters_per_kilometer",
            tuning.get("regionalGradientMetersPerKilometer", default_model_tuning.regional_gradient_meters_per_kilometer),
        ),
        base_recharge_millimeters_per_year=tuning.get(
            "base_recharge_millimeters_per_year",
            tuning.get("baseRechargeMillimetersPerYear", default_model_tuning.base_recharge_millimeters_per_year),
        ),
        hydraulic_conductivity_scale=tuning.get(
            "hydraulic_conductivity_scale",
            tuning.get("hydraulicConductivityScale", default_model_tuning.hydraulic_conductivity_scale),
        ),
        default_canal_stage_meters=tuning.get(
            "default_canal_stage_meters",
            tuning.get("defaultCanalStageMeters", default_model_tuning.default_canal_stage_meters),
        ),
    )
