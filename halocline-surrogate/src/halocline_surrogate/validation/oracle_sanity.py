from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from halocline_physics.datasets import load_biscayne_stage1_dataset
from halocline_physics.scenario_runner import run_scenario

from halocline_surrogate.data.sampling import load_sampling_config, sample_scenarios


def oracle_sanity(
    *,
    n: int,
    config_path: str | Path,
) -> dict[str, float | int]:
    dataset = load_biscayne_stage1_dataset()
    config = load_sampling_config(config_path)
    samples = sample_scenarios(count=n, dataset=dataset, config=config, id_prefix="sanity")
    mass_balance_errors = []
    gh_violation_count = 0
    monotonicity_pass_count = 0

    for sample in samples:
        baseline = run_scenario(
            scenario=sample.scenario,
            dataset=dataset,
            model_tuning=sample.model_tuning,
        )
        dry_scenario = sample.scenario
        dry_scenario.recharge_multiplier = max(0, sample.scenario.recharge_multiplier * 0.8)
        dry = run_scenario(
            scenario=dry_scenario,
            dataset=dataset,
            model_tuning=sample.model_tuning,
        )

        if baseline.diagnostics.mass_balance_error_percent is not None:
            mass_balance_errors.append(baseline.diagnostics.mass_balance_error_percent)

        active_cells = [cell for cell in baseline.cells if cell.active]
        for cell in active_cells:
            if cell.interface_depth_meters is None:
                gh_violation_count += 1
            elif cell.interface_depth_meters < -1e-9:
                gh_violation_count += 1
            elif (
                cell.aquifer_base_depth_meters is not None
                and cell.interface_depth_meters - cell.aquifer_base_depth_meters > 1e-9
            ):
                gh_violation_count += 1

        baseline_heads = np.asarray([cell.head_meters for cell in baseline.cells if cell.active and cell.head_meters is not None])
        dry_heads = np.asarray([cell.head_meters for cell in dry.cells if cell.active and cell.head_meters is not None])
        if len(baseline_heads) == len(dry_heads) and float(np.mean(dry_heads)) <= float(np.mean(baseline_heads)) + 1e-6:
            monotonicity_pass_count += 1

    total_active_cells = n * sum(1 for cell in dataset.grid.cells if cell.active)
    return {
        "n": n,
        "mb_residual_p95": float(np.percentile(mass_balance_errors, 95)) if mass_balance_errors else float("nan"),
        "gh_violation_rate": gh_violation_count / max(1, total_active_cells),
        "monotonicity_pass_rate": monotonicity_pass_count / max(1, n),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=200)
    parser.add_argument("--config", default="configs/sampling.yaml")
    parser.add_argument("--output", default="oracle_sanity.json")
    args = parser.parse_args()
    result = oracle_sanity(n=args.n, config_path=args.config)
    Path(args.output).write_text(json.dumps(result, indent=2) + "\n", encoding="utf8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
