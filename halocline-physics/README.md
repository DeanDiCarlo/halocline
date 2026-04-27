# Halocline Physics

Python port of the frozen Halocline Stage 1 TypeScript physics oracle.

The package intentionally preserves the Stage 1 model boundaries: steady 2D Darcy heads, Ghyben-Herzberg sharp-interface depth, and simplified Strack-style upconing risk. The mass-balance diagnostic is a conservation residual from the solve, not an accuracy metric.

Set up and run tests from this directory:

```bash
python -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
.venv/bin/python -m pytest
```
