# Process Update: Physics Oracle to GPU-Trained Surrogate

Date: 2026-04-28

## What We Set Out To Prove

The goal was to move Halocline from a TypeScript-only Stage 1 groundwater demo into a Python-first research workflow that can support a neural surrogate. The key question for this round was not field accuracy. It was:

> Can we generate synthetic oracle data from the Python physics model, train a U-FNO surrogate, and measure a real wall-clock speedup against the oracle?

We now have an end-to-end answer: yes, with important caveats.

## Foundation Work

### 1. Frozen TypeScript Reference

We first froze the existing TypeScript Stage 1 model as a parity reference.

- Generated `reference_snapshots/scenarios.jsonl`
- Generated `reference_snapshots/grid_geometry.json`
- Captured 500 deterministic Latin Hypercube scenarios
- Documented that the old near-zero UI number was mass-balance residual, not MAE/RMSE

This gave the Python rewrite a fixed target.

### 2. Python Physics Oracle

We then implemented `halocline-physics/`, a Python port of the Stage 1 physics:

- sparse Darcy head solve
- Ghyben-Herzberg sharp-interface depth
- simplified upconing risk
- scenario runner
- snapshot-backed Biscayne grid loader

Validation passed against all 500 TypeScript snapshots:

- max head MAE: `0.0001169 m`
- max interface MAE: `0.0006471 m`

This confirmed the Python oracle faithfully reproduces the frozen TypeScript oracle.

## Surrogate Package

We added `halocline-surrogate/` with:

- deterministic Latin Hypercube scenario sampling
- HDF5 oracle dataset generation
- PyTorch dataset loader
- U-FNO-style model
- WNO/GNN stubs for later replacement
- masked losses for active grid cells
- training CLI
- benchmark/report CLI
- oracle sanity checks

During local CPU testing, we found and fixed an important issue: inactive target cells contain `NaN`, and PyTorch propagates `NaN * 0` unless losses explicitly sanitize non-finite values. The masked losses now use `torch.nan_to_num(...)` before applying the active-cell mask.

## CPU Smoke Run

Before renting GPU time, we ran a small local CPU experiment:

- train: 250 scenarios
- validation: 50 scenarios
- test: 50 scenarios
- epochs: 5

This proved the full pipeline worked, but accuracy was weak:

- head MAE: `3.13 m`
- interface MAE: `46.16 m`
- batch=64 speedup: `5.11x`

This was useful as a pipeline proof, not a serious surrogate result.

## RunPod GPU Training

We rented a RunPod GPU instance with an RTX 4090. The original intent was an H100-sized run, but the available pod was RTX 4090. The first attempted 25k/3k/3k generation was too slow because dataset generation is CPU-bound:

> Python physics oracle solve + HDF5 writing

The GPU does not materially accelerate generation. We reduced to:

- train: 4,000 scenarios
- validation: 500 scenarios
- test: 500 scenarios

Training used:

- config: `configs/ufno_h100_fast.yaml`
- epochs: 30
- model width: 32
- depth: 4
- Fourier modes: 12 x 12

The first GPU setup also exposed a CUDA compatibility issue: the installed PyTorch build expected a newer driver. We fixed it by installing the PyTorch CUDA 12.4 wheel on the pod.

## GPU Training Result

Training improved steadily for all 30 epochs:

- validation MAE: `25.88 -> 4.92`
- validation loss: `1359.04 -> 44.19`
- no obvious overfitting in the logged window

Held-out test metrics:

| Metric | Value |
| --- | ---: |
| Head MAE | `1.7795 m` |
| Head RMSE | `2.5586 m` |
| Head relative L2 | `0.5294` |
| Interface-depth MAE | `8.0179 m` |
| Interface-depth RMSE | `8.9869 m` |
| Interface-depth relative L2 | `0.1712` |

Runtime benchmark:

| Mode | ms/scenario | Speedup |
| --- | ---: | ---: |
| Python physics oracle | `11.3146` | `1.00x` |
| Surrogate batch=1 | `2.4777` | `4.57x` |
| Surrogate batch=64 | `0.2337` | `48.42x` |
| Surrogate batch=512 | `0.2493` | `45.38x` |
| Surrogate batch=2048 | `0.0648` | `174.57x` |

The best pitch line from this run is:

> A U-FNO surrogate trained on 4,000 synthetic oracle scenarios achieved 1.78 m head MAE and 8.02 m interface-depth MAE on 500 held-out oracle scenarios, while delivering up to 174.6x batched inference speedup over the Python physics oracle.

## Artifacts Created

Benchmark results:

- `halocline-surrogate/results/report_4090.csv`
- `halocline-surrogate/results/train_4090.log`
- `halocline-surrogate/results/rtx4090_4000_500_500.md`

Model/data artifacts:

- `halocline-surrogate/checkpoints/ufno_h100_fast.pt`
- `halocline-surrogate/data_h100/test.h5`

Visualizations:

- `visualizations/rtx4090_surrogate_speedup_dashboard.png`
- `visualizations/rtx4090_oracle_vs_surrogate_heatmaps.png`
- `visualizations/physics_oracle_vs_surrogate_cpu_300.png`

## What This Result Means

This is now more than a mocked claim. We have:

1. a Python physics oracle
2. synthetic oracle sample generation
3. a trained U-FNO surrogate
4. held-out oracle accuracy metrics
5. measured wall-clock speedup
6. spatial heatmap comparisons

The speedup result is real for this workflow.

## What It Does Not Mean Yet

This does not prove real-world Biscayne aquifer accuracy.

Important caveats:

- The oracle is synthetic model output, not observations.
- The oracle is a simplified 2D steady sharp-interface model.
- It is not a calibrated SEAWAT/MODFLOW-style variable-density model.
- The interface error is still material at about 8 m MAE.
- The largest speedup is a batched inference result; batch=1 speedup is more modest at 4.57x.

The honest framing is:

> We demonstrated surrogate acceleration against a simplified coastal groundwater physics oracle. The next research step is improving oracle fidelity and validating against observations.

## Next Steps

Short-term:

- regenerate the speedup dashboard automatically from `report_4090.csv`
- add a CLI to create heatmap artifacts from any checkpoint/test split
- try loss weighting to improve interface-depth accuracy
- train longer or with a larger dataset if generation is optimized

Medium-term:

- parallelize oracle data generation
- add a stronger baseline model comparison
- calibrate/validate against real observation layers
- test WNO and GNN replacements using the same data/eval interface

Long-term:

- move beyond the 2D steady sharp-interface oracle toward a higher-fidelity groundwater simulator
- use the surrogate workflow to measure speedup against a truly expensive oracle
