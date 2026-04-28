from __future__ import annotations

import argparse
from pathlib import Path
from time import perf_counter

import h5py
import numpy as np
import torch
from torch.utils.data import DataLoader

from halocline_surrogate.data.dataset import HaloclineDataset
from halocline_surrogate.train.loop import build_model, resolve_device


def oracle_milliseconds_per_scenario(path: str | Path) -> float:
    with h5py.File(path, "r") as h5:
        values = np.asarray(h5["oracle_run_time_milliseconds"], dtype=np.float32)
    return float(np.mean(values))


def surrogate_milliseconds_per_scenario(
    *,
    dataset_path: str | Path,
    checkpoint_path: str | Path,
    batch_size: int,
    device_name: str = "auto",
) -> float:
    device = resolve_device(device_name)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model = build_model(checkpoint["model_config"]).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    loader = DataLoader(
        HaloclineDataset(dataset_path, preload=True),
        batch_size=batch_size,
        pin_memory=device.type == "cuda",
    )
    sample_count = 0
    with torch.no_grad():
        for batch in loader:
            _ = model(
                batch["inputs_grid"].to(device, non_blocking=True),
                batch["inputs_scalar"].to(device, non_blocking=True),
                batch["mask"].to(device, non_blocking=True),
            )
            break
    if device.type == "cuda":
        torch.cuda.synchronize()
    started = perf_counter()
    with torch.no_grad():
        for batch in loader:
            inputs_grid = batch["inputs_grid"].to(device, non_blocking=True)
            inputs_scalar = batch["inputs_scalar"].to(device, non_blocking=True)
            mask = batch["mask"].to(device, non_blocking=True)
            _ = model(inputs_grid, inputs_scalar, mask)
            sample_count += inputs_grid.shape[0]
    if device.type == "cuda":
        torch.cuda.synchronize()
    elapsed_ms = (perf_counter() - started) * 1000
    return elapsed_ms / max(1, sample_count)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--batch-sizes", default="1,64,512,2048")
    args = parser.parse_args()
    oracle = oracle_milliseconds_per_scenario(args.dataset)
    result = {"oracle_ms_per_scenario": oracle}
    for batch_size in [int(value) for value in args.batch_sizes.split(",") if value.strip()]:
        ms = surrogate_milliseconds_per_scenario(
            dataset_path=args.dataset,
            checkpoint_path=args.checkpoint,
            batch_size=batch_size,
            device_name=args.device,
        )
        result[f"surrogate_ms_per_scenario_batch{batch_size}"] = ms
        result[f"speedup_batch{batch_size}"] = oracle / ms if ms > 0 else float("inf")
    print(result)


if __name__ == "__main__":
    main()
