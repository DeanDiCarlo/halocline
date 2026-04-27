from __future__ import annotations

from dataclasses import dataclass
from math import isfinite, nan

from .darcy_solver import DarcySolverConfig, solve_darcy_head
from .datasets.biscayne_stage1 import load_biscayne_stage1_dataset
from .ghyben_herzberg import InterfaceDepthEstimate, estimate_interface_depth_from_head
from .grid import clone_grid, create_grid_index
from .model_tuning import ResolvedModelTuning, default_model_tuning, resolve_model_tuning
from .scenario import baseline_scenario
from .types import (
    Grid,
    GridCell,
    ModelCellDiffResult,
    ModelCellResult,
    ModelDiffResult,
    ModelResult,
    ModelWellDiffResult,
    RiskLevel,
    Scenario,
    Stage1Dataset,
    WellRiskResult,
)
from .units import millimeters_per_year_to_meters_per_day
from .upconing import compute_upconing_risk


@dataclass(frozen=True, slots=True)
class ResolvedScenario:
    recharge_multiplier: float
    sea_level_rise_meters: float
    well_pumping_cubic_meters_per_day_by_id: dict[str, float]
    canal_stage_meters_by_id: dict[str, float]
    model_tuning: ResolvedModelTuning


def _finite_or_none(value: float | None) -> float | None:
    return value if value is not None and isfinite(value) else None


def _difference_or_none(after: float | None, before: float | None) -> float | None:
    if after is None or before is None:
        return None
    return after - before


def _finite_or_default(value: float, fallback: float) -> float:
    return value if isfinite(value) else fallback


def _resolved_scenario_from(
    scenario: Scenario,
    dataset: Stage1Dataset,
    model_tuning: ResolvedModelTuning,
) -> ResolvedScenario:
    well_pumping = {
        well.id: well.current_pumping_cubic_meters_per_day for well in dataset.wells
    }
    canal_stage = {canal.id: model_tuning.default_canal_stage_meters for canal in dataset.canals}

    for adjustment in scenario.pumping_adjustments:
        if adjustment.target_type != "wellfield":
            continue
        for well in dataset.wells:
            if well.wellfield_id == adjustment.target_id:
                well_pumping[well.id] = adjustment.pumping_cubic_meters_per_day

    for adjustment in scenario.pumping_adjustments:
        if adjustment.target_type == "well":
            well_pumping[adjustment.target_id] = adjustment.pumping_cubic_meters_per_day

    for adjustment in scenario.canal_stage_adjustments:
        canal_stage[adjustment.canal_id] = adjustment.stage_meters

    return ResolvedScenario(
        recharge_multiplier=scenario.recharge_multiplier,
        sea_level_rise_meters=scenario.sea_level_rise_meters,
        well_pumping_cubic_meters_per_day_by_id=well_pumping,
        canal_stage_meters_by_id=canal_stage,
        model_tuning=model_tuning,
    )


def _tuning_warnings(tuning: ResolvedModelTuning) -> list[str]:
    warnings: list[str] = []
    if not isfinite(tuning.initial_head_meters):
        warnings.append("Initial head tuning is not finite; the default initial head was used.")
    if (
        not isfinite(tuning.regional_gradient_meters_per_kilometer)
        or tuning.regional_gradient_meters_per_kilometer <= 0
    ):
        warnings.append(
            "Regional gradient should be positive for a physically plausible inland-to-coastal head pattern."
        )
    if (
        not isfinite(tuning.base_recharge_millimeters_per_year)
        or tuning.base_recharge_millimeters_per_year < 0
    ):
        warnings.append("Base recharge should be a non-negative finite value.")
    if (
        not isfinite(tuning.hydraulic_conductivity_scale)
        or tuning.hydraulic_conductivity_scale <= 0
    ):
        warnings.append(
            "Hydraulic conductivity scale should be positive; the default scale was used for the solve."
        )
    if not isfinite(tuning.default_canal_stage_meters):
        warnings.append("Default canal stage is not finite; the default canal stage was used.")
    elif tuning.default_canal_stage_meters < 0 or tuning.default_canal_stage_meters > 1.2:
        warnings.append("Default canal stage is outside the Stage 1 tuning slider range.")
    return warnings


def apply_scenario_to_grid(
    scenario: Scenario,
    dataset: Stage1Dataset,
    model_tuning: ResolvedModelTuning,
) -> tuple[Grid, ResolvedScenario]:
    resolved_scenario = _resolved_scenario_from(scenario, dataset, model_tuning)
    grid = clone_grid(dataset.grid)
    grid_index = create_grid_index(grid)
    base_recharge = millimeters_per_year_to_meters_per_day(
        _finite_or_default(
            model_tuning.base_recharge_millimeters_per_year,
            default_model_tuning.base_recharge_millimeters_per_year,
        )
    )
    hydraulic_conductivity_scale = (
        model_tuning.hydraulic_conductivity_scale
        if isfinite(model_tuning.hydraulic_conductivity_scale)
        and model_tuning.hydraulic_conductivity_scale > 0
        else default_model_tuning.hydraulic_conductivity_scale
    )
    initial_head = _finite_or_default(
        model_tuning.initial_head_meters, default_model_tuning.initial_head_meters
    )
    regional_gradient = _finite_or_default(
        model_tuning.regional_gradient_meters_per_kilometer,
        default_model_tuning.regional_gradient_meters_per_kilometer,
    )
    model_max_x_meters = dataset.domain.bounding_box.max_x_meters

    for cell in grid.cells:
        if cell.active:
            cell.recharge_meters_per_day = base_recharge * resolved_scenario.recharge_multiplier
            cell.hydraulic_conductivity_meters_per_day *= hydraulic_conductivity_scale
        cell.pumping_cubic_meters_per_day = 0

        if cell.is_coastal_boundary:
            cell.fixed_head_meters = resolved_scenario.sea_level_rise_meters

    for cell_id in dataset.domain.inland_boundary_cell_ids:
        cell = grid_index.by_id.get(cell_id)
        if cell is None or not cell.active or cell.is_coastal_boundary:
            continue
        distance_to_coast_kilometers = max(0, (model_max_x_meters - cell.x_center_meters) / 1000)
        cell.fixed_head_meters = initial_head + regional_gradient * distance_to_coast_kilometers

    for canal in dataset.canals:
        for cell_id in canal.fixed_head_cell_ids:
            cell = grid_index.by_id.get(cell_id)
            if cell is not None and not cell.is_coastal_boundary:
                cell.fixed_head_meters = resolved_scenario.canal_stage_meters_by_id[canal.id]

    for well in dataset.wells:
        cell = grid_index.by_id.get(well.grid_cell_id)
        if cell is not None:
            cell.pumping_cubic_meters_per_day += (
                resolved_scenario.well_pumping_cubic_meters_per_day_by_id.get(well.id, 0)
            )

    return grid, resolved_scenario


def _cell_well_ids(cell: GridCell, dataset: Stage1Dataset) -> list[str]:
    return [well.id for well in dataset.wells if well.grid_cell_id == cell.id]


def _interface_guardrail_warnings(
    cells: list[GridCell],
    interface_estimate_by_cell_id: dict[str, InterfaceDepthEstimate],
) -> list[str]:
    active_cells = [cell for cell in cells if cell.active]
    clamped_cells = [
        cell
        for cell in active_cells
        if interface_estimate_by_cell_id[cell.id].clamped_at_aquifer_base
    ]
    inverted_cells = [
        cell
        for cell in active_cells
        if interface_estimate_by_cell_id[cell.id].inverted_freshwater_lens
    ]
    warnings: list[str] = []

    if clamped_cells:
        aquifer_base = next(
            (
                cell.aquifer_base_depth_meters
                for cell in clamped_cells
                if cell.aquifer_base_depth_meters is not None
                and isfinite(cell.aquifer_base_depth_meters)
            ),
            0,
        )
        plural = "" if len(clamped_cells) == 1 else "s"
        warnings.append(
            f"{len(clamped_cells)} active cell{plural} exceeded the provisional "
            f"{aquifer_base:g} m aquifer-base guardrail; interface depths were capped for Stage 1 display."
        )

    if inverted_cells:
        plural = "" if len(inverted_cells) == 1 else "s"
        warnings.append(
            f"{len(inverted_cells)} active cell{plural} had freshwater head below sea level; "
            "the local freshwater lens is inverted and interface depth was capped at 0 m."
        )

    return warnings


def _plausibility_warnings(cells: list[ModelCellResult]) -> list[str]:
    active_cells = [cell for cell in cells if cell.active]
    active_heads = [
        cell.head_meters
        for cell in active_cells
        if cell.head_meters is not None and isfinite(cell.head_meters)
    ]
    active_interfaces = [
        cell.interface_depth_meters
        for cell in active_cells
        if cell.interface_depth_meters is not None and isfinite(cell.interface_depth_meters)
    ]
    warnings: list[str] = []

    if active_cells and not active_heads:
        warnings.append("No finite active-cell head outputs were produced.")
    if active_cells and not active_interfaces:
        warnings.append("No finite active-cell interface-depth outputs were produced.")
    if any(head < -2 or head > 12 for head in active_heads):
        warnings.append(
            "One or more active-cell heads are outside the Stage 1 plausibility range of -2 m to 12 m."
        )
    if any(depth > 450 for depth in active_interfaces):
        warnings.append(
            "One or more interface-depth estimates exceed 450 m; treat this scenario as a tuning stress case."
        )
    return warnings


def _run_scenario_core(
    scenario: Scenario,
    dataset: Stage1Dataset,
    model_tuning: ResolvedModelTuning,
    solver_config: DarcySolverConfig | None = None,
) -> ModelResult:
    grid, resolved_scenario = apply_scenario_to_grid(scenario, dataset, model_tuning)
    config = solver_config or DarcySolverConfig(initial_head_meters=model_tuning.initial_head_meters)
    solve_result = solve_darcy_head(grid, config)
    solved_grid_index = create_grid_index(solve_result.grid)
    interface_depth_by_cell_id: dict[str, float] = {}
    interface_estimate_by_cell_id: dict[str, InterfaceDepthEstimate] = {}

    for cell in solve_result.grid.cells:
        estimate = estimate_interface_depth_from_head(
            freshwater_head_meters=cell.head_meters if cell.head_meters is not None else nan,
            sea_level_meters=resolved_scenario.sea_level_rise_meters,
            aquifer_base_depth_meters=cell.aquifer_base_depth_meters,
        )
        interface_depth_by_cell_id[cell.id] = estimate.depth_meters
        interface_estimate_by_cell_id[cell.id] = estimate
        cell.interface_depth_meters = estimate.depth_meters

    cells = [
        ModelCellResult(
            id=cell.id,
            row=cell.row,
            col=cell.col,
            active=cell.active,
            aquifer_base_depth_meters=_finite_or_none(cell.aquifer_base_depth_meters),
            is_coastal_boundary=cell.is_coastal_boundary,
            is_canal_boundary=cell.is_canal_boundary,
            head_meters=_finite_or_none(cell.head_meters),
            interface_depth_meters=_finite_or_none(interface_depth_by_cell_id.get(cell.id)),
            pumping_cubic_meters_per_day=cell.pumping_cubic_meters_per_day,
            recharge_meters_per_day=cell.recharge_meters_per_day,
            fixed_head_meters=_finite_or_none(cell.fixed_head_meters),
            well_ids=_cell_well_ids(cell, dataset),
        )
        for cell in solve_result.grid.cells
    ]

    well_risk_results: list[WellRiskResult] = []
    for well in dataset.wells:
        cell = solved_grid_index.by_id.get(well.grid_cell_id)
        local_head = _finite_or_none(cell.head_meters if cell is not None else None)
        interface_depth = _finite_or_none(interface_depth_by_cell_id.get(well.grid_cell_id))
        upconing_risk = compute_upconing_risk(
            pumping_cubic_meters_per_day=resolved_scenario.well_pumping_cubic_meters_per_day_by_id.get(well.id, 0),
            local_hydraulic_conductivity_meters_per_day=(
                cell.hydraulic_conductivity_meters_per_day if cell is not None else 0
            ),
            well_screen_bottom_depth_meters=well.screen_bottom_depth_meters,
            interface_depth_meters=interface_depth or 0,
        )
        well_risk_results.append(
            WellRiskResult(
                well_id=well.id,
                well_name=well.name,
                grid_cell_id=well.grid_cell_id,
                pumping_cubic_meters_per_day=resolved_scenario.well_pumping_cubic_meters_per_day_by_id.get(well.id, 0),
                local_head_meters=local_head,
                interface_depth_meters=interface_depth,
                q_crit_cubic_meters_per_day=_finite_or_none(upconing_risk.q_crit_cubic_meters_per_day),
                risk_ratio=_finite_or_none(upconing_risk.risk_ratio),
                risk_level=upconing_risk.risk_level,
            )
        )

    diagnostics = solve_result.diagnostics
    diagnostics.warnings = [
        *diagnostics.warnings,
        *_interface_guardrail_warnings(solve_result.grid.cells, interface_estimate_by_cell_id),
        *_tuning_warnings(model_tuning),
        *_plausibility_warnings(cells),
    ]

    return ModelResult(
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        cells=cells,
        head_grid_meters=solve_result.head_grid_meters,
        interface_depth_grid_meters=[
            cell.interface_depth_meters if cell.interface_depth_meters is not None else nan
            for cell in cells
        ],
        well_risk_results=well_risk_results,
        diagnostics=diagnostics,
        diff=None,
        summary="",
    )


def _risk_rank(risk_level: RiskLevel) -> int:
    return {"critical": 3, "high": 2, "moderate": 1, "low": 0}[risk_level]


def _build_diff(result: ModelResult, baseline_result: ModelResult) -> ModelDiffResult:
    baseline_cells_by_id = {cell.id: cell for cell in baseline_result.cells}
    baseline_wells_by_id = {well.well_id: well for well in baseline_result.well_risk_results}

    cell_diffs = [
        ModelCellDiffResult(
            cell_id=cell.id,
            head_difference_meters=_difference_or_none(
                cell.head_meters, baseline_cells_by_id[cell.id].head_meters
            ),
            interface_depth_difference_meters=_difference_or_none(
                cell.interface_depth_meters,
                baseline_cells_by_id[cell.id].interface_depth_meters,
            ),
        )
        for cell in result.cells
    ]
    well_diffs = []
    for well_risk in result.well_risk_results:
        baseline_well_risk = baseline_wells_by_id.get(well_risk.well_id)
        well_diffs.append(
            ModelWellDiffResult(
                well_id=well_risk.well_id,
                risk_level_before=baseline_well_risk.risk_level if baseline_well_risk else "low",
                risk_level_after=well_risk.risk_level,
                risk_ratio_difference=_difference_or_none(
                    well_risk.risk_ratio,
                    baseline_well_risk.risk_ratio if baseline_well_risk else None,
                ),
                q_crit_difference_cubic_meters_per_day=_difference_or_none(
                    well_risk.q_crit_cubic_meters_per_day,
                    baseline_well_risk.q_crit_cubic_meters_per_day
                    if baseline_well_risk
                    else None,
                ),
            )
        )
    return ModelDiffResult(cell_diffs=cell_diffs, well_diffs=well_diffs)


def _summarize_scenario(result: ModelResult, diff: ModelDiffResult | None) -> str:
    critical_count = sum(
        1 for well_risk in result.well_risk_results if well_risk.risk_level == "critical"
    )
    high_count = sum(1 for well_risk in result.well_risk_results if well_risk.risk_level == "high")
    worsened_well_count = (
        sum(
            1
            for well_diff in diff.well_diffs
            if _risk_rank(well_diff.risk_level_after) > _risk_rank(well_diff.risk_level_before)
        )
        if diff is not None
        else 0
    )

    if critical_count > 0:
        risk_sentence = (
            f"{critical_count} well{'s' if critical_count != 1 else ''} exceed the simplified upconing threshold."
        )
    elif high_count > 0:
        risk_sentence = (
            f"{high_count} well{'s' if high_count != 1 else ''} sit above 75% of the simplified upconing threshold."
        )
    else:
        risk_sentence = "No wells exceed the simplified upconing threshold."
    diff_sentence = (
        "No baseline comparison was generated."
        if diff is None
        else f"{worsened_well_count} well{'s' if worsened_well_count != 1 else ''} worsened relative to baseline."
    )
    convergence_sentence = (
        f"Solver {'converged' if result.diagnostics.converged else 'did not converge'} "
        f"in {result.diagnostics.iteration_count} iterations."
    )
    return f"{risk_sentence} {diff_sentence} {convergence_sentence}"


def run_scenario(
    *,
    scenario: Scenario,
    dataset: Stage1Dataset | None = None,
    baseline_scenario_override: Scenario | None = None,
    solver_config: DarcySolverConfig | None = None,
    model_tuning: ResolvedModelTuning | dict[str, float] | None = None,
    baseline_model_tuning: ResolvedModelTuning | dict[str, float] | None = None,
) -> ModelResult:
    dataset = dataset or load_biscayne_stage1_dataset()
    resolved_model_tuning = resolve_model_tuning(model_tuning)
    resolved_baseline_model_tuning = resolve_model_tuning(baseline_model_tuning)
    result = _run_scenario_core(scenario, dataset, resolved_model_tuning, solver_config)
    baseline_result = _run_scenario_core(
        baseline_scenario_override or baseline_scenario,
        dataset,
        resolved_baseline_model_tuning,
        solver_config,
    )
    diff = _build_diff(result, baseline_result)
    result.diff = diff
    result.summary = _summarize_scenario(result, diff)
    return result
