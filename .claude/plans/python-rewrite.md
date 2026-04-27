# Halocline: Python-First Rewrite Plan

## Context

The repo I just inherited from Owen's Google Drive is `halocline-stage1/`, a ~7,080-line TypeScript/Node browser app implementing a classical 2D groundwater pipeline (SOR Darcy solve → Ghyben-Herzberg sharp interface → Strack-style upconing risk). The stated research goal is to reproduce the speedup-vs-accuracy result from the GeoFUSE subterranean surrogate paper using a U-FNO baseline, then progressively replace it with a Wavelet Neural Operator and a GNN to set up future 3D generalization. The current code contains **zero ML infrastructure** — no FNO/WNO/GNN, no Python, no PyTorch.

Two integrity findings drive this plan:

1. **The "~0 MAE/RMSE" Owen demoed is not real.** There is no MAE/RMSE computation anywhere in the codebase. The number on screen is almost certainly the Darcy mass-balance residual (which a converged solver drives to ~0% by construction — that's the solver's stopping condition, not accuracy) or a Current-vs-Baseline diff with no scenario change applied. Tests are tautological (`tests/model/scenarioRunner.test.ts:382-420` compares two runs of the same code; only `tests/model/ghybenHerzberg.test.ts` uses an analytical reference). The repo's own provenance notes already concede the model is uncalibrated against USGS isochlors (`halocline-stage1/src/lib/data/biscayneReferenceLayers.ts:361,373`).
2. **The actual physics is small** — ~900 lines across 4 files (`darcySolver.ts` 300, `ghybenHerzberg.ts` 46, `upconing.ts` 58, `scenarioRunner.ts` 472). The other 4,934 lines are a hand-rolled HTML/JS server. Porting the physics to numpy + scipy is a day of work and removes the Node ↔ Python bridge entirely, lets the oracle output flow into PyTorch tensors with no serialization, and unlocks `scipy.sparse.linalg.spsolve` (a direct sparse solve, much faster than SOR on a 23×38 grid).

Decision: rewrite in mostly Python. Keep `halocline-stage1/` as a **frozen parity reference** so the Python port has one trustworthy ground-truth check before any ML happens.

## Repo layout after this plan

```
halocline/
  halocline-stage1/                    # Existing TS code, frozen, parity reference only
  halocline-physics/                   # NEW Python port of the oracle
    pyproject.toml
    src/halocline_physics/
      grid.py                          # Grid, GridCell, active mask, indexing
      boundary_conditions.py
      darcy_solver.py                  # scipy.sparse 5-point assembly + spsolve
      ghyben_herzberg.py               # rho_f / (rho_s - rho_f) * (h - sea_level), clamp
      upconing.py                      # q_crit = 2*pi*d*K*delta_rho/rho * z_crit; classify
      model_tuning.py                  # ResolvedModelTuning dataclass
      scenario.py                      # Scenario, PumpingAdjustment, CanalAdjustment
      scenario_runner.py               # run_scenario(...) -> ModelResult
      datasets/
        biscayne_stage1.py             # Port of biscayneStage1Dataset.ts
        reference_layers.py            # USGS 2018/2022 isochlors as reference only
    tests/
      test_ghyben_herzberg.py          # Analytical 40x ratio check
      test_darcy_analytical.py         # 1D linear-gradient analytical solution
      test_parity_with_ts.py           # Match frozen TS snapshot within tolerance
      test_mass_balance.py             # Conservation residual check
  halocline-surrogate/                 # NEW Python ML package
    pyproject.toml
    configs/
      sampling.yaml                    # LHS bounds for the 10 knobs
      ufno_small.yaml  wno.yaml  gnn.yaml
    src/halocline_surrogate/
      data/
        sampling.py                    # Latin Hypercube over 10 knobs
        generate.py                    # CLI: sample -> physics -> HDF5
        dataset.py                     # torch Dataset, applies active mask
      models/
        base.py                        # SurrogateModel ABC
        ufno.py                        # FNO blocks interleaved with U-Net branch
        wno.py                         # Stub, same interface
        gnn.py                         # Stub, same interface
      train/
        losses.py                      # Masked MAE/RMSE/relL2
        loop.py
        cli.py
      eval/
        metrics.py                     # Per-field masked MAE/RMSE
        benchmark.py                   # Wall-clock physics vs surrogate
        report.py
      validation/
        oracle_sanity.py               # Honest pre-ML sanity sweep
    tests/
  halocline-app/                       # NEW Streamlit frontend (lightweight)
    pyproject.toml
    src/halocline_app/
      main.py                          # Streamlit entry, sliders + map
      figures.py                       # plotly head/interface field rendering
      mode_toggle.py                   # physics-oracle vs trained-surrogate switch
  reference_snapshots/                 # Frozen TS outputs from Phase 0
    scenarios.jsonl                    # 50 LHS-sampled scenarios + their TS outputs
    grid_geometry.json                 # 23x38 mask, cell coords, well/canal locations
```

## Phase 0 — Freeze a TS parity snapshot (do this once, then never touch Node again)

Goal: capture the TS oracle's outputs on a fixed scenario set so the Python port has a real ground-truth comparison.

1. Install Node 24 via nvm (per `~/.claude/CLAUDE.md`): `nvm install 24 && nvm use 24`.
2. Fix the broken test glob in `halocline-stage1/package.json` — Node 22+ accepts `--test tests/**/*.test.ts` (no quotes) for native glob expansion. Run `npm test` and record results. Expected: `tests/model/ghybenHerzberg.test.ts` passes (analytical), the rest pass on internal consistency.
3. Run `npm run dev` and click through the checkpoint at `http://127.0.0.1:3000/checkpoint` and the map at `/`. Confirm the "0 MAE" number on screen is `massBalanceErrorPercent` from `halocline-stage1/src/lib/model/darcySolver.ts:91-147`, not accuracy. Document this in `reference_snapshots/README.md`.
4. Add `halocline-stage1/scripts/export_reference.mjs` (one-shot Node script): import `runScenario` from `src/lib/model/scenarioRunner.ts`, sample 500 scenarios via Latin Hypercube over the 10-knob input space (ranges from `src/lib/model/modelTuning.ts` and Sprint 8A/10A README sections), call the runner, write `{inputs, head_grid, interface_grid, well_results, diagnostics}` to `reference_snapshots/scenarios.jsonl`. Also export grid geometry (mask, cell coords, well IDs, canal IDs) to `reference_snapshots/grid_geometry.json`. Expected wall clock: ~1 min single-threaded at ~100 ms/scenario.
5. Commit the snapshot. From this point on, the TS code is frozen.

## Phase 1 — Port physics to Python (`halocline-physics/`)

Goal: a faithful Python reimplementation that matches the frozen TS snapshot within numerical tolerance.

Critical files to mirror:
- `halocline-stage1/src/lib/model/darcySolver.ts` → `darcy_solver.py`. Replace SOR with sparse assembly: build the 5-point Laplacian as `scipy.sparse.csr_matrix`, fold fixed-head cells into the RHS, solve with `scipy.sparse.linalg.spsolve`. Same harmonic-mean conductance as `calculateConductanceBetweenCells` (TS line 32). Also port the mass-balance audit (TS line 91) — keep it as a diagnostic, but be explicit in docstrings that this is conservation, not accuracy.
- `halocline-stage1/src/lib/model/ghybenHerzberg.ts` → `ghyben_herzberg.py`. Direct port; same default densities (1000/1025), same aquifer-base clamp.
- `halocline-stage1/src/lib/model/upconing.ts` → `upconing.py`. Direct port; same `z_crit = 0.3 * d`, same risk thresholds (0.5/0.75/1.0).
- `halocline-stage1/src/lib/model/scenarioRunner.ts` → `scenario_runner.py`. Port `applyScenarioToGrid` (TS line 139), `runScenarioCore` (TS line 229), `buildDiff` (TS line 382). Use `dataclasses` for `Scenario`, `ResolvedModelTuning`, `ModelResult`.
- `halocline-stage1/src/lib/data/biscayneStage1Dataset.ts` → `datasets/biscayne_stage1.py`. The cleanest path is: load `reference_snapshots/grid_geometry.json` directly (already exported in Phase 0) instead of re-implementing the geo projection. Keep `biscayneStage1AquiferBaseDepthMeters = 60`, K-zone bands (500/1200/2500), placeholder wellfields.

Critical tests:
- `tests/test_ghyben_herzberg.py` — analytical: 1 m freshwater head, 0 m sea level → 40 m interface depth (within 0.5 m).
- `tests/test_darcy_analytical.py` — 1D channel with fixed-head boundaries at 0 and 1 m, uniform K, no recharge or pumping → linear head profile. The Python solver must match the analytical solution to 1e-6.
- `tests/test_parity_with_ts.py` — for each of the 500 scenarios in `reference_snapshots/scenarios.jsonl`: run the Python `run_scenario`, compare per-cell head and interface depth against the TS snapshot. Report MAE and max abs error per scenario. **Pass criterion: MAE < 0.01 m on head, MAE < 0.5 m on interface depth, across all active cells, across all 500 scenarios.** This is the first trustworthy numerical check of the entire pipeline.

## Phase 2 — Surrogate package (`halocline-surrogate/`)

Goal: train a U-FNO on physics-oracle data, measure honest MAE/RMSE and speedup; structure for WNO/GNN swap-in.

Key decisions (carrying over from the prior surrogate sketch, simplified now that the oracle is in-process Python):

- **Sampling**: Latin Hypercube over the 10 knobs (`rechargeMultiplier`, `seaLevelRiseMeters`, 3 well pumpings, ~8 canal stages, 5 tuning fields). Ranges from Phase 0 sampling config. 4,000 train / 500 val / 500 test = 5,000 scenarios.
- **Generation**: direct Python calls to `halocline_physics.run_scenario` in a `multiprocessing.Pool`. No Node, no JSON-over-stdio, no HTTP. Estimated 5–15 min wall clock with 4 workers.
- **Storage**: HDF5, one file per split. Per-sample tensors: `inputs_grid (C_in, 23, 38)`, `inputs_scalar (7,)`, `inputs_wells (3,)`, `inputs_canals (N_canals,)`, `targets (2, 23, 38)` for `[head, interface_depth]`. One global `grid.h5` with mask + cell coordinates.
- **Models** (`models/base.py`): `SurrogateModel` Protocol with `forward(inputs_grid, inputs_scalar, mask) -> Tensor` shape `(B, 2, 23, 38)`. `ufno.py` interleaves FNO spectral blocks with a small 2-level U-Net branch (matches Wen et al. 2022, *not* vanilla FNO). `wno.py` and `gnn.py` are stubs implementing the same Protocol so they slot in without touching training/eval code.
- **Loss**: `masked_l2 = ((pred - tgt)**2 * mask).sum() / mask.sum()`, per-field with normalization (head and interface live on different scales).
- **Eval** (`eval/metrics.py`, `eval/benchmark.py`): per-field masked MAE/RMSE/relative-L2 on the test split. Wall-clock benchmark reports oracle ms/scenario at single-thread *and* surrogate ms/scenario at batch=1 and batch=64. Report both — never just the favorable one. `eval/report.py` writes a CSV + matplotlib plot of accuracy-vs-speedup, which is the GeoFUSE-style result we're after.
- **Honest pre-ML sanity** (`validation/oracle_sanity.py`): sweep 200 LHS scenarios, emit a single JSON `{n, mb_residual_p95, gh_violation_rate, monotonicity_pass_rate}`. This is the trustworthy number that replaces the bogus "0 MAE" demo claim.

## Phase 3 — Lightweight Streamlit app (`halocline-app/`)

Goal: stakeholder-presentable UI that does what Owen's TS app did, plus a switch to compare physics vs surrogate predictions.

- `streamlit` + `plotly` (no MapLibre — overkill for research). Run with `streamlit run main.py`.
- Sliders for the 10 scenario knobs (same ranges as the LHS sampler).
- Two side-by-side plotly heatmaps: head field and interface depth, with the active mask shown as transparent.
- Mode toggle: "physics oracle" vs "trained surrogate" vs "diff (oracle − surrogate)". The diff view is the honest accuracy display — it shows where the surrogate is wrong, in meters, on every cell.
- Per-well risk table reusing `halocline_physics.upconing.classify_risk`.
- Numbers shown are real MAE/RMSE from `eval/metrics.py`, not mass-balance residuals. Mass balance shown separately and labeled "conservation check (not accuracy)".

## Verification (end-to-end)

The plan is correct when all of these hold:

1. **Phase 0 frozen**: `reference_snapshots/scenarios.jsonl` exists, contains 500 scenarios, was generated under Node 24 with `npm test` passing.
2. **Phase 1 parity**: `pytest halocline-physics/tests/` passes, including `test_parity_with_ts.py` with MAE < 0.01 m on head and < 0.5 m on interface across all 500 frozen scenarios.
3. **Phase 1 analytical**: `test_darcy_analytical.py` and `test_ghyben_herzberg.py` pass against analytical solutions (not snapshots of themselves).
4. **Phase 2 honest baseline**: `python -m halocline_surrogate.validation.oracle_sanity` writes a JSON with finite, defensible numbers for the 200-scenario sanity sweep — this is the antidote to the "0 MAE" demo.
5. **Phase 2 trained model**: `python -m halocline_surrogate.train.cli --config configs/ufno_small.yaml` trains; `python -m halocline_surrogate.eval.report` writes `report.csv` with separate columns for head MAE, head RMSE, interface MAE, interface RMSE, oracle ms/scenario, surrogate ms/scenario at batch=1 and batch=64. Speedup is *measured*, not asserted.
6. **Phase 3 demo**: `streamlit run halocline-app/src/halocline_app/main.py` opens; sliders update both fields in real time; the diff view renders meaningful per-cell error and is sourced from the same eval pipeline as the report.

## Out of scope (next research step, not this plan)

- 3D grids, transient/time-stepping solves, variable-density (SEAWAT-style) coupling.
- Real Biscayne calibration against observations or USGS isochlors.
- WNO and GNN training runs — they get their interface stub here so they can be slotted in next, but training them is the next plan.
- Reproducing the full TS UI (presets catalog, snapshot tray, narrative paragraphs, print brief).
- Production deployment, uncertainty quantification, active learning.

The 2D steady sharp-interface oracle means measured speedup is an **upper bound** on what would be seen against a real 3D variable-density transient solver. This caveat must appear in any writeup.
