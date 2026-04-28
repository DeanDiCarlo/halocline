from __future__ import annotations

import torch
from torch import nn


class GNNStub(nn.Module):
    def forward(
        self,
        inputs_grid: torch.Tensor,
        inputs_scalar: torch.Tensor,
        mask: torch.Tensor,
    ) -> torch.Tensor:
        raise NotImplementedError("GNN training is reserved for the next research phase.")
