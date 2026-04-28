from halocline_physics.darcy_solver import solve_darcy_head
from halocline_physics.types import Grid, GridCell


def _linear_grid() -> Grid:
    cells = []
    for col in range(5):
        cells.append(
            GridCell(
                id=f"r0-c{col}",
                row=0,
                col=col,
                x_center_meters=col + 0.5,
                y_center_meters=0.5,
                active=True,
                aquifer_base_depth_meters=60,
                hydraulic_conductivity_meters_per_day=50,
                recharge_meters_per_day=0,
                pumping_cubic_meters_per_day=0,
                fixed_head_meters=0 if col == 0 else 1 if col == 4 else None,
                is_coastal_boundary=False,
                is_canal_boundary=False,
            )
        )
    return Grid(
        id="linear",
        name="Linear 1D test",
        row_count=1,
        col_count=5,
        cell_size_meters=1,
        origin_x_meters=0,
        origin_y_meters=0,
        cells=cells,
    )


def test_sparse_darcy_solver_matches_1d_linear_gradient():
    result = solve_darcy_head(_linear_grid())
    heads_by_id = {cell.id: cell.head_meters for cell in result.grid.cells}

    assert result.diagnostics.converged is True
    assert heads_by_id["r0-c0"] == 0
    assert heads_by_id["r0-c4"] == 1
    assert abs(heads_by_id["r0-c1"] - 0.25) <= 1e-6
    assert abs(heads_by_id["r0-c2"] - 0.50) <= 1e-6
    assert abs(heads_by_id["r0-c3"] - 0.75) <= 1e-6
