# Halocline Stage 1

Browser-first decision-support checkpoint for coastal saltwater intrusion scenario exploration.

Stage 1 is intentionally limited to scenario state, simplified model inputs, and a future three-step physics pipeline:

1. 2D steady-state Darcy head solve.
2. Ghyben-Herzberg interface-depth conversion.
3. Well-level upconing risk calculation.

Internal model units are meters, days, and cubic meters. UI labels can convert to feet, gallons, or MGD later, but model objects should keep unit suffixes on numeric fields.

## Sprint 1

This initial code defines:

- Core `Grid`, `GridCell`, `Well`, `Canal`, `Scenario`, and `ModelResult` types.
- A baseline scenario.
- Unit conversion helpers.
- Mock domain, wells, canals, and grid data.
- A small scenario state store that can represent pumping, recharge, sea-level, and canal-stage changes.
- A mock view-model loader for early UI development before solver logic exists.

Run Sprint 1 validation:

```bash
npm test
```

## Stage 1 Frontend

The local product frontend is served by Vite. `npm run dev` first regenerates static HTML under the ignored `web/` directory, then starts Vite with local `/api/*` middleware:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:3000
```

Vite may select another port if 3000 is occupied. The root route serves the branded Halocline website draft. The map-facing product surface remains available at:

```text
http://127.0.0.1:3000/map
```

The internal checkpoint/debug page is available at:

```text
http://127.0.0.1:3000/checkpoint
```

Build and deployment validation:

```bash
npm run build
npm run typecheck
npm test
```

The Vercel project root should be `product/halocline-stage1`. Vercel runs the Vite build, serves `dist/`, and invokes the concrete `api/*.ts` functions only for `/api/*`.

## Branded Website Draft

The root route (`/`) is a brand-facing website draft built from `../BRANDING.md` and the supplied logo assets. It uses the Halocline palette (`ink`, `bone`, `steel`, `chloride`), Inter and IBM Plex Mono, flat cross-section motifs, and trust copy that preserves the Stage 1 non-regulatory disclaimer.

The web-sized logo derivatives and generated research images live under `public/assets/` for Vite/Vercel static delivery:

```text
GET /assets/halocline-mark.png
GET /assets/halocline-wordmark.png
GET /assets/boundary_model.png
GET /assets/scenario_surface.png
GET /assets/ufno_heatmap.png
```

The website links through to `/map` for the live scenario surface and `/checkpoint` for backend-style model inspection.

The checkpoint proves that the current backend-style pipeline is connected end to end:

1. Scenario inputs are posted from the browser.
2. The mock grid is updated with recharge, pumping, and sea-level boundary changes.
3. The Darcy head solver runs.
4. Ghyben-Herzberg converts solved head to estimated interface depth.
5. The upconing module computes well-level risk.
6. JSON output drives the grid, diagnostics, summary, and well-risk table.

The checkpoint now defaults to the Sprint 7B real-domain Stage 1 dataset:

- A generated 2 km Biscayne/Miami-Dade-shaped grid.
- Active/inactive cells derived from the Sprint 7A reference domain polygon.
- Semi-real placeholder wellfield points for North, Central, and South Dade.
- Simplified coastal fixed-head cells and Sprint 7C modeled canal fixed-head cells.

The checkpoint uses real Stage 1 math code:

- `solveDarcyHead`
- `interfaceDepthFromHead`
- `computeUpconingRisk`

The checkpoint must not claim regulatory accuracy. It is not a calibrated SEAWAT replacement, not a MODFLOW model of record, and not suitable for signed engineering decisions. Its purpose is to keep the model pipeline visible while the real map and data layers are built.

Backend-style checkpoint JSON is available at:

```text
GET  /api/checkpoint
POST /api/checkpoint
```

The older `/api/scenario` path remains available as a compatibility alias for the current screen.

## Sprint 4 Model Pipeline

The official Stage 1 pipeline lives in `src/lib/model/scenarioRunner.ts`.

Use `runScenario` when future UI, map, API, or test code needs the model result. The checkpoint route delegates to this runner instead of assembling physics itself.

`runScenario` returns:

- Cell-level head, interface depth, source/sink, boundary, and well-id outputs.
- Well-level pumping, local head, interface depth, critical pumping, risk ratio, and risk level outputs.
- Baseline-vs-scenario cell and well diffs.
- Solver diagnostics and a plain-English summary.

The checkpoint page remains an internal inspection surface; the model runner is the source of truth.

## Sprint 5A Map Shell

The first map-facing product surface is now available at:

```text
http://127.0.0.1:3000/map
```

Sprint 5A intentionally stays dependency-free. It renders a static mock map shell from the existing dataset rather than using MapLibre or real Biscayne layers.

The map shell includes:

- A stable operational layout for future map work.
- Projected mock domain geometry.
- Mock grid cells.
- Coastline edge.
- Canal alignment.
- Well markers.
- Visible placeholders for future head, interface, and risk layers.

The map shell data is available at:

```text
GET /api/map-shell
```

Sprint 5B should connect `runScenario` outputs to this surface as visual model layers.

## Sprint 5B Map Layers

The map page now renders baseline model outputs from `runScenario`:

- Head as colored grid cells.
- Interface depth as a blue overlay.
- Well risk as colored well markers.
- Solver diagnostics and aggregate model context in the inspection panel.
- Client-side toggles for domain, canals, wells, head, interface, and risk.

Baseline map-layer JSON is available at:

```text
GET /api/map-scenario
```

The map is still mock-data-only and dependency-free. Live scenario controls are reserved for Sprint 6.

## Sprint 5C Well Inspection

The map page now supports baseline well inspection:

- Well markers are clickable and keyboard-accessible.
- The right inspection panel defaults to the highest-risk well.
- Selecting a well shows pumping, screen depth, local head, local interface depth, critical pumping, risk ratio, risk level, and local hydraulic conductivity.
- Head, interface, and risk legends are visible next to the layer toggles.
- The selected well remains highlighted while head, interface, and risk layers are toggled client-side.

This is still a dependency-free SVG map over mock Stage 1 geometry. Scenario editing on the map remains out of scope until Sprint 6.

## Sprint 6A Live Map Scenarios

The primary map now runs live Stage 1 scenarios:

- Recharge multiplier, sea-level rise, and selected-well pumping controls live in the map rail.
- Scenario changes call the canonical model pipeline through `/api/map-scenario`.
- Head colors, interface overlay opacity, well risk colors, solver diagnostics, range labels, summary text, and selected-well inspection update without a page reload.
- Layer toggles remain client-side and keep working across scenario updates.
- The selected well remains highlighted after scenario changes when that well still exists.

Map scenario JSON is available as:

```text
GET  /api/map-scenario
POST /api/map-scenario
```

`POST /api/map-scenario` accepts `rechargeMultiplier`, `seaLevelRiseMeters`, and `wellPumpingCubicMetersPerDayById`.

## Sprint 6B Baseline Comparison

The primary map now supports scenario-vs-baseline comparison:

- Current/Change map modes switch between absolute model outputs and baseline-difference styling.
- Wellfield pumping controls can set pumping for all wells in a selected wellfield.
- Individual well pumping overrides wellfield pumping for that well.
- Selected-well inspection shows risk before/after, local head change, interface-depth change, `Qcrit` change, and risk-ratio change.
- The comparison summary reports worsened wells, largest head decline, and largest interface-depth decrease.

`POST /api/map-scenario` also accepts `wellfieldPumpingCubicMetersPerDayById`, `canalStageMetersById`, and the Sprint 8A `modelTuning` object.

## Sprint 6C Map Surface Upgrade

The primary map now uses MapLibre GL JS with an OpenFreeMap South Florida basemap.

- `/map` renders a real pannable basemap instead of only the local SVG grid.
- Current Stage 1 head, interface, canal, coastline, and well-risk overlays are converted to browser-side GeoJSON and drawn over the basemap.
- The original SVG model view remains as a fallback if external map assets or tiles are unavailable.
- The overlay is now the real-domain simplified Stage 1 grid, not calibrated Biscayne model data.
- Scenario sliders, Current/Change mode, layer toggles, well clicking, and inspection outputs remain connected to `/api/map-scenario`.

## Sprint 7A Real Reference Layers

The primary map now includes real geographic context for Biscayne/Miami-Dade:

- A simplified Biscayne reference domain polygon for framing the Stage 1 area.
- Selected SFWMD canal centerlines from the public canal FeatureServer.
- USGS 2018 and 2022 1,000 mg/L Biscayne saltwater-intrusion isochlor lines.
- Layer toggles and legend rows that separate reference context from modeled outputs.
- Provenance entries in `src/lib/data/biscayneReferenceLayers.ts` for source agency, source URL, access date, transformation, and Stage 1 limitations.

Source references:

- USGS 2018 data release: `https://doi.org/10.5066/P9ZIC1O4`
- USGS 2022 data release: `https://doi.org/10.5066/P13TSEEA`
- SFWMD canal service: `https://geoweb.sfwmd.gov/agsext1/rest/services/WaterManagementSystem/Canals/FeatureServer/5`

Sprint 7A did not replace the solver grid. Sprint 7B supplied the real-domain simplified grid, and Sprint 7C now rasterizes canals into fixed-head cells.

## Sprint 7B Real-Domain Model Grid

The default model dataset now uses `src/lib/data/biscayneStage1Dataset.ts` instead of the original 5 x 7 mock fixture.

- Grid cells are approximately 2 km.
- Active cells are selected from the Sprint 7A Biscayne reference domain polygon.
- Inactive cells remain in the rectangular grid for stable rendering/indexing but do not receive modeled head or interface outputs.
- Coastal fixed-head cells are selected from the easternmost active cell in each active row.
- Hydraulic conductivity is represented by provisional west/central/coastal bands.
- North Dade, Central Dade, and South Dade placeholder wellfield points snap to active cells.
- SFWMD canals are still shown as reference lines, and Sprint 7C adds separate modeled fixed-head canal cells derived from those alignments.

## Sprint 7C Canal Rasterization And Validation Context

The real-domain grid now includes modeled canal cells.

- SFWMD reference canal centerlines are projected into local model meters and rasterized onto active non-coastal 2 km cells within a 1 km corridor.
- Each modeled canal has a simplified default stage of `0.55 m`.
- Canal-stage inputs are accepted by `/api/map-scenario` through `canalStageMetersById`.
- Coastal fixed-head cells remain sea-level boundaries; canal stages do not override coastal cells.
- The map keeps SFWMD reference canal lines visually separate from modeled fixed-head canal cells.
- USGS 2018/2022 isochlor lines remain observed/reference context, not model output.

Canal stages are simplified absolute model heads for Stage 1 interaction. They are not live SFWMD stage data and are not calibrated observations.

## Sprint 8A Calibration-Lite Controls And Plausibility Warnings

The primary map now includes collapsed expert-facing model tuning controls.

- `POST /api/map-scenario` accepts `modelTuning` with initial head, regional gradient, base recharge, K scale, and default canal stage.
- The model runner applies tuning before solving: recharge defaults, K scaling, inland fixed-head support, solver initial head, and default canal stages.
- Per-canal stage overrides still take precedence over the default canal-stage tuning value.
- Diagnostics now include physical-plausibility warnings for invalid inputs, non-positive gradients, invalid K/recharge scales, missing outputs, and extreme head/interface estimates.
- The map inspection panel shows warning count and warning text without treating warnings as regulatory findings.

The tuning controls are provisional Stage 1 interaction parameters. They are not final calibration values.

## Sprint 8B Calibration-Lite Readout And Explanation Layer

The primary map now explains the tuning controls as part of the inspection surface.

- The right panel includes a Stage 1 model-assumptions section with current tuning values and plain-language explanations.
- A calibration-lite readout summarizes active head range, interface-depth range, max drawdown, highest-risk well, warning count, and current tuning values.
- The scenario response includes warning details with `info`, `caution`, and `severe` severity levels while retaining the existing warning strings for compatibility.
- A "Why This Changed" section explains the expected effect of recharge, sea level, pumping, K scale, regional gradient, base recharge, initial head, selected canal stage, and default canal-stage changes.
- The explanation copy stays explicitly non-regulatory and frames the model as a simplified Stage 1 surface, not a calibrated regulatory model.

## Sprint 9A Scenario Narrative And Before/After Cards

The primary map now opens the right panel with a stakeholder-facing scenario story.

- `POST /api/map-scenario` returns `scenarioNarrative` with a headline, concise body, dominant-change callout, risk posture, before/after cards, and a Stage 1 disclaimer.
- The narrative is derived from existing comparison summary, highest-risk well, calibration readout, warning severity, and change-explanation fields.
- Before/after cards summarize highest-risk well, worsened wells, max drawdown, largest interface decrease, and warning count.
- The browser renders the narrative from the returned response and refreshes it after each scenario run.
- The copy stays concise, non-regulatory, and focused on explaining what changed before deeper model assumptions.

## Sprint 9B Well Risk Ranking And Decision Surface

The primary map now adds a compact well-priority surface directly after the Scenario Story.

- `POST /api/map-scenario` returns `wellRiskRanking` with a default decision-priority sort, ranked rows, and server-derived sort orders.
- Each ranking row includes risk level, risk ratio, pumping, Qcrit, head change, interface change, change status, display values, and a short explanation of why the well matters in the current run.
- Default decision priority puts worsened wells first, then higher risk classes, risk ratio, drawdown magnitude, and interface decrease magnitude.
- The right panel includes a Well Priority section with stakeholder-readable rows and sort controls for decision priority, risk ratio, drawdown, interface decrease, pumping, and Qcrit.
- Ranking row selection is wired to the existing map and well dropdown selection, and the Inspection section now includes a selected-well narrative from the response model.

## Sprint 9C Selected Well Evidence And Calculation Trace

The primary map now makes selected-well priority decisions auditable without changing the print brief.

- `POST /api/map-scenario` returns `wellEvidence` with one display-ready evidence row per modeled well.
- The Inspection section includes a collapsed Evidence / Calculation Trace with pumping, Qcrit, risk ratio, risk before/current, head before/current/change, interface before/current/change, screen depth, and local K.
- Calculation notes explain risk ratio, Qcrit, and head/interface change in stakeholder-readable language.
- Provenance notes keep the trace anchored to placeholder well inputs, the simplified Stage 1 grid, and calibration-lite tuning assumptions.
- The evidence trace stays simplified, non-regulatory, and interactive-only.

## Sprint 9D Printable Scenario Brief

The primary map now includes a stakeholder-facing print brief for the current Stage 1 scenario.

- `POST /api/map-scenario` returns `scenarioBrief` with narrative, before/after cards, well priority rows, calibration-lite readout, model assumptions, change explanations, warnings, summary, and a Stage 1 disclaimer.
- The right-panel Scenario Story header includes a Print Brief button that opens the browser print dialog.
- The browser maintains a hidden `#scenario-brief-print` report from the latest scenario response and swaps it in with print-only CSS.
- The brief is intentionally browser-print/save-as-PDF only; Sprint 9D does not add JSON download, generated PDF bytes, or a 9C calculation appendix.

## Sprint 10A Scenario Presets And Reset/Compare Workflow

The primary map now includes guided presets for quick Stage 1 scenario comparison.

- `POST /api/map-scenario` returns `scenarioPresets` with baseline, dry-recharge, sea-level-rise, pumping-stress, and combined-stress options.
- The left panel includes a Scenario Presets surface above the manual Scenario controls, with active preset styling and a Baseline/Preset/Custom label.
- Presets are browser-applied from the server-provided catalog, reset from the baseline input first, and then rerun `/api/map-scenario`.
- Pumping presets target the currently selected wellfield and clear other wellfield pumping overrides.
- Presets only adjust surface controls: recharge, sea level, and selected-wellfield pumping. Canal stage and advanced tuning remain manual controls.

## Sprint 10B Scenario Snapshot Compare Tray

The primary map now supports session-only comparison against a pinned scenario snapshot.

- `POST /api/map-scenario` returns `scenarioSnapshot` with display-ready headline, posture, dominant change, highest-risk well, worsened wells, max drawdown, warning count, and Stage 1 disclaimer.
- The right panel includes a Scenario Compare tray after Scenario Story with Baseline, Current, and Pinned cards.
- Pin Current Scenario stores one browser-session snapshot with the active preset/custom label and does not change until repinned.
- Compared-to-pinned copy highlights changes in worsened wells, highest-risk well, max drawdown, warning count, and risk posture using server-provided snapshot metrics.
- Snapshot comparison remains browser-session only; it does not add saved scenarios, URL sharing, export changes, or database state.

## Sprint 10C Interface Guardrails And Hydrogeologist Regression

The Stage 1 interface post-processing now includes explicit physical guardrails.

- Biscayne Stage 1 cells include a provisional `60 m` aquifer-base depth used only as a display clamp, not as calibrated bedrock.
- Ghyben-Herzberg conversion reports whether the raw sharp-interface estimate was capped at the aquifer-base guardrail.
- Scenario diagnostics warn when active cells are capped or when freshwater head drops below sea level.
- Drought regression coverage verifies that reduced recharge lowers inland heads and makes the interface shallower.

## Sprint 10D Solver Conservation Diagnostics

The Darcy solve now reports a steady-state mass-balance audit alongside convergence.

- Diagnostics include mass-balance residual, mass-balance error percent, and `ok` / `warning` / `failure` status.
- Mass-balance warnings use `>1%` as the Stage 1 warning threshold and `>5%` as the failure threshold.
- Convergence remains the numerical iteration result; mass balance is an additional conservation audit.

The old mock dataset remains in `src/lib/data/mockDataset.ts` as a small fixture for legacy unit tests and isolated solver checks.
