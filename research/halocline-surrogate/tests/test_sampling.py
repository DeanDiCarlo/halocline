from pathlib import Path

import numpy as np

from halocline_physics.datasets import load_biscayne_stage1_dataset
from halocline_surrogate.data.sampling import latin_hypercube, load_sampling_config, sample_scenarios


ROOT = Path(__file__).resolve().parents[2]


def test_latin_hypercube_is_deterministic():
    first = latin_hypercube(5, 3, 123)
    second = latin_hypercube(5, 3, 123)

    assert np.allclose(first, second)
    assert first.shape == (5, 3)


def test_sampling_builds_scenario_and_tuning_shapes():
    dataset = load_biscayne_stage1_dataset()
    config = load_sampling_config(ROOT / "halocline-surrogate" / "configs" / "sampling.yaml")
    samples = sample_scenarios(count=2, dataset=dataset, config=config)

    assert len(samples) == 2
    assert samples[0].inputs_scalar.shape == (7,)
    assert samples[0].inputs_wells.shape == (len(dataset.wells),)
    assert samples[0].inputs_canals.shape == (len(dataset.canals),)
    assert len(samples[0].scenario.pumping_adjustments) == len(dataset.wells)
    assert len(samples[0].scenario.canal_stage_adjustments) == len(dataset.canals)
