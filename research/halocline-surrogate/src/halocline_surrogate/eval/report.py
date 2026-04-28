from __future__ import annotations

import argparse
import csv
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

from halocline_surrogate.data.dataset import HaloclineDataset
from halocline_surrogate.eval.benchmark import oracle_milliseconds_per_scenario, surrogate_milliseconds_per_scenario
from halocline_surrogate.eval.metrics import metrics_for_arrays
from halocline_surrogate.train.loop import build_model, resolve_device


def predict_dataset(
    dataset_path: str | Path,
    checkpoint_path: str | Path,
    device_name: str,
    batch_size: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
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
    preds = []
    targets = []
    masks = []
    with torch.no_grad():
        for batch in loader:
            pred = model(
                batch["inputs_grid"].to(device, non_blocking=True),
                batch["inputs_scalar"].to(device, non_blocking=True),
                batch["mask"].to(device, non_blocking=True),
            )
            preds.append(pred.cpu().numpy())
            targets.append(batch["targets"].numpy())
            masks.append(batch["mask"].numpy())
    return np.concatenate(preds), np.concatenate(targets), np.concatenate(masks)[:, 0]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="data/test.h5")
    parser.add_argument("--checkpoint", default="checkpoints/ufno_small.pt")
    parser.add_argument("--output", default="report.csv")
    parser.add_argument("--device", default="auto")
    parser.add_argument("--predict-batch-size", type=int, default=512)
    parser.add_argument("--benchmark-batch-sizes", default="1,64,512,2048")
    args = parser.parse_args()

    pred, target, mask = predict_dataset(
        args.dataset,
        args.checkpoint,
        args.device,
        args.predict_batch_size,
    )
    metrics = metrics_for_arrays(pred, target, mask)
    oracle_ms = oracle_milliseconds_per_scenario(args.dataset)
    row = {
        "head_mae": metrics.head.mae,
        "head_rmse": metrics.head.rmse,
        "head_relative_l2": metrics.head.relative_l2,
        "interface_mae": metrics.interface_depth.mae,
        "interface_rmse": metrics.interface_depth.rmse,
        "interface_relative_l2": metrics.interface_depth.relative_l2,
        "oracle_ms_per_scenario": oracle_ms,
    }
    for batch_size in [int(value) for value in args.benchmark_batch_sizes.split(",") if value.strip()]:
        surrogate_ms = surrogate_milliseconds_per_scenario(
            dataset_path=args.dataset,
            checkpoint_path=args.checkpoint,
            batch_size=batch_size,
            device_name=args.device,
        )
        row[f"surrogate_ms_per_scenario_batch{batch_size}"] = surrogate_ms
        row[f"speedup_batch{batch_size}"] = (
            oracle_ms / surrogate_ms if surrogate_ms > 0 else float("inf")
        )
    with Path(args.output).open("w", newline="", encoding="utf8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(row.keys()))
        writer.writeheader()
        writer.writerow(row)


if __name__ == "__main__":
    main()
