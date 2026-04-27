from __future__ import annotations

from typing import Any

from .types import CanalStageAdjustment, PumpingAdjustment, Scenario


baseline_scenario = Scenario(
    id="baseline",
    name="Baseline",
    description="Stage 1 baseline using current pumping, recharge, sea level, and canal stages.",
    recharge_multiplier=1,
    sea_level_rise_meters=0,
)


def scenario_from_snapshot(raw: dict[str, Any]) -> Scenario:
    return Scenario(
        id=str(raw["id"]),
        name=str(raw["name"]),
        description=str(raw["description"]),
        recharge_multiplier=float(raw["rechargeMultiplier"]),
        sea_level_rise_meters=float(raw["seaLevelRiseMeters"]),
        pumping_adjustments=[
            PumpingAdjustment(
                target_type=adjustment["targetType"],
                target_id=str(adjustment["targetId"]),
                pumping_cubic_meters_per_day=float(adjustment["pumpingCubicMetersPerDay"]),
            )
            for adjustment in raw.get("pumpingAdjustments", [])
        ],
        canal_stage_adjustments=[
            CanalStageAdjustment(
                canal_id=str(adjustment["canalId"]),
                stage_meters=float(adjustment["stageMeters"]),
            )
            for adjustment in raw.get("canalStageAdjustments", [])
        ],
    )
