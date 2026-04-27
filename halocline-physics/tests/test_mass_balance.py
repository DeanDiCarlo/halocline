from halocline_physics.darcy_solver import solve_darcy_head
from halocline_physics.types import Grid, GridCell


def _recharge_grid() -> Grid:
    cells = []
    for row in range(3):
        for col in range(3):
            cells.append(
                GridCell(
                    id=f"r{row}-c{col}",
                    row=row,
                    col=col,
                    x_center_meters=col + 0.5,
                    y_center_meters=row + 0.5,
                    active=True,
                    aquifer_base_depth_meters=60,
                    hydraulic_conductivity_meters_per_day=50,
                    recharge_meters_per_day=0.001,
                    pumping_cubic_meters_per_day=0,
                    fixed_head_meters=0.4 if col == 2 else None,
                    is_coastal_boundary=col == 2,
                    is_canal_boundary=False,
                )
            )
    return Grid(
        id="recharge",
        name="Recharge test",
        row_count=3,
        col_count=3,
        cell_size_meters=100,
        origin_x_meters=0,
        origin_y_meters=0,
        cells=cells,
    )


def test_mass_balance_residual_is_conservation_diagnostic():
    result = solve_darcy_head(_recharge_grid())

    assert result.diagnostics.converged is True
    assert result.diagnostics.mass_balance_status == "ok"
    assert result.diagnostics.mass_balance_error_percent is not None
    assert result.diagnostics.mass_balance_error_percent < 1e-8
