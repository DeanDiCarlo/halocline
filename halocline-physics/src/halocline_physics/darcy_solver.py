from __future__ import annotations

from dataclasses import dataclass
from math import isfinite, isnan, nan
from time import perf_counter

import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import spsolve

from .boundary_conditions import is_fixed_head_cell
from .grid import active_orthogonal_neighbors, clone_grid, create_grid_index
from .types import Grid, GridCell, MassBalanceStatus, ModelRunDiagnostics


@dataclass(frozen=True, slots=True)
class DarcySolverConfig:
    max_iterations: int = 5000
    tolerance_meters: float = 1e-4
    relaxation_omega: float = 1.4
    effective_aquifer_thickness_meters: float = 30
    initial_head_meters: float = 0


@dataclass(frozen=True, slots=True)
class DarcySolveResult:
    grid: Grid
    head_grid_meters: list[float]
    diagnostics: ModelRunDiagnostics


def calculate_conductance_between_cells(
    *,
    cell_a: GridCell,
    cell_b: GridCell,
    cell_size_meters: float,
    effective_aquifer_thickness_meters: float = 30,
) -> float:
    k_a = cell_a.hydraulic_conductivity_meters_per_day
    k_b = cell_b.hydraulic_conductivity_meters_per_day
    harmonic_k = (2 * k_a * k_b) / (k_a + k_b)
    return harmonic_k * effective_aquifer_thickness_meters * (cell_size_meters / cell_size_meters)


def cell_source_term_cubic_meters_per_day(cell: GridCell, cell_area_square_meters: float) -> float:
    return cell.recharge_meters_per_day * cell_area_square_meters - cell.pumping_cubic_meters_per_day


def _mass_balance_status_for(error_percent: float | None) -> MassBalanceStatus:
    if error_percent is None or not isfinite(error_percent):
        return "failure"
    if error_percent > 5:
        return "failure"
    if error_percent > 1:
        return "warning"
    return "ok"


def _mass_balance_warnings(diagnostics: dict[str, float | str | None]) -> list[str]:
    error_percent = diagnostics["mass_balance_error_percent"]
    status = diagnostics["mass_balance_status"]

    if error_percent is None or not isfinite(error_percent):
        return ["Mass balance could not be computed for this solve."]
    if status == "failure":
        return [
            f"Mass balance error is {error_percent:.2f}%, above the 5% Stage 1 failure threshold."
        ]
    if status == "warning":
        return [
            f"Mass balance error is {error_percent:.2f}%, above the 1% Stage 1 warning threshold."
        ]
    return []


def _compute_mass_balance_diagnostics(
    *,
    grid: Grid,
    cell_area_square_meters: float,
    effective_aquifer_thickness_meters: float,
) -> dict[str, float | MassBalanceStatus]:
    grid_index = create_grid_index(grid)
    inflow_cubic_meters_per_day = 0.0
    outflow_cubic_meters_per_day = 0.0

    for cell in grid.cells:
        if not cell.active or is_fixed_head_cell(cell):
            continue

        recharge_cubic_meters_per_day = cell.recharge_meters_per_day * cell_area_square_meters
        if recharge_cubic_meters_per_day >= 0:
            inflow_cubic_meters_per_day += recharge_cubic_meters_per_day
        else:
            outflow_cubic_meters_per_day += abs(recharge_cubic_meters_per_day)

        if cell.pumping_cubic_meters_per_day >= 0:
            outflow_cubic_meters_per_day += cell.pumping_cubic_meters_per_day
        else:
            inflow_cubic_meters_per_day += abs(cell.pumping_cubic_meters_per_day)

        for neighbor in active_orthogonal_neighbors(grid_index, cell):
            if not is_fixed_head_cell(neighbor):
                continue

            conductance = calculate_conductance_between_cells(
                cell_a=cell,
                cell_b=neighbor,
                cell_size_meters=grid.cell_size_meters,
                effective_aquifer_thickness_meters=effective_aquifer_thickness_meters,
            )
            boundary_flux_into_cell = conductance * (
                (neighbor.head_meters or neighbor.fixed_head_meters or 0) - (cell.head_meters or 0)
            )

            if boundary_flux_into_cell >= 0:
                inflow_cubic_meters_per_day += boundary_flux_into_cell
            else:
                outflow_cubic_meters_per_day += abs(boundary_flux_into_cell)

    residual = inflow_cubic_meters_per_day - outflow_cubic_meters_per_day
    denominator = max(inflow_cubic_meters_per_day, outflow_cubic_meters_per_day)
    error_percent = 0 if denominator == 0 else abs(residual) / denominator * 100

    return {
        "mass_balance_residual_cubic_meters_per_day": residual,
        "mass_balance_error_percent": error_percent,
        "mass_balance_status": _mass_balance_status_for(error_percent),
    }


def _average_fixed_head_meters(grid: Grid) -> float | None:
    fixed_heads = [
        cell.fixed_head_meters
        for cell in grid.cells
        if cell.fixed_head_meters is not None and isfinite(cell.fixed_head_meters)
    ]
    if not fixed_heads:
        return None
    return sum(fixed_heads) / len(fixed_heads)


def solve_darcy_head(grid: Grid, config: DarcySolverConfig | None = None) -> DarcySolveResult:
    solver_config = config or DarcySolverConfig()
    started_at = perf_counter()
    solved_grid = clone_grid(grid)
    grid_index = create_grid_index(solved_grid)
    initial_head_meters = _average_fixed_head_meters(solved_grid)
    if initial_head_meters is None:
        initial_head_meters = solver_config.initial_head_meters
    cell_area_square_meters = solved_grid.cell_size_meters * solved_grid.cell_size_meters
    warnings: list[str] = []

    unknown_cells = [
        cell for cell in solved_grid.cells if cell.active and not is_fixed_head_cell(cell)
    ]
    unknown_index_by_id = {cell.id: index for index, cell in enumerate(unknown_cells)}

    for cell in solved_grid.cells:
        if not cell.active:
            continue
        cell.head_meters = (
            cell.fixed_head_meters
            if is_fixed_head_cell(cell)
            else cell.head_meters if cell.head_meters is not None else initial_head_meters
        )

    rows: list[int] = []
    cols: list[int] = []
    values: list[float] = []
    rhs = np.zeros(len(unknown_cells), dtype=float)

    for row_index, cell in enumerate(unknown_cells):
        neighbors = active_orthogonal_neighbors(grid_index, cell)
        if not neighbors:
            warnings.append(f"Cell {cell.id} has no active neighbors and was left at its initial head.")
            rows.append(row_index)
            cols.append(row_index)
            values.append(1.0)
            rhs[row_index] = cell.head_meters if cell.head_meters is not None else initial_head_meters
            continue

        conductance_sum = 0.0
        rhs[row_index] = cell_source_term_cubic_meters_per_day(cell, cell_area_square_meters)

        for neighbor in neighbors:
            conductance = calculate_conductance_between_cells(
                cell_a=cell,
                cell_b=neighbor,
                cell_size_meters=solved_grid.cell_size_meters,
                effective_aquifer_thickness_meters=solver_config.effective_aquifer_thickness_meters,
            )
            conductance_sum += conductance

            if is_fixed_head_cell(neighbor):
                rhs[row_index] += conductance * (neighbor.fixed_head_meters or 0)
            else:
                col_index = unknown_index_by_id.get(neighbor.id)
                if col_index is not None:
                    rows.append(row_index)
                    cols.append(col_index)
                    values.append(-conductance)

        if conductance_sum == 0:
            warnings.append(f"Cell {cell.id} has zero conductance to active neighbors.")
            rows.append(row_index)
            cols.append(row_index)
            values.append(1.0)
            rhs[row_index] = cell.head_meters if cell.head_meters is not None else initial_head_meters
        else:
            rows.append(row_index)
            cols.append(row_index)
            values.append(conductance_sum)

    max_head_change_meters: float | None = None
    converged = True

    if unknown_cells:
        matrix = csr_matrix((values, (rows, cols)), shape=(len(unknown_cells), len(unknown_cells)))
        solution = spsolve(matrix, rhs)
        if np.any(~np.isfinite(solution)):
            converged = False
            warnings.append("Sparse Darcy solve produced one or more non-finite heads.")
        else:
            for cell, solved_head in zip(unknown_cells, solution, strict=True):
                previous_head = cell.head_meters if cell.head_meters is not None else initial_head_meters
                cell.head_meters = float(solved_head)
                change = abs(cell.head_meters - previous_head)
                max_head_change_meters = (
                    change if max_head_change_meters is None else max(max_head_change_meters, change)
                )

    mass_balance = _compute_mass_balance_diagnostics(
        grid=solved_grid,
        cell_area_square_meters=cell_area_square_meters,
        effective_aquifer_thickness_meters=solver_config.effective_aquifer_thickness_meters,
    )
    diagnostics = ModelRunDiagnostics(
        converged=converged,
        iteration_count=1 if unknown_cells else 0,
        max_head_change_meters=max_head_change_meters,
        mass_balance_residual_cubic_meters_per_day=mass_balance[
            "mass_balance_residual_cubic_meters_per_day"
        ],
        mass_balance_error_percent=mass_balance["mass_balance_error_percent"],
        mass_balance_status=mass_balance["mass_balance_status"],
        run_time_milliseconds=(perf_counter() - started_at) * 1000,
        warnings=[*warnings, *_mass_balance_warnings(mass_balance)],
    )

    return DarcySolveResult(
        grid=solved_grid,
        head_grid_meters=[
            cell.head_meters if cell.head_meters is not None else nan for cell in solved_grid.cells
        ],
        diagnostics=diagnostics,
    )
