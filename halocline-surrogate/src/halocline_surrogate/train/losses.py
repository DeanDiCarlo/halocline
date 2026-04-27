from __future__ import annotations

import torch


def masked_mse(pred: torch.Tensor, target: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    field_mask = mask.expand_as(pred)
    return ((pred - target).pow(2) * field_mask).sum() / field_mask.sum().clamp_min(1)


def masked_mae(pred: torch.Tensor, target: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    field_mask = mask.expand_as(pred)
    return ((pred - target).abs() * field_mask).sum() / field_mask.sum().clamp_min(1)


def masked_rmse(pred: torch.Tensor, target: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    return torch.sqrt(masked_mse(pred, target, mask))


def normalized_masked_mse(
    pred: torch.Tensor,
    target: torch.Tensor,
    mask: torch.Tensor,
    field_scales: torch.Tensor | None = None,
) -> torch.Tensor:
    if field_scales is None:
        field_scales = torch.ones(pred.shape[1], device=pred.device)
    scales = field_scales[None, :, None, None].clamp_min(1e-6)
    return masked_mse(pred / scales, target / scales, mask)
