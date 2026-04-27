from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import yaml
from halocline_physics.model_tuning import ResolvedModelTuning
from halocline_physics.scenario import scenario_from_snapshot
from halocline_physics.types import CanalStageAdjustment, PumpingAdjustment, Scenario, Stage1Dataset


@dataclass(frozen=True, slots=True)
class Range:
    min: float
    max: float

    def scale(self, unit_value: float) -> float:
        return self.min + unit_value * (self.max - self.min)


@dataclass(frozen=True, slots=True)
class SamplingConfig:
    seed: int
    recharge_multiplier: Range
    sea_level_rise_meters: Range
    well_pumping_cubic_meters_per_day: Range
    canal_stage_meters: Range
    initial_head_meters: Range
    regional_gradient_meters_per_kilometer: Range
    base_recharge_millimeters_per_year: Range
    hydraulic_conductivity_scale: Range
    default_canal_stage_meters: Range


@dataclass(frozen=True, slots=True)
class SampledScenario:
    scenario: Scenario
    model_tuning: ResolvedModelTuning
    inputs_scalar: np.ndarray
    inputs_wells: np.ndarray
    inputs_canals: np.ndarray


def _range(raw: list[float]) -> Range:
    if len(raw) != 2:
        raise ValueError(f"Expected [min, max] range, received {raw!r}")
    return Range(float(raw[0]), float(raw[1]))


def load_sampling_config(path: str | Path) -> SamplingConfig:
    raw = yaml.safe_load(Path(path).read_text(encoding="utf8"))
    ranges = raw["ranges"]
    return SamplingConfig(
        seed=int(raw.get("seed", 20260427)),
        recharge_multiplier=_range(ranges["rechargeMultiplier"]),
        sea_level_rise_meters=_range(ranges["seaLevelRiseMeters"]),
        well_pumping_cubic_meters_per_day=_range(ranges["wellPumpingCubicMetersPerDay"]),
        canal_stage_meters=_range(ranges["canalStageMeters"]),
        initial_head_meters=_range(ranges["initialHeadMeters"]),
        regional_gradient_meters_per_kilometer=_range(ranges["regionalGradientMetersPerKilometer"]),
        base_recharge_millimeters_per_year=_range(ranges["baseRechargeMillimetersPerYear"]),
        hydraulic_conductivity_scale=_range(ranges["hydraulicConductivityScale"]),
        default_canal_stage_meters=_range(ranges["defaultCanalStageMeters"]),
    )


def latin_hypercube(count: int, dimensions: int, seed: int) -> np.ndarray:
    if count <= 0:
        raise ValueError("count must be positive")
    rng = np.random.default_rng(seed)
    samples = np.empty((count, dimensions), dtype=np.float64)
    for dim in range(dimensions):
        bins = (np.arange(count, dtype=np.float64) + rng.random(count)) / count
        rng.shuffle(bins)
        samples[:, dim] = bins
    return samples


def sample_scenarios(
    *,
    count: int,
    dataset: Stage1Dataset,
    config: SamplingConfig,
    seed_offset: int = 0,
    id_prefix: str = "sample",
) -> list[SampledScenario]:
    well_count = len(dataset.wells)
    canal_count = len(dataset.canals)
    scalar_count = 7
    dimensions = 2 + well_count + canal_count + 5
    lhs = latin_hypercube(count, dimensions, config.seed + seed_offset)
    samples: list[SampledScenario] = []

    for index, row in enumerate(lhs):
        cursor = 0
        recharge_multiplier = config.recharge_multiplier.scale(row[cursor]); cursor += 1
        sea_level_rise_meters = config.sea_level_rise_meters.scale(row[cursor]); cursor += 1
        well_pumpings = np.asarray(
            [
                config.well_pumping_cubic_meters_per_day.scale(row[cursor + well_index])
                for well_index in range(well_count)
            ],
            dtype=np.float32,
        )
        cursor += well_count
        canal_stages = np.asarray(
            [
                config.canal_stage_meters.scale(row[cursor + canal_index])
                for canal_index in range(canal_count)
            ],
            dtype=np.float32,
        )
        cursor += canal_count
        model_tuning = ResolvedModelTuning(
            initial_head_meters=config.initial_head_meters.scale(row[cursor]),
            regional_gradient_meters_per_kilometer=config.regional_gradient_meters_per_kilometer.scale(row[cursor + 1]),
            base_recharge_millimeters_per_year=config.base_recharge_millimeters_per_year.scale(row[cursor + 2]),
            hydraulic_conductivity_scale=config.hydraulic_conductivity_scale.scale(row[cursor + 3]),
            default_canal_stage_meters=config.default_canal_stage_meters.scale(row[cursor + 4]),
        )
        scenario = Scenario(
            id=f"{id_prefix}-{index:05d}",
            name=f"{id_prefix} {index}",
            description="Synthetic surrogate training sample generated from the Python physics oracle.",
            recharge_multiplier=recharge_multiplier,
            sea_level_rise_meters=sea_level_rise_meters,
            pumping_adjustments=[
                PumpingAdjustment(
                    target_type="well",
                    target_id=well.id,
                    pumping_cubic_meters_per_day=float(well_pumpings[well_index]),
                )
                for well_index, well in enumerate(dataset.wells)
            ],
            canal_stage_adjustments=[
                CanalStageAdjustment(canal_id=canal.id, stage_meters=float(canal_stages[canal_index]))
                for canal_index, canal in enumerate(dataset.canals)
            ],
        )
        inputs_scalar = np.asarray(
            [
                recharge_multiplier,
                sea_level_rise_meters,
                model_tuning.initial_head_meters,
                model_tuning.regional_gradient_meters_per_kilometer,
                model_tuning.base_recharge_millimeters_per_year,
                model_tuning.hydraulic_conductivity_scale,
                model_tuning.default_canal_stage_meters,
            ],
            dtype=np.float32,
        )
        samples.append(
            SampledScenario(
                scenario=scenario,
                model_tuning=model_tuning,
                inputs_scalar=inputs_scalar,
                inputs_wells=well_pumpings,
                inputs_canals=canal_stages,
            )
        )

    return samples


def sampled_scenario_to_json(sample: SampledScenario) -> dict[str, Any]:
    return {
        "scenario": {
            "id": sample.scenario.id,
            "name": sample.scenario.name,
            "description": sample.scenario.description,
            "rechargeMultiplier": sample.scenario.recharge_multiplier,
            "seaLevelRiseMeters": sample.scenario.sea_level_rise_meters,
            "pumpingAdjustments": [
                {
                    "targetType": adjustment.target_type,
                    "targetId": adjustment.target_id,
                    "pumpingCubicMetersPerDay": adjustment.pumping_cubic_meters_per_day,
                }
                for adjustment in sample.scenario.pumping_adjustments
            ],
            "canalStageAdjustments": [
                {
                    "canalId": adjustment.canal_id,
                    "stageMeters": adjustment.stage_meters,
                }
                for adjustment in sample.scenario.canal_stage_adjustments
            ],
        },
        "modelTuning": {
            "initialHeadMeters": sample.model_tuning.initial_head_meters,
            "regionalGradientMetersPerKilometer": sample.model_tuning.regional_gradient_meters_per_kilometer,
            "baseRechargeMillimetersPerYear": sample.model_tuning.base_recharge_millimeters_per_year,
            "hydraulicConductivityScale": sample.model_tuning.hydraulic_conductivity_scale,
            "defaultCanalStageMeters": sample.model_tuning.default_canal_stage_meters,
        },
    }
