from __future__ import annotations

from dataclasses import dataclass
from math import inf, isfinite, pi

from .types import RiskLevel


@dataclass(frozen=True, slots=True)
class UpconingRiskResult:
    d_meters: float
    z_crit_meters: float
    q_crit_cubic_meters_per_day: float
    risk_ratio: float
    risk_level: RiskLevel


def classify_risk(risk_ratio: float) -> RiskLevel:
    if not isfinite(risk_ratio):
        return "critical"
    if risk_ratio >= 1.0:
        return "critical"
    if risk_ratio >= 0.75:
        return "high"
    if risk_ratio >= 0.5:
        return "moderate"
    return "low"


def compute_upconing_risk(
    *,
    pumping_cubic_meters_per_day: float,
    local_hydraulic_conductivity_meters_per_day: float,
    well_screen_bottom_depth_meters: float,
    interface_depth_meters: float,
    density_contrast_ratio: float = 0.025,
) -> UpconingRiskResult:
    d_meters = interface_depth_meters - well_screen_bottom_depth_meters

    if d_meters <= 0:
        return UpconingRiskResult(
            d_meters=d_meters,
            z_crit_meters=0,
            q_crit_cubic_meters_per_day=0,
            risk_ratio=inf,
            risk_level="critical",
        )

    z_crit_meters = 0.3 * d_meters
    q_crit_cubic_meters_per_day = (
        2
        * pi
        * d_meters
        * local_hydraulic_conductivity_meters_per_day
        * density_contrast_ratio
        * z_crit_meters
    )
    risk_ratio = pumping_cubic_meters_per_day / q_crit_cubic_meters_per_day

    return UpconingRiskResult(
        d_meters=d_meters,
        z_crit_meters=z_crit_meters,
        q_crit_cubic_meters_per_day=q_crit_cubic_meters_per_day,
        risk_ratio=risk_ratio,
        risk_level=classify_risk(risk_ratio),
    )
