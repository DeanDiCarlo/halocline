# Halocline Workspace

The repo is split by intent:

- `product/` contains the runnable product and generated frontend surfaces.
- `research/` contains physics parity work, surrogate training/evaluation, frozen reference snapshots, reports, and experiment artifacts.

## Product

```bash
cd product/halocline-stage1
npm run dev
npm run build
npm test
```

`product/halocline-stage1` is the current Stage 1 browser-first decision-support product. It uses Vite for the static frontend and Vercel functions for `/api/*` model endpoints. `product/halocline-app` is the separate static Vercel surrogate demo frontend. Brand source docs and logo originals live in `product/BRANDING.md` and `product/Logo Assets/`.

## Research

```bash
cd research
../.venv/bin/python -m pip install -r requirements.txt
```

`research/halocline-physics` is the Python port of the Stage 1 oracle. `research/halocline-surrogate` is the neural-operator training/evaluation package. `research/reference_snapshots` is the frozen TypeScript parity dataset, and `research/visualizations` stores generated experiment images.
