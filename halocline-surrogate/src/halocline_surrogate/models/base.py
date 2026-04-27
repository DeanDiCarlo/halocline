from __future__ import annotations

from typing import Protocol

import torch


class SurrogateModel(Protocol):
    def forward(
        self,
        inputs_grid: torch.Tensor,
        inputs_scalar: torch.Tensor,
        mask: torch.Tensor,
    ) -> torch.Tensor:
        """Return `(B, 2, H, W)` predictions for head and interface depth."""
        ...
