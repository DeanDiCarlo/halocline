from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

RiskLevel = Literal["low", "moderate", "high", "critical"]
MassBalanceStatus = Literal["ok", "warning", "failure"]


@dataclass(slots=True)
class CoordinateMeters:
    x_meters: float
    y_meters: float


@dataclass(slots=True)
class BoundingBoxMeters:
    min_x_meters: float
    min_y_meters: float
    max_x_meters: float
    max_y_meters: float


@dataclass(slots=True)
class GridCell:
    id: str
    row: int
    col: int
    x_center_meters: float
    y_center_meters: float
    active: bool
    hydraulic_conductivity_meters_per_day: float
    recharge_meters_per_day: float
    pumping_cubic_meters_per_day: float
    is_coastal_boundary: bool
    is_canal_boundary: bool
    aquifer_base_depth_meters: float | None = None
    fixed_head_meters: float | None = None
    head_meters: float | None = None
    interface_depth_meters: float | None = None


@dataclass(slots=True)
class Grid:
    id: str
    name: str
    row_count: int
    col_count: int
    cell_size_meters: float
    origin_x_meters: float
    origin_y_meters: float
    cells: list[GridCell]


@dataclass(slots=True)
class Well:
    id: str
    name: str
    wellfield_id: str
    location: CoordinateMeters
    grid_cell_id: str
    screen_bottom_depth_meters: float
    baseline_pumping_cubic_meters_per_day: float
    current_pumping_cubic_meters_per_day: float


@dataclass(slots=True)
class Canal:
    id: str
    name: str
    centerline: list[CoordinateMeters]
    baseline_stage_meters: float
    current_stage_meters: float
    fixed_head_cell_ids: list[str]


@dataclass(slots=True)
class Domain:
    id: str
    name: str
    bounding_box: BoundingBoxMeters
    coastline_cell_ids: list[str]
    inland_boundary_cell_ids: list[str]


@dataclass(slots=True)
class Stage1Dataset:
    domain: Domain
    grid: Grid
    wells: list[Well]
    canals: list[Canal]


@dataclass(slots=True)
class PumpingAdjustment:
    target_type: Literal["well", "wellfield"]
    target_id: str
    pumping_cubic_meters_per_day: float


@dataclass(slots=True)
class CanalStageAdjustment:
    canal_id: str
    stage_meters: float


@dataclass(slots=True)
class Scenario:
    id: str
    name: str
    description: str
    recharge_multiplier: float
    sea_level_rise_meters: float
    pumping_adjustments: list[PumpingAdjustment] = field(default_factory=list)
    canal_stage_adjustments: list[CanalStageAdjustment] = field(default_factory=list)


@dataclass(slots=True)
class ModelCellResult:
    id: str
    row: int
    col: int
    active: bool
    aquifer_base_depth_meters: float | None
    is_coastal_boundary: bool
    is_canal_boundary: bool
    head_meters: float | None
    interface_depth_meters: float | None
    pumping_cubic_meters_per_day: float
    recharge_meters_per_day: float
    fixed_head_meters: float | None
    well_ids: list[str]


@dataclass(slots=True)
class WellRiskResult:
    well_id: str
    well_name: str
    grid_cell_id: str
    pumping_cubic_meters_per_day: float
    local_head_meters: float | None
    interface_depth_meters: float | None
    q_crit_cubic_meters_per_day: float | None
    risk_ratio: float | None
    risk_level: RiskLevel


@dataclass(slots=True)
class ModelCellDiffResult:
    cell_id: str
    head_difference_meters: float | None
    interface_depth_difference_meters: float | None


@dataclass(slots=True)
class ModelWellDiffResult:
    well_id: str
    risk_level_before: RiskLevel
    risk_level_after: RiskLevel
    risk_ratio_difference: float | None
    q_crit_difference_cubic_meters_per_day: float | None


@dataclass(slots=True)
class ModelDiffResult:
    cell_diffs: list[ModelCellDiffResult]
    well_diffs: list[ModelWellDiffResult]


@dataclass(slots=True)
class ModelRunDiagnostics:
    converged: bool
    iteration_count: int
    max_head_change_meters: float | None
    mass_balance_residual_cubic_meters_per_day: float | None
    mass_balance_error_percent: float | None
    mass_balance_status: MassBalanceStatus
    run_time_milliseconds: float
    warnings: list[str]


@dataclass(slots=True)
class ModelResult:
    scenario_id: str
    scenario_name: str
    cells: list[ModelCellResult]
    head_grid_meters: list[float]
    interface_depth_grid_meters: list[float]
    well_risk_results: list[WellRiskResult]
    diagnostics: ModelRunDiagnostics
    diff: ModelDiffResult | None
    summary: str
