# H100 Run Commands

Run from the repo root after cloning and installing `research/requirements.txt`.

```bash
cd research/halocline-surrogate

../../.venv/bin/python - <<'PY'
import torch
print("cuda:", torch.cuda.is_available())
print("gpu:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "no cuda")
PY

../../.venv/bin/python -m halocline_surrogate.data.generate \
  --config configs/sampling.yaml \
  --output data_h100 \
  --train 25000 \
  --val 3000 \
  --test 3000 \
  2>&1 | tee generate_h100.log

../../.venv/bin/python -m halocline_surrogate.train.cli \
  --config configs/ufno_h100_fast.yaml \
  2>&1 | tee train_h100_fast.log

../../.venv/bin/python -m halocline_surrogate.eval.report \
  --dataset data_h100/test.h5 \
  --checkpoint checkpoints/ufno_h100_fast.pt \
  --output report_h100_fast.csv \
  --benchmark-batch-sizes 1,64,512,2048 \
  2>&1 | tee report_h100_fast.log
```

If time remains and the fast run is healthy, run the larger config:

```bash
../../.venv/bin/python -m halocline_surrogate.train.cli \
  --config configs/ufno_h100.yaml \
  2>&1 | tee train_h100.log

../../.venv/bin/python -m halocline_surrogate.eval.report \
  --dataset data_h100/test.h5 \
  --checkpoint checkpoints/ufno_h100.pt \
  --output report_h100.csv \
  --benchmark-batch-sizes 1,64,512,2048 \
  2>&1 | tee report_h100.log
```

Copy back at minimum:

```text
research/halocline-surrogate/report_h100_fast.csv
research/halocline-surrogate/train_h100_fast.log
research/halocline-surrogate/checkpoints/ufno_h100_fast.pt
```
