# Patterns

## Product/Research Workspace Split

- Problem: Moving Stage 1 under `product/` and the parity snapshots under `research/` can silently break scripts and Python loaders that assume the old repo root layout.
- Root cause: `scripts/export_reference.mjs`, the Python Biscayne dataset loader, and research docs used fixed parent-directory assumptions.
- Working solution: Keep product commands rooted at `product/halocline-stage1`, keep frozen parity data at `research/reference_snapshots`, and make cross-boundary paths explicit from the workspace or research root.
- When to apply: Any time a script or test reads generated reference data across the `product/` and `research/` boundary.

## Vite Static Frontend With Vercel API

- Problem: Rewriting every route to a Vercel function made the Stage 1 frontend behave like a raw Node server on a platform designed around static frontend output plus request-scoped functions.
- Root cause: `app/checkpointServer.ts` mixed static HTML, PNG delivery, local server startup, and JSON model endpoints in one bundle, so Vercel had to invoke serverless code for pages and assets that should be static.
- Working solution: Generate static HTML into ignored `web/` pages, build them with Vite into `dist/`, serve PNGs from `public/assets/`, keep shared API behavior in `app/apiRoutes.ts`, and expose concrete `api/*.ts` entrypoints for each `/api/*` route.
- When to apply: Any time frontend routes or assets can be served statically while model/scenario work still needs Vercel Functions.
