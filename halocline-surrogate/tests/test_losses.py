import torch

from halocline_surrogate.train.losses import masked_mae, masked_mse


def test_masked_losses_ignore_nan_inactive_targets():
    pred = torch.zeros((1, 2, 2, 2))
    target = torch.zeros_like(pred)
    target[:, :, 1, 1] = torch.nan
    mask = torch.tensor([[[[1.0, 1.0], [1.0, 0.0]]]])

    assert torch.isfinite(masked_mse(pred, target, mask))
    assert torch.isfinite(masked_mae(pred, target, mask))
