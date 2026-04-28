from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from .loop import TrainConfig, train


def load_train_config(path: str | Path) -> TrainConfig:
    raw = yaml.safe_load(Path(path).read_text(encoding="utf8"))
    return TrainConfig(
        train_path=Path(raw["data"]["train"]),
        val_path=Path(raw["data"]["val"]),
        epochs=int(raw["training"]["epochs"]),
        batch_size=int(raw["training"]["batch_size"]),
        learning_rate=float(raw["training"]["learning_rate"]),
        device=str(raw["training"].get("device", "auto")),
        checkpoint=Path(raw["output"]["checkpoint"]),
        model=dict(raw["model"]),
        num_workers=int(raw["training"].get("num_workers", 0)),
        preload=bool(raw["training"].get("preload", True)),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="configs/ufno_small.yaml")
    args = parser.parse_args()
    history = train(load_train_config(args.config))
    for row in history:
        print(
            f"epoch={int(row['epoch'])} train_loss={row['train_loss']:.6g} "
            f"val_loss={row['val_loss']:.6g} val_mae={row['val_mae']:.6g}"
        )


if __name__ == "__main__":
    main()
