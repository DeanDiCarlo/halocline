from __future__ import annotations

from copy import deepcopy
from dataclasses import replace

from .types import Grid, GridCell


class GridIndex:
    def __init__(self, grid: Grid) -> None:
        self.by_id = {cell.id: cell for cell in grid.cells}
        self.by_row_col = {(cell.row, cell.col): cell for cell in grid.cells}


def create_grid_index(grid: Grid) -> GridIndex:
    return GridIndex(grid)


def get_cell_at(grid_index: GridIndex, row: int, col: int) -> GridCell | None:
    return grid_index.by_row_col.get((row, col))


def active_orthogonal_neighbors(grid_index: GridIndex, cell: GridCell) -> list[GridCell]:
    neighbors = [
        get_cell_at(grid_index, cell.row - 1, cell.col),
        get_cell_at(grid_index, cell.row + 1, cell.col),
        get_cell_at(grid_index, cell.row, cell.col - 1),
        get_cell_at(grid_index, cell.row, cell.col + 1),
    ]
    return [neighbor for neighbor in neighbors if neighbor is not None and neighbor.active]


def clone_grid(grid: Grid) -> Grid:
    return replace(grid, cells=[deepcopy(cell) for cell in grid.cells])
