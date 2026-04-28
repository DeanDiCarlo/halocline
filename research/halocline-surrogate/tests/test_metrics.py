import numpy as np

from halocline_surrogate.eval.metrics import metrics_for_arrays


def test_masked_metrics_ignore_inactive_cells():
    target = np.zeros((1, 2, 2, 2), dtype=np.float32)
    pred = np.zeros_like(target)
    target[:, 0, 0, 0] = 1
    pred[:, 0, 0, 0] = 2
    target[:, 0, 1, 1] = 100
    pred[:, 0, 1, 1] = -100
    mask = np.asarray([[[1, 0], [0, 0]]], dtype=np.float32)

    metrics = metrics_for_arrays(pred, target, mask)

    assert metrics.head.mae == 1
    assert metrics.head.rmse == 1
