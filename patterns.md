# Patterns

## Product/Research Workspace Split

- Problem: Moving Stage 1 under `product/` and the parity snapshots under `research/` can silently break scripts and Python loaders that assume the old repo root layout.
- Root cause: `scripts/export_reference.mjs`, the Python Biscayne dataset loader, and research docs used fixed parent-directory assumptions.
- Working solution: Keep product commands rooted at `product/halocline-stage1`, keep frozen parity data at `research/reference_snapshots`, and make cross-boundary paths explicit from the workspace or research root.
- When to apply: Any time a script or test reads generated reference data across the `product/` and `research/` boundary.
