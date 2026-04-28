from __future__ import annotations

import torch
from torch import nn


class WNOStub(nn.Module):
    def forward(
        self,
        inputs_grid: torch.Tensor,
        inputs_scalar: torch.Tensor,
        mask: torch.Tensor,
    ) -> torch.Tensor:
        raise NotImplementedError("WNO training is reserved for the next research phase.")
