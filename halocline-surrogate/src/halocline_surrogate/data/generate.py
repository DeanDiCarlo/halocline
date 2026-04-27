from __future__ import annotations

import argparse
import json
from pathlib import Path
from time import perf_counter

import h5py
import numpy as np
from halocline_physics.datasets import load_biscayne_stage1_dataset
from halocline_physics.scenario_runner import apply_scenario_to_grid, run_scenario

from .sampling import SampledScenario, load_sampling_config, sample_scenarios, sampled_scenario_to_json


def _cell_tensor(values: list[float], row_count: int, col_count: int) -> np.ndarray:
    return np.asarray(values, dtype=np.float32).reshape(row_count, col_count)


def _inputs_grid_for(sample: SampledScenario, dataset) -> np.ndarray:
    grid, _resolved = apply_scenario_to_grid(sample.scenario, dataset, sample.model_tuning)
    row_count = dataset.grid.row_count
    col_count = dataset.grid.col_count
    channels = [
        [1.0 if cell.active else 0.0 for cell in grid.cells],
        [cell.x_center_meters for cell in grid.cells],
        [cell.y_center_meters for cell in grid.cells],
        [cell.hydraulic_conductivity_meters_per_day for cell in grid.cells],
        [cell.recharge_meters_per_day for cell in grid.cells],
        [cell.pumping_cubic_meters_per_day for cell in grid.cells],
        [cell.fixed_head_meters if cell.fixed_head_meters is not None else 0.0 for cell in grid.cells],
        [1.0 if cell.fixed_head_meters is not None else 0.0 for cell in grid.cells],
    ]
    return np.stack([_cell_tensor(channel, row_count, col_count) for channel in channels]).astype(np.float32)


def write_grid_file(output_dir: Path, dataset) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    row_count = dataset.grid.row_count
    col_count = dataset.grid.col_count
    with h5py.File(output_dir / "grid.h5", "w") as h5:
        h5.attrs["row_count"] = row_count
        h5.attrs["col_count"] = col_count
        h5.attrs["cell_size_meters"] = dataset.grid.cell_size_meters
        h5.create_dataset(
            "mask",
            data=np.asarray([cell.active for cell in dataset.grid.cells], dtype=np.float32).reshape(row_count, col_count),
        )
        h5.create_dataset(
            "x_center_meters",
            data=np.asarray([cell.x_center_meters for cell in dataset.grid.cells], dtype=np.float32).reshape(row_count, col_count),
        )
        h5.create_dataset(
            "y_center_meters",
            data=np.asarray([cell.y_center_meters for cell in dataset.grid.cells], dtype=np.float32).reshape(row_count, col_count),
        )
        h5.create_dataset("well_ids", data=np.asarray([well.id.encode("utf8") for well in dataset.wells]))
        h5.create_dataset("canal_ids", data=np.asarray([canal.id.encode("utf8") for canal in dataset.canals]))


def write_split(path: Path, samples: list[SampledScenario], dataset) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    row_count = dataset.grid.row_count
    col_count = dataset.grid.col_count
    metadata = []
    started = perf_counter()

    with h5py.File(path, "w") as h5:
        inputs_grid = h5.create_dataset(
            "inputs_grid",
            shape=(len(samples), 8, row_count, col_count),
            dtype="f4",
            compression="gzip",
            shuffle=True,
        )
        inputs_scalar = h5.create_dataset("inputs_scalar", shape=(len(samples), 7), dtype="f4")
        inputs_wells = h5.create_dataset("inputs_wells", shape=(len(samples), len(dataset.wells)), dtype="f4")
        inputs_canals = h5.create_dataset("inputs_canals", shape=(len(samples), len(dataset.canals)), dtype="f4")
        targets = h5.create_dataset(
            "targets",
            shape=(len(samples), 2, row_count, col_count),
            dtype="f4",
            compression="gzip",
            shuffle=True,
        )
        oracle_ms = h5.create_dataset("oracle_run_time_milliseconds", shape=(len(samples),), dtype="f4")

        for index, sample in enumerate(samples):
            result = run_scenario(
                scenario=sample.scenario,
                dataset=dataset,
                model_tuning=sample.model_tuning,
            )
            inputs_grid[index] = _inputs_grid_for(sample, dataset)
            inputs_scalar[index] = sample.inputs_scalar
            inputs_wells[index] = sample.inputs_wells
            inputs_canals[index] = sample.inputs_canals
            targets[index, 0] = _cell_tensor(result.head_grid_meters, row_count, col_count)
            targets[index, 1] = _cell_tensor(result.interface_depth_grid_meters, row_count, col_count)
            oracle_ms[index] = result.diagnostics.run_time_milliseconds
            metadata.append(sampled_scenario_to_json(sample))

        h5.attrs["n"] = len(samples)
        h5.attrs["row_count"] = row_count
        h5.attrs["col_count"] = col_count
        h5.attrs["channels"] = json.dumps(
            ["mask", "x", "y", "hydraulic_conductivity", "recharge", "pumping", "fixed_head", "fixed_head_mask"]
        )
        h5.attrs["elapsed_seconds"] = perf_counter() - started
        h5.create_dataset("metadata_json", data=np.asarray([json.dumps(item).encode("utf8") for item in metadata]))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="configs/sampling.yaml")
    parser.add_argument("--output", default="data")
    parser.add_argument("--train", type=int, default=4000)
    parser.add_argument("--val", type=int, default=500)
    parser.add_argument("--test", type=int, default=500)
    args = parser.parse_args()

    dataset = load_biscayne_stage1_dataset()
    config = load_sampling_config(args.config)
    output = Path(args.output)
    write_grid_file(output, dataset)

    splits = [("train", args.train, 0), ("val", args.val, 10_000), ("test", args.test, 20_000)]
    for name, count, seed_offset in splits:
        samples = sample_scenarios(
            count=count,
            dataset=dataset,
            config=config,
            seed_offset=seed_offset,
            id_prefix=name,
        )
        write_split(output / f"{name}.h5", samples, dataset)


if __name__ == "__main__":
    main()
