# Halocline Surrogate

Phase 2 surrogate package for training neural operators against the Python physics oracle.

This package measures two separate things:

- accuracy against the synthetic physics oracle, not field observations
- wall-clock speedup against the Python oracle, not a calibrated 3D variable-density model

Typical local setup:

```bash
python -m venv .venv
.venv/bin/python -m pip install -e ../halocline-physics
.venv/bin/python -m pip install -e '.[test,report]'
```

Generate a small smoke-test dataset:

```bash
.venv/bin/python -m halocline_surrogate.data.generate --config configs/sampling.yaml --output data/smoke --train 16 --val 4 --test 4
```

Run the pre-ML oracle sanity sweep:

```bash
.venv/bin/python -m halocline_surrogate.validation.oracle_sanity --n 200 --output oracle_sanity.json
```
