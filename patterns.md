# Patterns

## Product/Research Workspace Split

- Problem: Moving Stage 1 under `product/` and the parity snapshots under `research/` can silently break scripts and Python loaders that assume the old repo root layout.
- Root cause: `scripts/export_reference.mjs`, the Python Biscayne dataset loader, and research docs used fixed parent-directory assumptions.
- Working solution: Keep product commands rooted at `product/halocline-stage1`, keep frozen parity data at `research/reference_snapshots`, and make cross-boundary paths explicit from the workspace or research root.
- When to apply: Any time a script or test reads generated reference data across the `product/` and `research/` boundary.

## Vercel Adapter for Raw Node Stage 1

- Problem: Vercel cannot deploy the Stage 1 product by running `npm run dev`, and setting the root directory alone can leave `/` as a 404.
- Root cause: `app/checkpointServer.ts` was a long-running `node:http` server that immediately called `server.listen(...)`; Vercel expects a function exported from the project-root `api/` directory and needs project-local TypeScript/Node type packages during compilation.
- Working solution: Export `handleCheckpointRequest` from `app/checkpointServer.ts`, only call `listen` when that file is run directly, add `api/index.ts` as the Vercel function, rewrite `/(.*)` to `/api` in `vercel.json`, and keep `typescript` plus `@types/node` installed as dev dependencies.
- When to apply: Any time the raw Node Stage 1 frontend needs to run on Vercel without converting to Next/Vite/Express.
