from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass(frozen=True, slots=True)
class FieldMetrics:
    mae: float
    rmse: float
    relative_l2: float


@dataclass(frozen=True, slots=True)
class SurrogateMetrics:
    head: FieldMetrics
    interface_depth: FieldMetrics


def masked_field_metrics(
    pred: np.ndarray,
    target: np.ndarray,
    mask: np.ndarray,
) -> FieldMetrics:
    active = mask.astype(bool)
    diff = pred[active] - target[active]
    denom = np.linalg.norm(target[active])
    return FieldMetrics(
        mae=float(np.mean(np.abs(diff))),
        rmse=float(np.sqrt(np.mean(diff**2))),
        relative_l2=float(np.linalg.norm(diff) / denom) if denom > 0 else 0.0,
    )


def metrics_for_arrays(pred: np.ndarray, target: np.ndarray, mask: np.ndarray) -> SurrogateMetrics:
    return SurrogateMetrics(
        head=masked_field_metrics(pred[:, 0], target[:, 0], mask),
        interface_depth=masked_field_metrics(pred[:, 1], target[:, 1], mask),
    )


def load_targets(path: str | Path) -> np.ndarray:
    import h5py

    with h5py.File(path, "r") as h5:
        return np.asarray(h5["targets"], dtype=np.float32)
