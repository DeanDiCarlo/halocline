from __future__ import annotations

from .types import GridCell


def is_fixed_head_cell(cell: GridCell) -> bool:
    return cell.fixed_head_meters is not None


def fixed_head_or_none(cell: GridCell) -> float | None:
    return cell.fixed_head_meters
