# Halocline public positioning

## Approved positioning

Halocline is a coastal-aquifer planning instrument in development and a digital-twin research platform for transparent scenario screening.

Stage 1 makes the relationships among recharge, sea level, canal stages, pumping, freshwater head, estimated interface depth, and simplified well-level risk inspectable in a map-native planning surface.

Stage 1 is provisional and non-regulatory. It is not a calibrated model, a model of record, or a substitute for site-specific engineering analysis.

## Approved terminology

- **Planning instrument in development** — describes the public product surface without claiming operational readiness.
- **Digital-twin research platform** — describes the research direction and scenario workflow; it does not imply continuous synchronization with field systems.
- **Synthetic Stage 1 Python physics oracle** — describes the reference model used for the current surrogate experiment.
- **Held-out oracle evaluation** — describes evaluation on synthetic scenarios reserved from surrogate training.
- **Simplified 2D steady sharp-interface model** — describes the oracle's current scope.
- **Map-native scenario surface** — describes the browser experience that displays inputs, outputs, diagnostics, warnings, and well evidence.

## Public evidence language

The following statement is approved when its qualifications remain adjacent:

> Using a 4,000 / 500 / 500 train-validation-test split, a U-FNO surrogate achieved 1.78 m head MAE and 8.02 m interface-depth MAE against the simplified synthetic Stage 1 Python physics oracle on held-out samples, with a 174.57x batched speedup over that oracle on held-out data at batch size 2,048.

Always pair that statement with:

- The results are against a synthetic oracle, not field observations.
- The oracle is a simplified 2D steady sharp-interface model.
- This is not field validation or calibrated MODFLOW, SEAWAT, or PFLOTRAN performance.
- The speedup is a batch-size-2,048 result; it is not a single-scenario performance claim.

## Claim guardrails

Do say:

- "research platform," "planning instrument in development," "provisional," and "non-regulatory."
- "estimated interface depth" and "simplified well-level risk."
- "scenario screening" and "identifies scenarios for deeper review."

Do not say:

- "calibrated," "validated against field conditions," "regulatory," "model of record," or "signed engineering."
- That Halocline continuously synchronizes with live field systems.
- That the current Stage 1 work outperforms, replaces, or is calibrated to MODFLOW, SEAWAT, PFLOTRAN, or another high-fidelity simulator.
- That deck-only toy-MODFLOW metrics or GeoFUSE speedups are Halocline results.

## Source artifacts

- [Surrogate process update](../../../research/halocline-surrogate/results/process_update_2026_04_28.md) — full experiment context, caveats, artifact inventory, and reported metrics.
- [RTX 4090 held-out benchmark](../../../research/halocline-surrogate/results/rtx4090_4000_500_500.md) — metric and runtime tables.
- [Benchmark CSV](../../../research/halocline-surrogate/results/report_4090.csv) — underlying reported values.
- [Physics oracle package](../../../research/halocline-physics/README.md) — Python Stage 1 oracle implementation.
- [Surrogate package](../../../research/halocline-surrogate/README.md) — synthetic-oracle and speedup framing.
