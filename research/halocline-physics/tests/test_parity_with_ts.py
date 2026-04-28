from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from halocline_physics.datasets import load_biscayne_stage1_dataset
from halocline_physics.model_tuning import resolve_model_tuning
from halocline_physics.scenario import scenario_from_snapshot
from halocline_physics.scenario_runner import run_scenario


ROOT = Path(__file__).resolve().parents[2]
SNAPSHOTS = ROOT / "reference_snapshots" / "scenarios.jsonl"


def _masked_errors(actual: list[float], expected: list[float], active_mask: np.ndarray) -> tuple[float, float]:
    actual_array = np.asarray(actual, dtype=float)
    expected_array = np.asarray(expected, dtype=float)
    finite_mask = active_mask & np.isfinite(actual_array) & np.isfinite(expected_array)
    errors = np.abs(actual_array[finite_mask] - expected_array[finite_mask])
    return float(errors.mean()), float(errors.max())


def test_python_runner_matches_frozen_typescript_snapshot():
    dataset = load_biscayne_stage1_dataset()
    active_mask = np.asarray([cell.active for cell in dataset.grid.cells], dtype=bool)
    head_maes = []
    interface_maes = []

    for line in SNAPSHOTS.read_text(encoding="utf8").splitlines():
        snapshot = json.loads(line)
        result = run_scenario(
            scenario=scenario_from_snapshot(snapshot["inputs"]["scenario"]),
            dataset=dataset,
            model_tuning=resolve_model_tuning(snapshot["inputs"]["modelTuning"]),
        )
        head_mae, head_max = _masked_errors(
            result.head_grid_meters, snapshot["head_grid"], active_mask
        )
        interface_mae, interface_max = _masked_errors(
            result.interface_depth_grid_meters, snapshot["interface_grid"], active_mask
        )
        head_maes.append(head_mae)
        interface_maes.append(interface_mae)

        assert head_mae < 0.01, f"{snapshot['inputs']['scenario']['id']} head MAE={head_mae}, max={head_max}"
        assert interface_mae < 0.5, (
            f"{snapshot['inputs']['scenario']['id']} interface MAE={interface_mae}, "
            f"max={interface_max}"
        )

    assert len(head_maes) == 500
    assert max(head_maes) < 0.01
    assert max(interface_maes) < 0.5
