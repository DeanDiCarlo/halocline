# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Top-level `halocline/` is intentionally split by intent:

- `product/` contains runnable product/front-end work: `product/halocline-stage1/` for the current Stage 1 Node.js product, `product/halocline-app/` for the static Vercel surrogate demo frontend, plus brand docs and original logo assets.
- `research/` contains experimental and research work: the Python physics oracle port, surrogate training/evaluation package, frozen parity snapshots, visualizations, logs, and future architecture notes.

All Stage 1 app code, tests, and commands live inside `product/halocline-stage1/` — `cd product/halocline-stage1` before running Node product commands.

## Commands

```bash
cd product/halocline-stage1
npm run dev      # Start local server on http://127.0.0.1:3000 (alias: npm run demo)
npm test         # Run the full Node native test suite
```

There is no `package-lock.json` and no third-party dependencies — `npm install` is a no-op. The project requires **Node ≥ 24** because it relies on native TypeScript execution (`node app/checkpointServer.ts`) and `node --test` with TS files. There is no bundler, no Next.js, no Express, no React, and no lint script.

### Running a single test

`npm test` invokes `node --test "tests/**/*.test.ts"`. To run one file or one test:

```bash
node --test tests/model/scenarioRunner.test.ts
node --test --test-name-pattern="<substring>" tests/model/scenarioRunner.test.ts
```

### TypeScript convention

`tsconfig.json` sets `module: NodeNext` with `allowImportingTsExtensions: true` and `noEmit: true`. **All intra-repo imports must use explicit `.ts` extensions** (e.g. `import { runScenario } from "../src/lib/model/scenarioRunner.ts"`). There is no build step; types are checked only by editor/`tsc --noEmit` if invoked manually.

## Architecture

Halocline Stage 1 is a browser-first decision-support checkpoint for coastal saltwater intrusion. Stage 1 is explicitly **not a calibrated regulatory model** (not SEAWAT, not MODFLOW). Any new copy or output that touches stakeholders must preserve that disclaimer.

Internal model units are **meters, days, and cubic meters**. Numeric model fields keep unit suffixes (e.g. `pumpingCubicMetersPerDay`, `headMeters`). UI may display feet/gallons/MGD via `src/lib/units/conversions.ts`, but model objects stay in SI.

### Three-stage physics pipeline

The canonical pipeline is `runScenario` in `src/lib/model/scenarioRunner.ts`. It composes three independent solver modules — never reimplement the pipeline inline; route new UI/API/test code through `runScenario`:

1. **`solveDarcyHead`** (`darcySolver.ts`) — 2D steady-state Darcy head solve over the active grid, with mass-balance audit returned in diagnostics.
2. **`estimateInterfaceDepthFromHead`** (`ghybenHerzberg.ts`) — Ghyben-Herzberg sharp-interface depth, clamped to a per-cell aquifer-base guardrail.
3. **`computeUpconingRisk`** (`upconing.ts`) — well-level critical-pumping (`Qcrit`) and risk ratio.

`runScenario` returns cell-level outputs, well-level outputs, baseline-vs-scenario diffs, solver diagnostics, severity-tagged warnings, and a plain-English summary. Calibration-lite tuning (`modelTuning.ts`) is applied **before** solving — recharge defaults, K scaling, initial head, regional gradient, default canal stage.

### Data layer (`src/lib/data/`)

- `biscayneStage1Dataset.ts` is the **default** dataset: a generated ~2 km Biscayne/Miami-Dade-shaped grid with active/inactive cells, coastal fixed-head cells, rasterized SFWMD canal fixed-head cells, west/central/coastal K bands, and placeholder North/Central/South Dade wellfields.
- `biscayneReferenceLayers.ts` carries reference-only context (Biscayne domain polygon, SFWMD canal centerlines, USGS 2018/2022 isochlors). Each entry includes provenance fields — preserve them when adding sources.
- `mockDataset.ts` is a small 5×7 fixture retained only for legacy unit tests and isolated solver checks. **Do not** route product features through it.

### View-model layer (`src/lib/map/` and `src/lib/checkpoint/`)

The HTTP layer is intentionally thin. Each route delegates to a view-model builder that wraps `runScenario` and shapes the response:

- `mapScenarioViewModel.ts` — primary product surface. Builds head/interface/risk overlays, scenario narrative, before/after cards, well-risk ranking, well evidence trace, printable scenario brief, scenario presets, and snapshot-compare metadata.
- `mapShellViewModel.ts` — static reference geometry for the map shell.
- `checkpointScenarioRunner.ts` — internal model-inspection surface at `/checkpoint`.

When adding a new stakeholder-facing field (narrative, ranking, evidence, brief, etc.), the established pattern is: extend the view-model builder so the server returns display-ready strings/sort orders, and let the browser render them. Sort orders and copy live server-side; toggles and selection live client-side.

### HTTP server (`app/checkpointServer.ts`)

A single-file `node:http` server (~5 KLOC, mostly inlined HTML/CSS/JS for the map and checkpoint pages). Routes:

- `GET /` and `GET /map` → MapLibre-based product surface
- `GET /checkpoint` → internal model-inspection page
- `GET|POST /api/map-scenario` → primary scenario endpoint (accepts `rechargeMultiplier`, `seaLevelRiseMeters`, `wellPumpingCubicMetersPerDayById`, `wellfieldPumpingCubicMetersPerDayById`, `canalStageMetersById`, `modelTuning`)
- `GET /api/map-shell` → static shell geometry
- `GET|POST /api/scenario` and `/api/checkpoint` → checkpoint JSON (the two paths are aliases)

The browser uses MapLibre GL JS via CDN with an OpenFreeMap basemap; the SVG grid view remains as a fallback when external tiles are unavailable.

### Sprint-driven feature accretion

The `product/halocline-stage1/README.md` is organized as a sprint log (Sprint 1 through Sprint 10D). It is the authoritative record of what each piece of the API, view-model, and UI is for, and what is intentionally out-of-scope at each stage. **Read the relevant sprint sections before extending a feature** — many response fields exist to satisfy a specific sprint's stakeholder-facing requirement, and the README states what each sprint did *not* add.

## Self-Maintenance

- **Update this file after major refactors.** Whenever a change shifts the architecture described above (new pipeline stage, route rename, dataset swap, new view-model layer, dependency added, command change), edit `CLAUDE.md` in the same commit. A stale architecture section is worse than no section.
- **Maintain `patterns.md` at the repo root.** When you solve a problem that was non-obvious — a debugging path that took multiple wrong turns, a Node-24-TS quirk, a solver/numerical gotcha, a view-model shape that took iteration to land — append a short entry: problem, root cause, working solution, one-line "when to apply." Skip routine fixes. The goal is to spend tokens once on a hard problem and never again.
- **Minimize token usage.** Prefer `Read` with line ranges over full-file reads, `grep`/`rg` with specific patterns over directory dumps, and surgical `Edit` over `Write` rewrites. Don't re-read files already in context. Don't echo large file contents back to the user.
- **Spawn agents lean.** Only delegate when the task genuinely needs a fresh context window or parallelism — not for tasks the main loop can do in 2–3 tool calls. Give each agent the *exact* tools it needs (Read + Grep for research; add Edit/Write only when it must produce code) and a self-contained brief with file paths and line numbers. No "explore the repo" prompts when you already know the file.

## Stage 1 Boundaries

These constraints come from the README and apply to all code and copy in this repo:

- Output must not claim regulatory accuracy. No "calibrated", "model of record", or "signed engineering" language.
- Canal stages are simplified absolute model heads, not live SFWMD observations.
- Aquifer-base depth is a provisional display clamp, not calibrated bedrock.
- Wellfield points are placeholders, not utility-supplied locations.
- Snapshot compare and scenario presets are session-only — no saved scenarios, no URL sharing, no DB state.
