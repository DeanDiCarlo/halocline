from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import torch
from torch.utils.data import DataLoader

from halocline_surrogate.data.dataset import HaloclineDataset
from halocline_surrogate.models.ufno import UFNO
from halocline_surrogate.train.losses import masked_mae, normalized_masked_mse


@dataclass(frozen=True, slots=True)
class TrainConfig:
    train_path: Path
    val_path: Path
    epochs: int
    batch_size: int
    learning_rate: float
    device: str
    checkpoint: Path
    model: dict


def resolve_device(device: str) -> torch.device:
    if device == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(device)


def build_model(config: dict) -> torch.nn.Module:
    name = config.get("name", "ufno_small")
    if name != "ufno_small":
        raise ValueError(f"Unsupported trainable model {name!r}")
    return UFNO(
        in_channels=int(config.get("in_channels", 8)),
        out_channels=int(config.get("out_channels", 2)),
        width=int(config.get("width", 32)),
        modes_height=int(config.get("modes_height", 12)),
        modes_width=int(config.get("modes_width", 12)),
        depth=int(config.get("depth", 4)),
    )


def _field_scales(loader: DataLoader, device: torch.device) -> torch.Tensor:
    maxima = torch.zeros(2, device=device)
    for batch in loader:
        targets = torch.nan_to_num(batch["targets"].to(device), nan=0.0, posinf=0.0, neginf=0.0)
        mask = batch["mask"].to(device)
        masked = targets.abs() * mask
        maxima = torch.maximum(maxima, masked.amax(dim=(0, 2, 3)))
    return maxima.clamp_min(1)


def evaluate(model: torch.nn.Module, loader: DataLoader, device: torch.device) -> dict[str, float]:
    model.eval()
    total_loss = 0.0
    total_mae = 0.0
    batches = 0
    with torch.no_grad():
        for batch in loader:
            inputs_grid = batch["inputs_grid"].to(device)
            inputs_scalar = batch["inputs_scalar"].to(device)
            targets = batch["targets"].to(device)
            mask = batch["mask"].to(device)
            pred = model(inputs_grid, inputs_scalar, mask)
            total_loss += float(normalized_masked_mse(pred, targets, mask).detach().cpu())
            total_mae += float(masked_mae(pred, targets, mask).detach().cpu())
            batches += 1
    return {
        "loss": total_loss / max(1, batches),
        "mae": total_mae / max(1, batches),
    }


def train(config: TrainConfig) -> list[dict[str, float]]:
    device = resolve_device(config.device)
    train_dataset = HaloclineDataset(config.train_path)
    val_dataset = HaloclineDataset(config.val_path)
    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size)
    model = build_model(config.model).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=config.learning_rate)
    field_scales = _field_scales(train_loader, device)
    history: list[dict[str, float]] = []
    best_val = float("inf")

    for epoch in range(1, config.epochs + 1):
        model.train()
        train_loss = 0.0
        batches = 0
        for batch in train_loader:
            inputs_grid = batch["inputs_grid"].to(device)
            inputs_scalar = batch["inputs_scalar"].to(device)
            targets = batch["targets"].to(device)
            mask = batch["mask"].to(device)
            optimizer.zero_grad(set_to_none=True)
            pred = model(inputs_grid, inputs_scalar, mask)
            loss = normalized_masked_mse(pred, targets, mask, field_scales)
            loss.backward()
            optimizer.step()
            train_loss += float(loss.detach().cpu())
            batches += 1

        val_metrics = evaluate(model, val_loader, device)
        row = {
            "epoch": float(epoch),
            "train_loss": train_loss / max(1, batches),
            "val_loss": val_metrics["loss"],
            "val_mae": val_metrics["mae"],
        }
        history.append(row)

        if row["val_loss"] < best_val:
            best_val = row["val_loss"]
            config.checkpoint.parent.mkdir(parents=True, exist_ok=True)
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "model_config": config.model,
                    "field_scales": field_scales.detach().cpu(),
                    "history": history,
                },
                config.checkpoint,
            )

    return history
