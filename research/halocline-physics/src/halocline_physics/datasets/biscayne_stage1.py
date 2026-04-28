from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from halocline_physics.types import (
    BoundingBoxMeters,
    Canal,
    CoordinateMeters,
    Domain,
    Grid,
    GridCell,
    Stage1Dataset,
    Well,
)


def _research_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _number_or_none(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)


def _coordinate(raw: dict[str, Any]) -> CoordinateMeters:
    return CoordinateMeters(
        x_meters=float(raw["xMeters"]),
        y_meters=float(raw["yMeters"]),
    )


def _bounding_box(raw: dict[str, Any]) -> BoundingBoxMeters:
    return BoundingBoxMeters(
        min_x_meters=float(raw["minXMeters"]),
        min_y_meters=float(raw["minYMeters"]),
        max_x_meters=float(raw["maxXMeters"]),
        max_y_meters=float(raw["maxYMeters"]),
    )


def _cell(raw: dict[str, Any]) -> GridCell:
    return GridCell(
        id=str(raw["id"]),
        row=int(raw["row"]),
        col=int(raw["col"]),
        x_center_meters=float(raw["xCenterMeters"]),
        y_center_meters=float(raw["yCenterMeters"]),
        active=bool(raw["active"]),
        aquifer_base_depth_meters=_number_or_none(raw.get("aquiferBaseDepthMeters")),
        hydraulic_conductivity_meters_per_day=float(raw["hydraulicConductivityMetersPerDay"]),
        recharge_meters_per_day=0.0,
        pumping_cubic_meters_per_day=0.0,
        fixed_head_meters=None,
        is_coastal_boundary=bool(raw["isCoastalBoundary"]),
        is_canal_boundary=bool(raw["isCanalBoundary"]),
    )


def _grid(raw: dict[str, Any]) -> Grid:
    return Grid(
        id=str(raw["id"]),
        name=str(raw["name"]),
        row_count=int(raw["rowCount"]),
        col_count=int(raw["colCount"]),
        cell_size_meters=float(raw["cellSizeMeters"]),
        origin_x_meters=float(raw["originXMeters"]),
        origin_y_meters=float(raw["originYMeters"]),
        cells=[_cell(cell) for cell in raw["cells"]],
    )


def _domain(raw: dict[str, Any]) -> Domain:
    return Domain(
        id=str(raw["id"]),
        name=str(raw["name"]),
        bounding_box=_bounding_box(raw["boundingBox"]),
        coastline_cell_ids=list(raw["coastlineCellIds"]),
        inland_boundary_cell_ids=list(raw["inlandBoundaryCellIds"]),
    )


def _well(raw: dict[str, Any]) -> Well:
    return Well(
        id=str(raw["id"]),
        name=str(raw["name"]),
        wellfield_id=str(raw["wellfieldId"]),
        location=_coordinate(raw["location"]),
        grid_cell_id=str(raw["gridCellId"]),
        screen_bottom_depth_meters=float(raw["screenBottomDepthMeters"]),
        baseline_pumping_cubic_meters_per_day=float(raw["baselinePumpingCubicMetersPerDay"]),
        current_pumping_cubic_meters_per_day=float(raw["currentPumpingCubicMetersPerDay"]),
    )


def _canal(raw: dict[str, Any]) -> Canal:
    return Canal(
        id=str(raw["id"]),
        name=str(raw["name"]),
        centerline=[_coordinate(point) for point in raw["centerline"]],
        baseline_stage_meters=float(raw["baselineStageMeters"]),
        current_stage_meters=float(raw["currentStageMeters"]),
        fixed_head_cell_ids=list(raw["fixedHeadCellIds"]),
    )


@lru_cache(maxsize=1)
def load_biscayne_stage1_dataset(
    geometry_path: str | Path | None = None,
) -> Stage1Dataset:
    path = Path(geometry_path) if geometry_path is not None else _research_root() / "reference_snapshots" / "grid_geometry.json"
    raw = json.loads(path.read_text(encoding="utf8"))["dataset"]
    grid = _grid(raw["grid"])
    cells_by_id = {cell.id: cell for cell in grid.cells}

    for cell_id in raw["domain"]["coastlineCellIds"]:
        cell = cells_by_id.get(cell_id)
        if cell is not None:
            cell.fixed_head_meters = 0.0

    for canal in raw["canals"]:
        for cell_id in canal["fixedHeadCellIds"]:
            cell = cells_by_id.get(cell_id)
            if cell is not None and not cell.is_coastal_boundary:
                cell.fixed_head_meters = float(canal["currentStageMeters"])

    return Stage1Dataset(
        domain=_domain(raw["domain"]),
        grid=grid,
        wells=[_well(well) for well in raw["wells"]],
        canals=[_canal(canal) for canal in raw["canals"]],
    )
