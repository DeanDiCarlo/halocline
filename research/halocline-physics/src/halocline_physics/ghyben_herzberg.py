from __future__ import annotations

from dataclasses import dataclass
from math import isfinite


@dataclass(frozen=True, slots=True)
class InterfaceDepthEstimate:
    depth_meters: float
    unclamped_depth_meters: float
    relative_head_meters: float
    clamped_at_aquifer_base: bool
    inverted_freshwater_lens: bool


def estimate_interface_depth_from_head(
    *,
    freshwater_head_meters: float,
    sea_level_meters: float,
    aquifer_base_depth_meters: float | None = None,
    rho_fresh_kg_per_cubic_meter: float = 1000,
    rho_salt_kg_per_cubic_meter: float = 1025,
) -> InterfaceDepthEstimate:
    relative_head_meters = freshwater_head_meters - sea_level_meters
    multiplier = rho_fresh_kg_per_cubic_meter / (
        rho_salt_kg_per_cubic_meter - rho_fresh_kg_per_cubic_meter
    )
    unclamped_depth_meters = max(0, multiplier * relative_head_meters)
    has_aquifer_base = (
        aquifer_base_depth_meters is not None
        and isfinite(aquifer_base_depth_meters)
        and aquifer_base_depth_meters >= 0
    )
    depth_meters = (
        min(unclamped_depth_meters, aquifer_base_depth_meters)
        if has_aquifer_base
        else unclamped_depth_meters
    )

    return InterfaceDepthEstimate(
        depth_meters=depth_meters,
        unclamped_depth_meters=unclamped_depth_meters,
        relative_head_meters=relative_head_meters,
        clamped_at_aquifer_base=has_aquifer_base
        and unclamped_depth_meters > aquifer_base_depth_meters,
        inverted_freshwater_lens=relative_head_meters < 0,
    )


def interface_depth_from_head(**kwargs: float) -> float:
    return estimate_interface_depth_from_head(**kwargs).depth_meters
