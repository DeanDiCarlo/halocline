import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  runCheckpointScenario,
  type CheckpointScenarioInput,
} from "../src/lib/checkpoint/checkpointScenarioRunner.ts";
import {
  buildMapShellViewModel,
  mapPointsToSvgPoints,
} from "../src/lib/map/mapShellViewModel.ts";
import {
  buildMapScenarioViewModel,
  type MapScenarioInput,
} from "../src/lib/map/mapScenarioViewModel.ts";
import { marketingHtml } from "./marketingPage.ts";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

function readRequestBody(request: Parameters<Parameters<typeof createServer>[0]>[0]): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(
  response: Parameters<Parameters<typeof createServer>[0]>[1],
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response: Parameters<Parameters<typeof createServer>[0]>[1], html: string): void {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(html);
}

async function sendPng(
  response: Parameters<Parameters<typeof createServer>[0]>[1],
  fileUrl: URL,
): Promise<void> {
  const image = await readFile(fileUrl);
  response.writeHead(200, {
    "content-type": "image/png",
    "cache-control": "public, max-age=3600",
  });
  response.end(image);
}

const staticPngAssets = new Map<string, URL>([
  ["/assets/halocline-mark.png", new URL("./assets/halocline-mark.png", import.meta.url)],
  ["/assets/halocline-wordmark.png", new URL("./assets/halocline-wordmark.png", import.meta.url)],
  ["/assets/boundary_model.png", new URL("./assets/boundary_model.png", import.meta.url)],
  ["/assets/scenario_surface.png", new URL("./assets/scenario_surface.png", import.meta.url)],
  ["/assets/ufno_heatmap.png", new URL("./assets/ufno_heatmap.png", import.meta.url)],
]);

const checkpointHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline Stage 1 Checkpoint</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #eef2f4;
        --panel: #f8fafb;
        --panel-strong: #ffffff;
        --ink: #172127;
        --muted: #60717b;
        --line: #cbd6dc;
        --line-strong: #9fb0ba;
        --blue: #2d79a7;
        --blue-dark: #18577b;
        --amber: #b7791f;
        --red: #b03a2e;
        --green: #2f7d5c;
        --shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      button,
      input,
      select {
        font: inherit;
      }

      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 14px 18px;
        background: #fbfcfd;
        border-bottom: 1px solid var(--line);
      }

      .brand {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .brand strong {
        font-size: 15px;
        line-height: 1.2;
      }

      .brand span {
        color: var(--muted);
        font-size: 12px;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--green);
      }

      main {
        display: grid;
        grid-template-columns: minmax(260px, 320px) minmax(420px, 1fr) minmax(320px, 380px);
        gap: 12px;
        padding: 12px;
        min-height: 0;
      }

      section {
        min-width: 0;
        background: var(--panel);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
      }

      .panel-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid var(--line);
      }

      .panel-header h2 {
        margin: 0;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .panel-header span {
        color: var(--muted);
        font-size: 12px;
      }

      .controls,
      .results {
        padding: 14px;
      }

      .control {
        display: grid;
        gap: 8px;
        padding: 0 0 16px;
        margin: 0 0 16px;
        border-bottom: 1px solid var(--line);
      }

      .control:last-child {
        border-bottom: 0;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font-size: 13px;
        font-weight: 650;
      }

      label output {
        color: var(--blue-dark);
        font-weight: 700;
      }

      input[type="range"] {
        width: 100%;
        accent-color: var(--blue);
      }

      select,
      button {
        width: 100%;
        border: 1px solid var(--line-strong);
        background: var(--panel-strong);
        color: var(--ink);
        min-height: 36px;
        padding: 0 10px;
        border-radius: 6px;
      }

      button {
        cursor: pointer;
        font-weight: 700;
      }

      .hint {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .map-panel {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 0;
      }

      .grid-wrap {
        padding: 18px;
        min-height: 0;
        display: grid;
        place-items: center;
      }

      .aquifer-grid {
        display: grid;
        gap: 4px;
        width: min(100%, 820px);
      }

      .cell {
        position: relative;
        min-height: 74px;
        border: 1px solid rgba(23, 33, 39, 0.18);
        padding: 7px;
        color: #071820;
        overflow: hidden;
      }

      .cell.fixed {
        outline: 2px solid rgba(23, 33, 39, 0.28);
        outline-offset: -2px;
      }

      .cell.canal {
        box-shadow: inset 0 0 0 3px rgba(47, 125, 92, 0.25);
      }

      .cell-id,
      .cell-head,
      .cell-flags {
        position: relative;
        z-index: 1;
        display: block;
      }

      .cell-id {
        font-size: 11px;
        font-weight: 800;
      }

      .cell-head {
        margin-top: 6px;
        font-size: 13px;
        font-weight: 800;
      }

      .cell-flags {
        margin-top: 4px;
        color: rgba(7, 24, 32, 0.72);
        font-size: 11px;
        font-weight: 700;
      }

      .well-mark {
        position: absolute;
        right: 7px;
        bottom: 7px;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: #111f27;
        border: 2px solid #fff;
      }

      .legend {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 14px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }

      .scale {
        flex: 1;
        height: 10px;
        border: 1px solid var(--line-strong);
        background: linear-gradient(90deg, #e8f2f7, #84bed8, #1f6e9a);
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 14px;
      }

      .metric {
        background: var(--panel-strong);
        border: 1px solid var(--line);
        padding: 9px;
      }

      .metric span {
        display: block;
        color: var(--muted);
        font-size: 11px;
        margin-bottom: 4px;
      }

      .metric strong {
        font-size: 15px;
      }

      .summary {
        padding: 12px;
        margin-bottom: 14px;
        background: #edf5f8;
        border: 1px solid #b9d3df;
        color: #12384b;
        font-size: 13px;
        line-height: 1.45;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      th,
      td {
        padding: 8px 6px;
        text-align: left;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }

      th {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .risk {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 7px;
        border-radius: 999px;
        font-weight: 800;
        text-transform: capitalize;
      }

      .risk.low {
        background: #dcefe7;
        color: #1f6046;
      }

      .risk.moderate {
        background: #f4e9c7;
        color: #76520f;
      }

      .risk.high {
        background: #f5d5b5;
        color: #854513;
      }

      .risk.critical {
        background: #f2c7c1;
        color: #81261e;
      }

      .disclaimer {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      @media (max-width: 1080px) {
        main {
          grid-template-columns: 1fr;
        }

        .cell {
          min-height: 64px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="brand">
          <strong>Halocline Stage 1</strong>
          <span>Thin checkpoint: real-domain simplified grid, real Stage 1 math pipeline</span>
        </div>
        <div class="status">
          <span class="status-dot" aria-hidden="true"></span>
          <span id="run-status">Ready</span>
        </div>
      </header>

      <main>
        <section>
          <div class="panel-header">
            <h2>Scenario</h2>
            <span>Inputs</span>
          </div>
          <div class="controls">
            <div class="control">
              <label for="recharge">Recharge multiplier <output id="recharge-value">1.00x</output></label>
              <input id="recharge" type="range" min="0.5" max="1.8" step="0.05" value="1" />
              <div class="hint">Scales the distributed recharge source term before the Darcy solve.</div>
            </div>

            <div class="control">
              <label for="sea-level">Sea-level rise <output id="sea-level-value">0.00 m</output></label>
              <input id="sea-level" type="range" min="0" max="0.8" step="0.05" value="0" />
              <div class="hint">Moves the coastal fixed-head boundary and changes relative head.</div>
            </div>

            <div class="control">
              <label for="well-select">Pumping well</label>
              <select id="well-select"></select>
              <label for="pumping">Pumping <output id="pumping-value">0 m3/day</output></label>
              <input id="pumping" type="range" min="0" max="6500" step="100" value="0" />
              <div class="hint">Overrides pumping for the selected placeholder wellfield and reruns the head solve.</div>
            </div>

            <div class="control">
              <button id="reset" type="button">Reset baseline</button>
              <div class="hint">This checkpoint uses the Sprint 7B real-domain grid with simplified assumptions.</div>
            </div>
          </div>
        </section>

        <section class="map-panel">
          <div class="panel-header">
            <h2>Real-Domain Model Grid</h2>
            <span id="grid-range">Head range</span>
          </div>
          <div class="grid-wrap">
            <div id="aquifer-grid" class="aquifer-grid" aria-label="Real-domain model grid"></div>
          </div>
          <div class="legend">
            <span>Lower head</span>
            <div class="scale" aria-hidden="true"></div>
            <span>Higher head</span>
          </div>
        </section>

        <section>
          <div class="panel-header">
            <h2>Results</h2>
            <span>Diagnostics</span>
          </div>
          <div class="results">
            <div class="metric-grid">
              <div class="metric"><span>Converged</span><strong id="metric-converged">-</strong></div>
              <div class="metric"><span>Iterations</span><strong id="metric-iterations">-</strong></div>
              <div class="metric"><span>Run time</span><strong id="metric-runtime">-</strong></div>
            </div>
            <div id="summary" class="summary">Run a scenario to see the model response.</div>
            <table>
              <thead>
                <tr>
                  <th>Well</th>
                  <th>Head</th>
                  <th>Qcrit</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody id="well-table"></tbody>
            </table>
            <div class="disclaimer">
              Stage 1 is a simplified decision-support visualization. It is not a regulatory model,
              not a calibrated SEAWAT replacement, and not suitable for signed engineering decisions.
            </div>
          </div>
        </section>
      </main>
    </div>

    <script>
      const controls = {
        recharge: document.getElementById("recharge"),
        seaLevel: document.getElementById("sea-level"),
        wellSelect: document.getElementById("well-select"),
        pumping: document.getElementById("pumping"),
        reset: document.getElementById("reset"),
      };
      const labels = {
        recharge: document.getElementById("recharge-value"),
        seaLevel: document.getElementById("sea-level-value"),
        pumping: document.getElementById("pumping-value"),
        status: document.getElementById("run-status"),
      };

      let state = {
        rechargeMultiplier: 1,
        seaLevelRiseMeters: 0,
        wellPumpingCubicMetersPerDayById: {},
      };
      let initializedWells = false;
      let latestResult = null;
      let pendingTimer = null;

      function formatNumber(value, digits = 2) {
        if (!Number.isFinite(value)) return "-";
        return new Intl.NumberFormat("en-US", {
          maximumFractionDigits: digits,
          minimumFractionDigits: digits,
        }).format(value);
      }

      function formatInteger(value) {
        if (!Number.isFinite(value)) return "-";
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
      }

      function setStatus(text) {
        labels.status.textContent = text;
      }

      async function fetchScenario() {
        setStatus("Calculating");
        const response = await fetch("/api/scenario", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(state),
        });

        if (!response.ok) {
          setStatus("Error");
          throw new Error("Scenario request failed");
        }

        latestResult = await response.json();
        state.wellPumpingCubicMetersPerDayById = {
          ...latestResult.input.wellPumpingCubicMetersPerDayById,
          ...state.wellPumpingCubicMetersPerDayById,
        };
        render(latestResult);
        setStatus("Ready");
      }

      function scheduleRun() {
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
          fetchScenario().catch((error) => {
            document.getElementById("summary").textContent = error.message;
          });
        }, 120);
      }

      function populateWells(result) {
        if (initializedWells) return;
        controls.wellSelect.innerHTML = "";

        for (const well of result.wells) {
          const option = document.createElement("option");
          option.value = well.wellId;
          option.textContent = well.wellName;
          controls.wellSelect.append(option);
        }

        initializedWells = true;
        syncPumpingSlider();
      }

      function syncPumpingSlider() {
        const wellId = controls.wellSelect.value;
        const pumping = state.wellPumpingCubicMetersPerDayById[wellId] ?? 0;
        controls.pumping.value = String(Math.round(pumping));
        labels.pumping.textContent = formatInteger(pumping) + " m3/day";
      }

      function headColor(head, min, max) {
        if (!Number.isFinite(head)) return "#d8dee2";
        const span = Math.max(0.0001, max - min);
        const ratio = Math.max(0, Math.min(1, (head - min) / span));
        const lightness = 92 - ratio * 48;
        const saturation = 46 + ratio * 14;
        return "hsl(201 " + saturation + "% " + lightness + "%)";
      }

      function renderGrid(result) {
        const grid = document.getElementById("aquifer-grid");
        grid.style.gridTemplateColumns = "repeat(" + result.grid.colCount + ", minmax(48px, 1fr))";
        grid.innerHTML = "";

        for (const cell of result.grid.cells) {
          const element = document.createElement("div");
          element.className = [
            "cell",
            cell.isCoastalBoundary ? "fixed coastal" : "",
            cell.isCanalBoundary ? "fixed canal" : "",
          ].join(" ");
          element.style.background = headColor(
            cell.headMeters,
            result.grid.minHeadMeters,
            result.grid.maxHeadMeters,
          );
          element.title = cell.id + ": head " + formatNumber(cell.headMeters) + " m";
          element.innerHTML =
            '<span class="cell-id">' + cell.id + '</span>' +
            '<span class="cell-head">' + formatNumber(cell.headMeters) + ' m</span>' +
            '<span class="cell-flags">' +
            (cell.isCoastalBoundary ? "Coast" : "") +
            (cell.isCanalBoundary ? "Canal" : "") +
            '</span>' +
            (cell.wellIds.length > 0 ? '<span class="well-mark" aria-hidden="true"></span>' : "");
          grid.append(element);
        }

        document.getElementById("grid-range").textContent =
          formatNumber(result.grid.minHeadMeters) + " to " + formatNumber(result.grid.maxHeadMeters) + " m";
      }

      function renderWells(result) {
        const body = document.getElementById("well-table");
        body.innerHTML = "";

        for (const well of result.wells) {
          const row = document.createElement("tr");
          row.innerHTML =
            "<td><strong>" +
            well.wellName +
            '</strong><br><span class="hint">' +
            formatInteger(well.pumpingCubicMetersPerDay) +
            " m3/day</span></td>" +
            "<td>" +
            formatNumber(well.localHeadMeters) +
            ' m<br><span class="hint">Interface ' +
            formatNumber(well.interfaceDepthMeters) +
            " m</span></td>" +
            "<td>" +
            formatInteger(well.qCritCubicMetersPerDay) +
            '<br><span class="hint">ratio ' +
            formatNumber(well.riskRatio) +
            '</span></td><td><span class="risk ' +
            well.riskLevel +
            '">' +
            well.riskLevel +
            "</span></td>";
          body.append(row);
        }
      }

      function render(result) {
        populateWells(result);
        labels.recharge.textContent = Number(controls.recharge.value).toFixed(2) + "x";
        labels.seaLevel.textContent = Number(controls.seaLevel.value).toFixed(2) + " m";
        syncPumpingSlider();

        document.getElementById("metric-converged").textContent = result.diagnostics.converged ? "Yes" : "No";
        document.getElementById("metric-iterations").textContent = formatInteger(result.diagnostics.iterationCount);
        document.getElementById("metric-runtime").textContent =
          formatNumber(result.diagnostics.runTimeMilliseconds, 1) + " ms";
        document.getElementById("summary").textContent = result.summary;

        renderGrid(result);
        renderWells(result);
      }

      controls.recharge.addEventListener("input", () => {
        state.rechargeMultiplier = Number(controls.recharge.value);
        labels.recharge.textContent = state.rechargeMultiplier.toFixed(2) + "x";
        scheduleRun();
      });

      controls.seaLevel.addEventListener("input", () => {
        state.seaLevelRiseMeters = Number(controls.seaLevel.value);
        labels.seaLevel.textContent = state.seaLevelRiseMeters.toFixed(2) + " m";
        scheduleRun();
      });

      controls.wellSelect.addEventListener("change", () => {
        syncPumpingSlider();
      });

      controls.pumping.addEventListener("input", () => {
        const wellId = controls.wellSelect.value;
        const pumping = Number(controls.pumping.value);
        state.wellPumpingCubicMetersPerDayById[wellId] = pumping;
        labels.pumping.textContent = formatInteger(pumping) + " m3/day";
        scheduleRun();
      });

      controls.reset.addEventListener("click", () => {
        state = {
          rechargeMultiplier: 1,
          seaLevelRiseMeters: 0,
          wellPumpingCubicMetersPerDayById: {},
        };
        controls.recharge.value = "1";
        controls.seaLevel.value = "0";
        scheduleRun();
      });

      fetchScenario().catch((error) => {
        document.getElementById("summary").textContent = error.message;
      });
    </script>
  </body>
</html>`;

const mapShellViewModel = buildMapShellViewModel();
const mapScenarioViewModel = buildMapScenarioViewModel();
const serializedMapScenarioViewModel = JSON.stringify(mapScenarioViewModel);

function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderModelAssumptions(viewModel = mapScenarioViewModel): string {
  return viewModel.modelAssumptions
    .map(
      (assumption) => `<div class="assumption-row" data-assumption-id="${escapeHtml(assumption.id)}">
        <div>
          <strong>${escapeHtml(assumption.label)}</strong>
          <span>${escapeHtml(assumption.explanation)}</span>
        </div>
        <b>${escapeHtml(assumption.displayValue)}</b>
      </div>`,
    )
    .join("");
}

function renderTuningValues(viewModel = mapScenarioViewModel): string {
  return viewModel.calibrationReadout.tuningValues
    .map(
      (assumption) => `<div class="detail-item compact" data-tuning-value-id="${escapeHtml(assumption.id)}">
        <span>${escapeHtml(assumption.label)}</span>
        <strong>${escapeHtml(assumption.displayValue)}</strong>
      </div>`,
    )
    .join("");
}

function renderChangeExplanations(viewModel = mapScenarioViewModel): string {
  return viewModel.changeExplanations
    .map((explanation) => `<li>${escapeHtml(explanation)}</li>`)
    .join("");
}

function renderWarningDetails(viewModel = mapScenarioViewModel): string {
  const warnings = viewModel.diagnostics.warningDetails;
  if (warnings.length === 0) return "No warnings.";

  return warnings
    .map(
      (warning) => `<div class="warning-item ${escapeHtml(warning.severity)}">
        <span>${escapeHtml(warning.severity)}</span>
        <strong>${escapeHtml(warning.message)}</strong>
      </div>`,
    )
    .join("");
}

function renderScenarioNarrative(viewModel = mapScenarioViewModel): string {
  const narrative = viewModel.scenarioNarrative;

  return `<div class="story-block ${escapeHtml(narrative.riskPosture)}" id="scenario-story-block">
    <div class="story-kicker">
      <span>Scenario posture</span>
      <strong id="story-posture">${escapeHtml(narrative.riskPosture)}</strong>
    </div>
    <h3 id="story-headline">${escapeHtml(narrative.headline)}</h3>
    <p id="story-body">${escapeHtml(narrative.body)}</p>
    <div class="dominant-change" id="story-dominant-change">${escapeHtml(narrative.dominantChange)}</div>
  </div>
  <div class="before-after-grid" id="before-after-grid">
    ${narrative.beforeAfterCards
      .map(
        (card) => `<div class="story-card ${escapeHtml(card.posture)}" data-story-card-id="${escapeHtml(card.id)}">
          <span>${escapeHtml(card.label)}</span>
          <div class="story-card-values">
            <b>${escapeHtml(card.baselineValue)}</b>
            <strong>${escapeHtml(card.currentValue)}</strong>
          </div>
          <small>${escapeHtml(card.helperText)}</small>
        </div>`,
      )
      .join("")}
  </div>
  <p class="regulatory-note" id="story-disclaimer">${escapeHtml(narrative.stage1Disclaimer)}</p>`;
}

function renderScenarioPresets(viewModel = mapScenarioViewModel): string {
  return viewModel.scenarioPresets
    .map(
      (preset) => `<button class="preset-button" type="button" data-scenario-preset-id="${escapeHtml(
        preset.id,
      )}" aria-pressed="${preset.id === "baseline" ? "true" : "false"}">
        <strong>${escapeHtml(preset.label)}</strong>
        <span>${escapeHtml(preset.description)}</span>
      </button>`,
    )
    .join("");
}

function renderSnapshotMetric(id: string, label: string, value: string): string {
  return `<span><b>${escapeHtml(label)}</b><em id="${escapeHtml(id)}">${escapeHtml(value)}</em></span>`;
}

function renderScenarioSnapshotCard(
  id: string,
  title: string,
  snapshot = mapScenarioViewModel.scenarioSnapshot,
  label = snapshot.scenarioStatusLabel,
): string {
  return `<div class="snapshot-card ${escapeHtml(snapshot.riskPosture)}" id="snapshot-${escapeHtml(id)}-card">
    <div class="snapshot-card-header">
      <span id="snapshot-${escapeHtml(id)}-title">${escapeHtml(title)}</span>
      <b id="snapshot-${escapeHtml(id)}-label">${escapeHtml(label)}</b>
    </div>
    <strong id="snapshot-${escapeHtml(id)}-headline">${escapeHtml(snapshot.headline)}</strong>
    <small id="snapshot-${escapeHtml(id)}-posture">${escapeHtml(snapshot.riskPosture)}</small>
    <div class="snapshot-metrics">
      ${renderSnapshotMetric(`snapshot-${id}-wells`, "Wells", snapshot.displayValues.worsenedWells)}
      ${renderSnapshotMetric(`snapshot-${id}-highest`, "Highest", snapshot.displayValues.highestRiskWell)}
      ${renderSnapshotMetric(`snapshot-${id}-drawdown`, "Drawdown", snapshot.displayValues.maxDrawdown)}
      ${renderSnapshotMetric(`snapshot-${id}-warnings`, "Warnings", snapshot.displayValues.warnings)}
    </div>
  </div>`;
}

function renderEmptyPinnedSnapshotCard(): string {
  return `<div class="snapshot-card empty" id="snapshot-pinned-card">
    <div class="snapshot-card-header">
      <span id="snapshot-pinned-title">Pinned</span>
      <b id="snapshot-pinned-label">No scenario pinned</b>
    </div>
    <strong id="snapshot-pinned-headline">Pin the current scenario to compare it against later runs.</strong>
    <small id="snapshot-pinned-posture">Session only</small>
    <div class="snapshot-metrics">
      ${renderSnapshotMetric("snapshot-pinned-wells", "Wells", "-")}
      ${renderSnapshotMetric("snapshot-pinned-highest", "Highest", "-")}
      ${renderSnapshotMetric("snapshot-pinned-drawdown", "Drawdown", "-")}
      ${renderSnapshotMetric("snapshot-pinned-warnings", "Warnings", "-")}
    </div>
  </div>`;
}

function renderScenarioCompare(viewModel = mapScenarioViewModel): string {
  return `<div class="snapshot-tray" id="scenario-compare-tray">
    ${renderScenarioSnapshotCard("baseline", "Baseline", viewModel.scenarioSnapshot, "Baseline")}
    ${renderScenarioSnapshotCard("current", "Current", viewModel.scenarioSnapshot, "Baseline")}
    ${renderEmptyPinnedSnapshotCard()}
  </div>
  <div class="compare-callout empty" id="compare-to-pinned">Pin current scenario to compare later runs against it.</div>
  <p class="regulatory-note" id="compare-disclaimer">${escapeHtml(viewModel.scenarioSnapshot.stage1Disclaimer)}</p>`;
}

function renderWellPriorityRows(viewModel = mapScenarioViewModel): string {
  const selectedWellId = viewModel.highestRiskWell?.id ?? viewModel.wells[0]?.id;

  return viewModel.wellRiskRanking.rows
    .map(
      (row, index) => `<button class="priority-row ${escapeHtml(row.changeStatus)}" type="button" data-priority-well-id="${escapeHtml(
        row.wellId,
      )}" data-selected="${row.wellId === selectedWellId ? "true" : "false"}">
        <span class="priority-rank">${index + 1}</span>
        <span class="priority-name">${escapeHtml(row.wellName)}</span>
        <span class="priority-risk">${escapeHtml(row.displayValues.riskLevel)}</span>
        <span class="priority-status">${escapeHtml(row.changeStatus)}</span>
        <span class="priority-metric"><b>Ratio</b>${escapeHtml(row.displayValues.riskRatio)}</span>
        <span class="priority-metric"><b>Head</b>${escapeHtml(row.displayValues.headChange)}</span>
        <span class="priority-metric"><b>Interface</b>${escapeHtml(row.displayValues.interfaceChange)}</span>
      </button>`,
    )
    .join("");
}

function renderWellPriority(viewModel = mapScenarioViewModel): string {
  return `<div class="priority-toolbar">
    <label for="well-ranking-sort">Sort</label>
    <select id="well-ranking-sort">
      ${viewModel.wellRiskRanking.sortOptions
        .map(
          (option) =>
            `<option value="${escapeHtml(option.id)}" ${
              option.id === viewModel.wellRiskRanking.defaultSort ? "selected" : ""
            }>${escapeHtml(option.label)}</option>`,
        )
        .join("")}
    </select>
  </div>
  <div class="priority-list" id="well-priority-list">
    ${renderWellPriorityRows(viewModel)}
  </div>`;
}

function selectedWellNarrative(viewModel = mapScenarioViewModel): string {
  const selectedWellId = viewModel.highestRiskWell?.id ?? viewModel.wells[0]?.id;
  return (
    viewModel.wellRiskRanking.rows.find((row) => row.wellId === selectedWellId)
      ?.whyThisWellMatters ?? "Select a well to see why it matters in this run."
  );
}

function selectedWellEvidenceRow(viewModel = mapScenarioViewModel) {
  const selectedWellId = viewModel.highestRiskWell?.id ?? viewModel.wells[0]?.id;
  return viewModel.wellEvidence.rows.find((row) => row.wellId === selectedWellId);
}

function renderWellEvidenceItems(viewModel = mapScenarioViewModel): string {
  const row = selectedWellEvidenceRow(viewModel);
  if (!row) return "";

  return row.items
    .map(
      (item) => `<div class="evidence-item" data-evidence-item-id="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.label)}</strong>
        <span><b>Before</b>${escapeHtml(item.baselineValue)}</span>
        <span><b>Current</b>${escapeHtml(item.currentValue)}</span>
        <span><b>Change</b>${escapeHtml(item.changeValue)}</span>
        <p>${escapeHtml(item.helperText)}</p>
      </div>`,
    )
    .join("");
}

function renderEvidenceNotes(notes: Array<{ id: string; title: string; body: string }>, type: string): string {
  return notes
    .map(
      (note) => `<div class="evidence-note" data-evidence-${escapeHtml(type)}-id="${escapeHtml(note.id)}">
        <strong>${escapeHtml(note.title)}</strong>
        <p>${escapeHtml(note.body)}</p>
      </div>`,
    )
    .join("");
}

function renderWellEvidence(viewModel = mapScenarioViewModel): string {
  const row = selectedWellEvidenceRow(viewModel);

  return `<details class="evidence-trace" id="well-evidence-trace">
    <summary>
      <span>Evidence / Calculation Trace</span>
      <small id="well-evidence-status">${row ? escapeHtml(row.changeStatus) : "No selected well"}</small>
    </summary>
    <div class="evidence-body">
      <p class="evidence-why" id="well-evidence-why">${row ? escapeHtml(row.whyThisWellMatters) : "Select a well to inspect its evidence trace."}</p>
      <div class="evidence-item-grid" id="well-evidence-items">
        ${renderWellEvidenceItems(viewModel)}
      </div>
      <div class="evidence-note-group">
        <h3>Calculation Notes</h3>
        <div id="well-evidence-calculation-notes">
          ${renderEvidenceNotes(viewModel.wellEvidence.calculationNotes, "calculation")}
        </div>
      </div>
      <div class="evidence-note-group">
        <h3>Provenance Notes</h3>
        <div id="well-evidence-provenance-notes">
          ${renderEvidenceNotes(viewModel.wellEvidence.provenanceNotes, "provenance")}
        </div>
      </div>
      <p class="regulatory-note" id="well-evidence-disclaimer">${escapeHtml(viewModel.wellEvidence.stage1Disclaimer)}</p>
    </div>
  </details>`;
}

function renderScenarioBriefPrint(viewModel = mapScenarioViewModel): string {
  const brief = viewModel.scenarioBrief;
  const warnings =
    brief.warnings.length === 0
      ? `<p class="brief-muted">No warnings.</p>`
      : brief.warnings
          .map(
            (warning) => `<div class="brief-warning ${escapeHtml(warning.severity)}">
              <span>${escapeHtml(warning.severity)}</span>
              <p>${escapeHtml(warning.message)}</p>
            </div>`,
          )
          .join("");

  return `<article class="brief-page">
    <header class="brief-header">
      <div>
        <p>Stage 1 scenario brief</p>
        <h1>${escapeHtml(brief.title)}</h1>
      </div>
      <strong>${escapeHtml(brief.scenarioStatusLabel)}</strong>
    </header>

    <section class="brief-section">
      <h2>${escapeHtml(brief.headline)}</h2>
      <p>${escapeHtml(brief.body)}</p>
      <p class="brief-callout">${escapeHtml(brief.dominantChange)}</p>
    </section>

    <section class="brief-section">
      <h2>Before / After</h2>
      <div class="brief-card-grid">
        ${brief.beforeAfterCards
          .map(
            (card) => `<div class="brief-card">
              <span>${escapeHtml(card.label)}</span>
              <b>${escapeHtml(card.baselineValue)} -> ${escapeHtml(card.currentValue)}</b>
              <p>${escapeHtml(card.helperText)}</p>
            </div>`,
          )
          .join("")}
      </div>
    </section>

    <section class="brief-section">
      <h2>Well Priority</h2>
      <div class="brief-priority-list">
        ${brief.wellPriorityRows
          .map(
            (row) => `<div class="brief-priority-row">
              <b>${row.rank}. ${escapeHtml(row.wellName)}</b>
              <span>${escapeHtml(row.displayValues.riskLevel)} · ${escapeHtml(row.changeStatus)}</span>
              <span>Ratio ${escapeHtml(row.displayValues.riskRatio)} · Head ${escapeHtml(
                row.displayValues.headChange,
              )} · Interface ${escapeHtml(row.displayValues.interfaceChange)}</span>
              <p>${escapeHtml(row.whyThisWellMatters)}</p>
            </div>`,
          )
          .join("")}
      </div>
    </section>

    <section class="brief-section">
      <h2>Calibration-Lite Readout</h2>
      <div class="brief-key-grid">
        ${brief.calibrationItems
          .map(
            (item) => `<div class="brief-key-value">
              <span>${escapeHtml(item.label)}</span>
              <b>${escapeHtml(item.value)}</b>
            </div>`,
          )
          .join("")}
      </div>
    </section>

    <section class="brief-section">
      <h2>Model Assumptions</h2>
      <div class="brief-assumption-list">
        ${brief.modelAssumptions
          .map(
            (assumption) => `<div>
              <b>${escapeHtml(assumption.label)}: ${escapeHtml(assumption.displayValue)}</b>
              <p>${escapeHtml(assumption.explanation)}</p>
            </div>`,
          )
          .join("")}
      </div>
    </section>

    <section class="brief-section">
      <h2>Why This Changed</h2>
      <ul>
        ${brief.changeExplanations.map((explanation) => `<li>${escapeHtml(explanation)}</li>`).join("")}
      </ul>
    </section>

    <section class="brief-section">
      <h2>Warnings</h2>
      ${warnings}
    </section>

    <section class="brief-section">
      <h2>Scenario Summary</h2>
      <p>${escapeHtml(brief.summary)}</p>
      <p class="brief-disclaimer">${escapeHtml(brief.stage1Disclaimer)}</p>
    </section>
  </article>`;
}

const mapShellHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline Coastal Scenario Map</title>
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.22.0/dist/maplibre-gl.css" />
    <style>
      :root {
        color-scheme: light;
        --bg: #e9eef1;
        --panel: #f7f9fa;
        --panel-strong: #ffffff;
        --ink: #101c22;
        --muted: #5c6e77;
        --line: #c2ced5;
        --line-strong: #90a2ad;
        --water: #b9dbe8;
        --water-deep: #4f9ab8;
        --land: #dde7e2;
        --domain: #d8e7df;
        --canal: #2d7b5f;
        --well: #172127;
        --disabled: #9ba8ae;
        --accent: #246e9a;
        --accent-dark: #174b68;
        --shadow: 0 12px 36px rgba(19, 35, 45, 0.12);
        --soft-shadow: 0 1px 2px rgba(19, 35, 45, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        height: 100vh;
        overflow: hidden;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0)),
          var(--bg);
        color: var(--ink);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      .shell {
        height: 100vh;
        min-height: 0;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.92);
        border-bottom: 1px solid var(--line);
        box-shadow: var(--soft-shadow);
      }

      .brand {
        display: grid;
        gap: 2px;
      }

      .brand strong {
        font-size: 16px;
        line-height: 1.2;
      }

      .brand span,
      .status,
      .meta,
      .hint {
        color: var(--muted);
        font-size: 12px;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #2f7d5c;
      }

      main {
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-columns: minmax(238px, 275px) minmax(420px, 1fr) minmax(286px, 330px);
        gap: 12px;
        padding: 12px;
        overflow: hidden;
      }

      aside,
      section {
        min-width: 0;
        min-height: 0;
        background: rgba(247, 249, 250, 0.96);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
        border-radius: 8px;
      }

      main > aside {
        overflow: auto;
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 8px;
      }

      .panel-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.62);
      }

      .panel-header h2 {
        margin: 0;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .panel-header-actions {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        min-width: 0;
      }

      .accordion-section {
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.56);
        box-shadow: var(--soft-shadow);
      }

      .accordion-section[data-open="true"] {
        display: grid;
        grid-template-rows: auto minmax(0, auto);
      }

      .accordion-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        background: rgba(255, 255, 255, 0.7);
      }

      .accordion-toggle {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 9px;
        width: 100%;
        min-height: 40px;
        padding: 0 10px 0 12px;
        border: 0;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        text-align: left;
      }

      .accordion-toggle:hover,
      .accordion-toggle:focus-visible {
        background: #eef8fb;
        outline: none;
      }

      .accordion-label {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .accordion-title {
        overflow: hidden;
        color: var(--ink);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.08em;
        line-height: 1.15;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .accordion-icon {
        color: var(--muted);
        font-size: 18px;
        font-weight: 850;
        line-height: 1;
        transform: rotate(0deg);
        transition: transform 120ms ease;
      }

      .accordion-section[data-open="true"] .accordion-icon {
        transform: rotate(90deg);
      }

      .accordion-header .panel-header-actions {
        padding-right: 8px;
      }

      .accordion-body {
        border-top: 1px solid var(--line);
        max-height: min(48vh, 430px);
        overflow: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }

      .accordion-body[hidden] {
        display: none !important;
      }

      [data-accordion-section="scenario"] .accordion-body {
        max-height: min(62vh, 560px);
      }

      [data-accordion-section="scenario-story"] .accordion-body {
        max-height: min(34vh, 300px);
      }

      [data-accordion-section="well-priority"] .accordion-body,
      [data-accordion-section="inspection"] .accordion-body {
        max-height: min(42vh, 380px);
      }

      .print-button {
        min-height: 28px;
        padding: 0 10px;
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: var(--panel-strong);
        color: var(--ink);
        font: inherit;
        font-size: 12px;
        font-weight: 850;
        cursor: pointer;
        white-space: nowrap;
      }

      .print-button:hover,
      .print-button:focus-visible {
        border-color: #7fb5ca;
        background: #eef8fb;
        outline: none;
      }

      .panel-body {
        padding: 12px;
      }

      .nav-stack {
        display: grid;
        gap: 10px;
      }

      .nav-link,
      .layer-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 34px;
        padding: 0 10px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.78);
        color: var(--ink);
        text-decoration: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
      }

      .nav-link[aria-current="page"] {
        border-color: #7fb5ca;
        background: #e7f4f8;
      }

      .layer-row {
        margin-bottom: 8px;
        font-weight: 650;
      }

      .layer-row label {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .layer-row input {
        accent-color: #2d79a7;
      }

      .layer-row.disabled {
        color: var(--disabled);
        background: #f1f4f5;
      }

      .control-stack {
        display: grid;
        gap: 11px;
      }

      .control {
        display: grid;
        gap: 7px;
      }

      .control label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        color: var(--ink);
        font-size: 12px;
        font-weight: 800;
      }

      .control output {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }

      .control input[type="range"] {
        width: 100%;
        accent-color: var(--accent);
      }

      .control select {
        width: 100%;
        min-height: 32px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--panel-strong);
        color: var(--ink);
        font: inherit;
        font-size: 13px;
      }

      .control button {
        min-height: 34px;
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: var(--panel-strong);
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .advanced-tuning {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #f2f6f7;
      }

      .advanced-tuning summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 36px;
        padding: 0 10px;
        color: var(--ink);
        font-size: 12px;
        font-weight: 850;
        cursor: pointer;
      }

      .advanced-tuning .control-stack {
        padding: 10px;
        border-top: 1px solid var(--line);
      }

      .mode-toggle {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #edf2f4;
      }

      .mode-button {
        min-height: 28px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .mode-button[aria-pressed="true"] {
        background: var(--panel-strong);
        color: var(--ink);
        border: 1px solid var(--line);
        box-shadow: var(--soft-shadow);
      }

      .preset-list {
        display: grid;
        gap: 7px;
      }

      .preset-button {
        display: grid;
        gap: 3px;
        width: 100%;
        min-height: 44px;
        padding: 8px 10px;
        border: 1px solid var(--line);
        border-left-width: 3px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
        color: var(--ink);
        cursor: pointer;
        text-align: left;
      }

      .preset-button strong {
        font-size: 12px;
        line-height: 1.25;
      }

      .preset-button span {
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }

      .preset-button:hover,
      .preset-button:focus-visible,
      .preset-button[aria-pressed="true"] {
        border-color: #7fb5ca;
        border-left-color: var(--accent);
        background: #eef8fb;
        outline: none;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        background: #e5edf0;
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
      }

      .map-panel {
        min-height: 0;
        overflow: hidden;
        display: grid;
        grid-template-rows: auto 1fr auto;
        background: #eef4f5;
      }

      .map-canvas {
        position: relative;
        min-height: 0;
        overflow: hidden;
        background: #d9e7e9;
      }

      .map-canvas::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(13,42,55,0.06));
        pointer-events: none;
        z-index: 4;
      }

      .actual-map,
      .map-fallback,
      .model-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .actual-map {
        z-index: 1;
      }

      .map-fallback {
        z-index: 2;
        background:
          linear-gradient(90deg, var(--land) 0 78%, var(--water) 78% 100%);
      }

      .map-canvas.maplibre-ready .map-fallback {
        display: none;
      }

      .basemap-note {
        position: absolute;
        z-index: 5;
        left: 12px;
        bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: min(520px, calc(100% - 24px));
        padding: 8px 10px;
        border: 1px solid rgba(112, 133, 143, 0.45);
        border-radius: 6px;
        background: rgba(250, 252, 252, 0.9);
        color: #27414d;
        font-size: 12px;
        line-height: 1.35;
        box-shadow: var(--soft-shadow);
      }

      .maplibregl-ctrl-top-right {
        top: 10px;
        right: 10px;
      }

      .maplibregl-ctrl-group {
        border: 1px solid rgba(112, 133, 143, 0.55);
        box-shadow: var(--soft-shadow);
      }

      .maplibregl-ctrl-attrib {
        font-size: 10px;
      }

      .domain {
        fill: rgba(217, 229, 225, 0.82);
        stroke: #607a72;
        stroke-width: 0.45;
      }

      .grid-cell {
        fill: rgba(255, 255, 255, 0.12);
        stroke: rgba(65, 82, 90, 0.22);
        stroke-width: 0.12;
      }

      .head-cell {
        stroke: rgba(22, 39, 47, 0.22);
        stroke-width: 0.12;
      }

      .interface-cell {
        fill: #1f6e9a;
        stroke: transparent;
      }

      .coastline {
        stroke: var(--water-deep);
        stroke-width: 1.3;
      }

      .canal {
        fill: none;
        stroke: #355f47;
        stroke-linecap: round;
        stroke-width: 1.35;
      }

      .well {
        fill: var(--well);
        stroke: #ffffff;
        stroke-width: 0.7;
      }

      .risk-well {
        stroke: #ffffff;
        stroke-width: 0.8;
      }

      .well-target {
        cursor: pointer;
        outline: none;
      }

      .well-target:focus-visible .well-selection-ring {
        display: block;
        stroke: #0f5c82;
      }

      .well-selection-ring {
        display: none;
        fill: none;
        stroke: #102733;
        stroke-width: 0.9;
      }

      .well-target[data-selected="true"] .well-selection-ring {
        display: block;
      }

      .well-label {
        fill: #172127;
        font-size: 2.4px;
        font-weight: 800;
        pointer-events: none;
      }

      .map-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px;
        border-top: 1px solid var(--line);
      }

      .detail-list {
        display: grid;
        gap: 12px;
      }

      .detail-item {
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
      }

      .detail-item:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .detail-item span {
        display: block;
        color: var(--muted);
        font-size: 11px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .detail-item strong {
        font-size: 14px;
      }

      .detail-item strong.risk-value {
        text-transform: capitalize;
      }

      .comparison-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .comparison-grid .detail-item {
        min-width: 0;
      }

      .story-panel {
        display: grid;
        gap: 10px;
      }

      .story-block {
        display: grid;
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--line);
        border-left-width: 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.78);
      }

      .story-block.neutral {
        border-left-color: #6c7a82;
      }

      .story-block.watch {
        border-left-color: #5d8795;
      }

      .story-block.elevated {
        border-left-color: #b7791f;
      }

      .story-block.severe {
        border-left-color: #b03a2e;
      }

      .story-kicker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .story-kicker strong {
        color: var(--ink);
      }

      .story-block h3 {
        margin: 0;
        font-size: 16px;
        line-height: 1.2;
      }

      .story-block p {
        margin: 0;
        color: #304c57;
        font-size: 12px;
        line-height: 1.45;
      }

      .dominant-change {
        padding: 8px 10px;
        border: 1px solid #b9d3df;
        border-radius: 6px;
        background: #edf5f8;
        color: #173947;
        font-size: 12px;
        line-height: 1.4;
      }

      .before-after-grid {
        display: grid;
        gap: 8px;
      }

      .story-card {
        display: grid;
        gap: 7px;
        padding: 10px;
        border: 1px solid var(--line);
        border-top-width: 3px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
      }

      .story-card.neutral {
        border-top-color: #9aa7ad;
      }

      .story-card.watch {
        border-top-color: #5d8795;
      }

      .story-card.elevated {
        border-top-color: #b7791f;
      }

      .story-card.severe {
        border-top-color: #b03a2e;
      }

      .story-card span,
      .story-card small {
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }

      .story-card span {
        font-weight: 850;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .story-card-values {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 8px;
        align-items: start;
      }

      .story-card-values b,
      .story-card-values strong {
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 12px;
        line-height: 1.35;
      }

      .story-card-values b {
        color: var(--muted);
        font-weight: 750;
      }

      .story-card-values strong {
        color: var(--ink);
      }

      .snapshot-tray {
        display: grid;
        gap: 8px;
      }

      .snapshot-card {
        display: grid;
        gap: 7px;
        padding: 10px;
        border: 1px solid var(--line);
        border-left-width: 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
      }

      .snapshot-card.neutral {
        border-left-color: #6c7a82;
      }

      .snapshot-card.watch {
        border-left-color: #5d8795;
      }

      .snapshot-card.elevated {
        border-left-color: #b7791f;
      }

      .snapshot-card.severe {
        border-left-color: #b03a2e;
      }

      .snapshot-card.empty {
        border-left-color: #9aa7ad;
        background: #f2f6f7;
      }

      .snapshot-card-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
      }

      .snapshot-card-header span,
      .snapshot-card small,
      .snapshot-metrics b {
        color: var(--muted);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .snapshot-card-header b {
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--ink);
        font-size: 11px;
      }

      .snapshot-card > strong {
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 13px;
        line-height: 1.25;
      }

      .snapshot-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
      }

      .snapshot-metrics span {
        display: grid;
        gap: 2px;
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 11px;
        line-height: 1.3;
      }

      .snapshot-metrics em {
        font-style: normal;
      }

      .compare-callout {
        padding: 8px 10px;
        border: 1px solid #b9d3df;
        border-left: 3px solid #5d8795;
        border-radius: 6px;
        background: #edf5f8;
        color: #173947;
        font-size: 12px;
        line-height: 1.4;
      }

      .compare-callout.empty {
        border-color: var(--line);
        border-left-color: #9aa7ad;
        background: #f2f6f7;
        color: var(--muted);
      }

      .priority-toolbar {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 8px;
      }

      .priority-toolbar label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 850;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .priority-toolbar select {
        width: 100%;
        min-height: 32px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--panel-strong);
        color: var(--ink);
        font: inherit;
        font-size: 12px;
        font-weight: 750;
      }

      .priority-list {
        display: grid;
        gap: 7px;
      }

      .priority-row {
        display: grid;
        grid-template-columns: 22px minmax(92px, 1.1fr) minmax(58px, 0.7fr) minmax(66px, 0.8fr);
        gap: 7px;
        align-items: center;
        width: 100%;
        padding: 9px;
        border: 1px solid var(--line);
        border-left-width: 3px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
        color: var(--ink);
        cursor: pointer;
        text-align: left;
      }

      .priority-row:hover,
      .priority-row:focus-visible,
      .priority-row[data-selected="true"] {
        border-color: #7fb5ca;
        background: #eef8fb;
        outline: none;
      }

      .priority-row.worsened {
        border-left-color: #b7791f;
      }

      .priority-row.improved {
        border-left-color: #2f7d5c;
      }

      .priority-row.unchanged {
        border-left-color: #9aa7ad;
      }

      .priority-rank {
        color: var(--muted);
        font-size: 11px;
        font-weight: 850;
      }

      .priority-name,
      .priority-risk,
      .priority-status {
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 12px;
        font-weight: 850;
        line-height: 1.25;
      }

      .priority-status {
        color: var(--muted);
        text-transform: capitalize;
      }

      .priority-metric {
        display: grid;
        gap: 2px;
        min-width: 0;
        color: var(--ink);
        font-size: 11px;
        line-height: 1.2;
      }

      .priority-metric b {
        color: var(--muted);
        font-size: 9px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .selected-well-narrative {
        margin: 0;
      }

      .evidence-trace {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #f2f6f7;
      }

      .evidence-trace summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 36px;
        padding: 0 10px;
        color: var(--ink);
        cursor: pointer;
        font-size: 12px;
        font-weight: 850;
      }

      .evidence-trace summary small {
        color: var(--muted);
        font-size: 11px;
        font-weight: 850;
        text-transform: capitalize;
      }

      .evidence-body {
        display: grid;
        gap: 10px;
        padding: 10px;
        border-top: 1px solid var(--line);
      }

      .evidence-why {
        margin: 0;
        color: var(--ink);
        font-size: 12px;
        line-height: 1.45;
      }

      .evidence-item-grid {
        display: grid;
        gap: 7px;
      }

      .evidence-item {
        display: grid;
        grid-template-columns: minmax(76px, 0.85fr) repeat(3, minmax(46px, 1fr));
        gap: 6px;
        align-items: start;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
      }

      .evidence-item strong,
      .evidence-item span,
      .evidence-item p {
        min-width: 0;
        overflow-wrap: anywhere;
        line-height: 1.3;
      }

      .evidence-item strong {
        font-size: 12px;
      }

      .evidence-item span {
        display: grid;
        gap: 2px;
        font-size: 11px;
      }

      .evidence-item span b {
        color: var(--muted);
        font-size: 9px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .evidence-item p {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--muted);
        font-size: 11px;
      }

      .evidence-note-group {
        display: grid;
        gap: 6px;
      }

      .evidence-note-group h3 {
        margin: 0;
        color: var(--muted);
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .evidence-note-group > div {
        display: grid;
        gap: 6px;
      }

      .evidence-note {
        display: grid;
        gap: 3px;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.64);
      }

      .evidence-note strong {
        font-size: 12px;
      }

      .evidence-note p {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.4;
      }

      @media (max-width: 1260px) {
        .priority-row {
          grid-template-columns: 22px minmax(0, 1fr) minmax(64px, auto);
        }

        .priority-status,
        .priority-metric {
          grid-column: 2 / -1;
        }

        .evidence-item {
          grid-template-columns: minmax(0, 1fr) minmax(58px, 0.8fr);
        }

        .evidence-item span,
        .evidence-item p {
          grid-column: 1 / -1;
        }
      }

      .readout-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .detail-item.compact {
        padding: 9px 10px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
      }

      .detail-item.compact span {
        margin-bottom: 5px;
      }

      .assumption-list,
      .why-list {
        display: grid;
        gap: 8px;
      }

      .assumption-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }

      .assumption-row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .assumption-row strong {
        display: block;
        margin-bottom: 3px;
        font-size: 13px;
      }

      .assumption-row span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }

      .assumption-row b {
        white-space: nowrap;
        color: var(--ink);
        font-size: 12px;
      }

      .why-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .why-list li {
        padding: 8px 10px;
        border-left: 3px solid #5d8795;
        background: #edf5f8;
        color: #173947;
        font-size: 12px;
        line-height: 1.4;
      }

      .legend {
        display: grid;
        gap: 9px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
      }

      .legend-row {
        display: grid;
        grid-template-columns: 58px 1fr;
        align-items: center;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
      }

      .legend-swatch {
        display: flex;
        min-height: 10px;
        border: 1px solid rgba(20, 33, 40, 0.16);
      }

      .legend-swatch.head {
        background: linear-gradient(90deg, hsl(201 42% 91%), hsl(201 58% 46%));
      }

      .legend-swatch.interface {
        background: linear-gradient(90deg, rgba(31, 110, 154, 0.1), rgba(31, 110, 154, 0.6));
      }

      .legend-swatch.reference-canals {
        background: repeating-linear-gradient(90deg, #0f7a58 0 10px, transparent 10px 15px);
        border-color: #0f7a58;
      }

      .legend-swatch.model-canals {
        background: #355f47;
      }

      .legend-swatch.isochlor-2018 {
        background: repeating-linear-gradient(90deg, #7c6f5b 0 12px, transparent 12px 18px);
        border-color: #7c6f5b;
      }

      .legend-swatch.isochlor-2022 {
        background: #c05f35;
      }

      .legend-risk {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 3px;
      }

      .legend-risk span {
        min-height: 10px;
        border: 1px solid rgba(20, 33, 40, 0.14);
      }

      .summary-note {
        margin: 0;
        padding: 10px 12px;
        background: #edf5f8;
        border: 1px solid #b9d3df;
        color: #12384b;
        font-size: 12px;
        line-height: 1.45;
      }

      .warning-list {
        display: grid;
        gap: 7px;
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.4;
      }

      .warning-item {
        display: grid;
        gap: 4px;
        padding: 8px 9px;
        border-radius: 6px;
      }

      .warning-item span {
        margin: 0;
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .warning-item strong {
        font-size: 12px;
        line-height: 1.4;
      }

      .warning-item.info {
        border: 1px solid #b9d3df;
        background: #edf5f8;
        color: #173947;
      }

      .warning-item.caution {
        border: 1px solid #e3c47c;
        background: #fff8e6;
        color: #5c4514;
      }

      .warning-item.severe {
        border: 1px solid #d7988f;
        background: #fff0ed;
        color: #742b23;
      }

      .regulatory-note {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .scenario-brief-print {
        display: none;
      }

      .brief-page {
        color: #111820;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      @media (max-width: 1080px) {
        main {
          grid-template-columns: minmax(220px, 260px) minmax(360px, 1fr);
          grid-template-rows: minmax(0, 1fr) auto;
          overflow: auto;
        }

        main > aside:last-child {
          grid-column: 1 / -1;
          grid-row: 2;
          max-height: 280px;
        }
      }

      @media (max-width: 760px) {
        body {
          overflow: auto;
        }

        .shell {
          height: auto;
          min-height: 100vh;
        }

        main {
          height: auto;
          display: flex;
          flex-direction: column;
          overflow: visible;
        }

        .map-panel {
          order: -1;
          position: sticky;
          top: 0;
          z-index: 10;
          min-height: 56vh;
        }

        main > aside,
        main > aside:last-child {
          max-height: none;
        }

        .map-canvas {
          min-height: 42vh;
        }
      }

      @media (max-height: 760px) and (min-width: 761px) {
        header {
          padding-block: 9px;
        }

        .brand span,
        .nav-stack + .hint {
          display: none;
        }

        .panel-header {
          padding-block: 8px;
        }

        .panel-body {
          padding-block: 9px;
        }
      }

      @media print {
        @page {
          margin: 0.58in;
        }

        html,
        body {
          height: auto;
          overflow: visible;
          background: #ffffff;
        }

        body {
          color: #111820;
          font-size: 10.5pt;
          line-height: 1.38;
        }

        .shell {
          display: none !important;
        }

        .scenario-brief-print {
          display: block !important;
        }

        .brief-page {
          display: grid;
          gap: 13pt;
          width: 100%;
        }

        .brief-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18pt;
          padding-bottom: 11pt;
          border-bottom: 1.5pt solid #111820;
        }

        .brief-header p,
        .brief-header h1 {
          margin: 0;
        }

        .brief-header p {
          color: #44515a;
          font-size: 8.5pt;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .brief-header h1 {
          margin-top: 3pt;
          font-size: 20pt;
          line-height: 1.08;
        }

        .brief-header strong {
          padding: 4pt 7pt;
          border: 1pt solid #111820;
          font-size: 9pt;
          text-transform: uppercase;
        }

        .brief-section {
          break-inside: avoid;
          display: grid;
          gap: 7pt;
        }

        .brief-section h2 {
          margin: 0;
          padding-bottom: 3pt;
          border-bottom: 0.75pt solid #9aa3aa;
          font-size: 10pt;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .brief-section p,
        .brief-section ul {
          margin: 0;
        }

        .brief-section ul {
          padding-left: 15pt;
        }

        .brief-callout,
        .brief-disclaimer {
          padding: 7pt 8pt;
          border: 1pt solid #8a949a;
        }

        .brief-card-grid,
        .brief-key-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7pt;
        }

        .brief-card,
        .brief-key-value,
        .brief-priority-row,
        .brief-assumption-list > div,
        .brief-warning {
          break-inside: avoid;
          display: grid;
          gap: 3pt;
          padding: 7pt;
          border: 0.75pt solid #9aa3aa;
        }

        .brief-card span,
        .brief-key-value span,
        .brief-warning span {
          color: #44515a;
          font-size: 8pt;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .brief-card b,
        .brief-key-value b,
        .brief-priority-row b {
          font-size: 9.5pt;
        }

        .brief-card p,
        .brief-priority-row p,
        .brief-assumption-list p,
        .brief-warning p,
        .brief-muted {
          color: #303b42;
          font-size: 9pt;
        }

        .brief-priority-list,
        .brief-assumption-list {
          display: grid;
          gap: 6pt;
        }

        .brief-priority-row span {
          font-size: 8.8pt;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="brand">
          <strong>Halocline Coastal Scenario Map</strong>
          <span>Live Stage 1 model layers over a real South Florida basemap</span>
        </div>
        <div class="status">
          <span class="dot" aria-hidden="true"></span>
          <span id="map-run-status">Baseline scenario</span>
        </div>
      </header>

      <main>
        <aside>
          <div class="accordion-section" data-accordion-section="workspace" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="workspace" aria-expanded="false" aria-controls="accordion-workspace-body">
                <span class="accordion-label">
                  <span class="accordion-title">Workspace</span>
                  <span class="meta">Stage 1</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-workspace-body" hidden>
            <div class="nav-stack">
              <a class="nav-link" href="/checkpoint">Checkpoint</a>
              <a class="nav-link" href="/map" aria-current="page">Scenario map</a>
            </div>
            <p class="hint">
              This route is the product-facing map. USGS/SFWMD layers are reference context; modeled head, interface, risk, and canal cells come from the simplified Stage 1 grid.
            </p>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="map-mode" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="map-mode" aria-expanded="false" aria-controls="accordion-map-mode-body">
                <span class="accordion-label">
                  <span class="accordion-title">Map Mode</span>
                  <span class="meta">Compare</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-map-mode-body" hidden>
            <div class="mode-toggle" role="group" aria-label="Map display mode">
              <button class="mode-button" type="button" data-map-mode="current" aria-pressed="true">Current</button>
              <button class="mode-button" type="button" data-map-mode="change" aria-pressed="false">Change</button>
            </div>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="scenario-presets" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="scenario-presets" aria-expanded="false" aria-controls="accordion-scenario-presets-body">
                <span class="accordion-label">
                  <span class="accordion-title">Scenario Presets</span>
                  <span class="meta" id="scenario-preset-label">Preset: Baseline</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-scenario-presets-body" hidden>
            <div class="preset-list" id="scenario-preset-list" aria-label="Scenario presets">
              ${renderScenarioPresets()}
            </div>
            <p class="hint">
              Presets apply surface controls only: recharge, sea level, and the currently selected wellfield pumping stress.
            </p>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="scenario" data-default-open="true" data-open="true">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="scenario" aria-expanded="true" aria-controls="accordion-scenario-body">
                <span class="accordion-label">
                  <span class="accordion-title">Scenario</span>
                  <span class="meta" id="scenario-status-label">Baseline</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-scenario-body">
            <div class="control-stack">
              <div class="control">
                <label for="map-recharge">Recharge multiplier <output id="map-recharge-value">1.00x</output></label>
                <input id="map-recharge" type="range" min="0.5" max="1.8" step="0.05" value="1" />
                <div class="hint">Scales distributed recharge before the head solve.</div>
              </div>
              <div class="control">
                <label for="map-sea-level">Sea-level rise <output id="map-sea-level-value">0.00 m</output></label>
                <input id="map-sea-level" type="range" min="0" max="0.8" step="0.05" value="0" />
                <div class="hint">Moves coastal fixed-head cells and relative head.</div>
              </div>
              <div class="control">
                <label for="map-well-select">Pumping well</label>
                <select id="map-well-select"></select>
                <label for="map-pumping">Pumping <output id="map-pumping-value">0 m3/day</output></label>
                <input id="map-pumping" type="range" min="0" max="6500" step="100" value="0" />
              </div>
              <div class="control">
                <label for="map-wellfield-select">Pumping wellfield</label>
                <select id="map-wellfield-select"></select>
                <label for="map-wellfield-pumping">Wellfield pumping <output id="map-wellfield-pumping-value">No override</output></label>
                <input id="map-wellfield-pumping" type="range" min="0" max="6500" step="100" value="0" />
                <div class="hint">Applies to all wells in the selected wellfield unless a well has its own override.</div>
              </div>
              <div class="control">
                <label for="map-canal-select">Modeled canal</label>
                <select id="map-canal-select"></select>
                <label for="map-canal-stage">Canal stage <output id="map-canal-stage-value">0.55 m</output></label>
                <input id="map-canal-stage" type="range" min="0" max="1.2" step="0.05" value="0.55" />
                <div class="hint">Sets simplified fixed-head cells rasterized from SFWMD reference canals.</div>
              </div>
              <div class="control">
                <button id="map-reset" type="button">Reset baseline</button>
              </div>
            </div>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="advanced" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="advanced" aria-expanded="false" aria-controls="accordion-advanced-body">
                <span class="accordion-label">
                  <span class="accordion-title">Advanced</span>
                  <span class="meta">Tuning</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-advanced-body" hidden>
            <details class="advanced-tuning">
              <summary>
                <span>Advanced model tuning</span>
                <span class="pill">Stage 1</span>
              </summary>
              <div class="control-stack">
                <div class="control">
                  <label for="map-initial-head">Initial head <output id="map-initial-head-value">0.60 m</output></label>
                  <input id="map-initial-head" type="range" min="-0.2" max="2.2" step="0.05" value="0.6" />
                </div>
                <div class="control">
                  <label for="map-gradient">Regional gradient <output id="map-gradient-value">0.025 m/km</output></label>
                  <input id="map-gradient" type="range" min="0" max="0.08" step="0.005" value="0.025" />
                </div>
                <div class="control">
                  <label for="map-base-recharge">Base recharge <output id="map-base-recharge-value">1,300 mm/yr</output></label>
                  <input id="map-base-recharge" type="range" min="600" max="2200" step="50" value="1300" />
                </div>
                <div class="control">
                  <label for="map-k-scale">K scale <output id="map-k-scale-value">1.00x</output></label>
                  <input id="map-k-scale" type="range" min="0.4" max="2" step="0.05" value="1" />
                </div>
                <div class="control">
                  <label for="map-default-canal-stage">Default canal stage <output id="map-default-canal-stage-value">0.55 m</output></label>
                  <input id="map-default-canal-stage" type="range" min="0" max="1.2" step="0.05" value="0.55" />
                  <div class="hint">Per-canal stage overrides still take precedence.</div>
                </div>
              </div>
            </details>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="layers" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="layers" aria-expanded="false" aria-controls="accordion-layers-body">
                <span class="accordion-label">
                  <span class="accordion-title">Layers</span>
                  <span class="meta">Map</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-layers-body" hidden>
            ${mapScenarioViewModel.layers
              .map(
                (layer) =>
                  `<div class="layer-row ${layer.available ? "" : "disabled"}"><label><input type="checkbox" data-toggle-layer="${layer.id}" ${
                    layer.enabled ? "checked" : ""
                  } ${layer.available ? "" : "disabled"} />${layer.label}</label><span class="pill">${
                    layer.available ? "on" : "later"
                  }</span></div>`,
              )
              .join("")}
            <div class="legend" aria-label="Map legend">
              <div class="legend-row">
                <span>Head</span>
                <span class="legend-swatch head" aria-hidden="true"></span>
              </div>
              <div class="legend-row">
                <span>Interface</span>
                <span class="legend-swatch interface" aria-hidden="true"></span>
              </div>
              <div class="legend-row">
                <span>Risk</span>
                <span class="legend-risk" aria-hidden="true">
                  <span style="background: #2f7d5c"></span>
                  <span style="background: #d6a72c"></span>
                  <span style="background: #b7791f"></span>
                  <span style="background: #b03a2e"></span>
                </span>
              </div>
              <div class="legend-row">
                <span>Model canals</span>
                <span class="legend-swatch model-canals" aria-hidden="true"></span>
              </div>
              <div class="legend-row">
                <span>USGS 2018</span>
                <span class="legend-swatch isochlor-2018" aria-hidden="true"></span>
              </div>
              <div class="legend-row">
                <span>USGS 2022</span>
                <span class="legend-swatch isochlor-2022" aria-hidden="true"></span>
              </div>
              <div class="legend-row">
                <span>SFWMD canals</span>
                <span class="legend-swatch reference-canals" aria-hidden="true"></span>
              </div>
            </div>
            </div>
          </div>
        </aside>

        <section class="map-panel">
          <div class="panel-header">
            <h2>Biscayne Coastal Scenario Area</h2>
            <span class="meta">Open basemap · ${mapScenarioViewModel.grid.rowCount} x ${mapScenarioViewModel.grid.colCount} model grid</span>
          </div>
          <div id="map-canvas" class="map-canvas" aria-label="Biscayne scenario map">
            <div id="actual-map" class="actual-map" aria-hidden="true"></div>
            <div id="map-fallback" class="map-fallback" aria-hidden="true">
            <svg class="model-svg" viewBox="0 0 100 100" role="img" aria-label="Projected real-domain aquifer grid">
              <polygon class="domain" data-layer="domain" points="${mapPointsToSvgPoints(mapScenarioViewModel.domain.polygon)}"></polygon>
              ${mapScenarioViewModel.grid.cells
                .map(
                  (cell) =>
                    `<polygon class="head-cell" data-layer="head" data-cell-id="${cell.id}" points="${mapPointsToSvgPoints(cell.polygon)}" fill="${cell.headColor}"></polygon>`,
                )
                .join("")}
              ${mapScenarioViewModel.grid.cells
                .map(
                  (cell) =>
                    `<polygon class="interface-cell" data-layer="interface" data-interface-cell-id="${cell.id}" points="${mapPointsToSvgPoints(cell.polygon)}" opacity="${cell.interfaceOpacity}"></polygon>`,
                )
                .join("")}
              ${mapScenarioViewModel.grid.cells
                .map(
                  (cell) =>
                    `<polygon class="grid-cell" data-layer="domain" points="${mapPointsToSvgPoints(cell.polygon)}"></polygon>`,
                )
                .join("")}
              <polyline class="coastline" data-layer="domain" points="${mapPointsToSvgPoints(mapScenarioViewModel.domain.coastline)}"></polyline>
              ${mapScenarioViewModel.canals
                .map(
                  (canal) =>
                    `<polyline class="canal" data-layer="canals" points="${mapPointsToSvgPoints(canal.polyline)}"></polyline>`,
                )
                .join("")}
              ${mapScenarioViewModel.wells
                .map(
                  (well) =>
                    `<g class="well-target" data-layer="wells" data-well-id="${well.id}" data-selected="false" role="button" tabindex="0" aria-label="Inspect ${well.name}, ${well.riskLevel} risk"><title>${well.name} · ${well.riskLevel} risk</title><circle class="well-selection-ring" cx="${well.point.x}" cy="${well.point.y}" r="2.45"></circle><circle class="risk-well" data-layer="risk" data-risk-well-id="${well.id}" cx="${well.point.x}" cy="${well.point.y}" r="1.55" fill="${well.riskColor}"></circle><circle class="well" cx="${well.point.x}" cy="${well.point.y}" r="0.75"></circle><text class="well-label" x="${well.point.x + 1.9}" y="${well.point.y - 1.25}">${well.name}</text></g>`,
                )
                .join("")}
            </svg>
            </div>
            <div class="basemap-note" id="basemap-note">
              OpenFreeMap basemap with USGS/SFWMD reference layers and real-domain simplified Stage 1 model overlays.
            </div>
          </div>
          <div class="map-footer">
            <span class="hint" id="head-range-label">Head: ${formatNumber(mapScenarioViewModel.ranges.headMeters.min)} to ${formatNumber(
              mapScenarioViewModel.ranges.headMeters.max,
            )} m</span>
            <span class="hint" id="interface-range-label">Interface: ${formatNumber(
              mapScenarioViewModel.ranges.interfaceDepthMeters.min,
            )} to ${formatNumber(mapScenarioViewModel.ranges.interfaceDepthMeters.max)} m</span>
          </div>
        </section>

        <aside>
          <div class="accordion-section" data-accordion-section="scenario-story" data-default-open="true" data-open="true">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="scenario-story" aria-expanded="true" aria-controls="scenario-story">
                <span class="accordion-label">
                  <span class="accordion-title">Scenario Story</span>
                  <span class="meta">Before / after</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
              <div class="panel-header-actions">
              <button class="print-button" id="print-brief" type="button">Print Brief</button>
              </div>
            </div>
            <div class="accordion-body panel-body story-panel" id="scenario-story">
            ${renderScenarioNarrative()}
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="scenario-compare" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="scenario-compare" aria-expanded="false" aria-controls="scenario-compare">
                <span class="accordion-label">
                  <span class="accordion-title">Scenario Compare</span>
                  <span class="meta">Session only</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
              <div class="panel-header-actions">
              <button class="print-button" id="pin-scenario" type="button">Pin Current Scenario</button>
              </div>
            </div>
            <div class="accordion-body panel-body story-panel" id="scenario-compare" hidden>
            ${renderScenarioCompare()}
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="well-priority" data-default-open="true" data-open="true">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="well-priority" aria-expanded="true" aria-controls="well-priority">
                <span class="accordion-label">
                  <span class="accordion-title">Well Priority</span>
                  <span class="meta">Ranked</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body story-panel" id="well-priority">
            ${renderWellPriority()}
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="model-assumptions" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="model-assumptions" aria-expanded="false" aria-controls="accordion-model-assumptions-body">
                <span class="accordion-label">
                  <span class="accordion-title">Model Assumptions</span>
                  <span class="meta">Stage 1</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-model-assumptions-body" hidden>
            <div class="assumption-list" id="model-assumption-list">
              ${renderModelAssumptions()}
            </div>
            <p class="regulatory-note">
              Calibration-lite values make this simplified model inspectable. They are not calibrated regulatory inputs or final hydrogeologic parameters.
            </p>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="calibration-readout" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="calibration-readout" aria-expanded="false" aria-controls="accordion-calibration-readout-body">
                <span class="accordion-label">
                  <span class="accordion-title">Calibration Readout</span>
                  <span class="meta">Lite</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body detail-list" id="accordion-calibration-readout-body" hidden>
            <div class="readout-grid">
              <div class="detail-item compact">
                <span>Active head range</span>
                <strong id="readout-head-range">${formatNumber(mapScenarioViewModel.calibrationReadout.activeHeadRangeMeters.min)} to ${formatNumber(
                  mapScenarioViewModel.calibrationReadout.activeHeadRangeMeters.max,
                )} m</strong>
              </div>
              <div class="detail-item compact">
                <span>Interface-depth range</span>
                <strong id="readout-interface-range">${formatNumber(
                  mapScenarioViewModel.calibrationReadout.interfaceDepthRangeMeters.min,
                )} to ${formatNumber(mapScenarioViewModel.calibrationReadout.interfaceDepthRangeMeters.max)} m</strong>
              </div>
              <div class="detail-item compact">
                <span>Max drawdown</span>
                <strong id="readout-max-drawdown">${formatNumber(mapScenarioViewModel.calibrationReadout.maxDrawdownMeters)} m</strong>
              </div>
              <div class="detail-item compact">
                <span>Highest-risk well</span>
                <strong id="readout-highest-risk">${mapScenarioViewModel.calibrationReadout.highestRiskWellName ?? "-"} · ${
                  mapScenarioViewModel.calibrationReadout.highestRiskLevel ?? "-"
                }</strong>
              </div>
              <div class="detail-item compact">
                <span>Warnings</span>
                <strong id="readout-warning-count">${mapScenarioViewModel.calibrationReadout.warningCount}</strong>
              </div>
            </div>
            <div class="readout-grid" id="tuning-readout-grid">
              ${renderTuningValues()}
            </div>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="why-changed" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="why-changed" aria-expanded="false" aria-controls="accordion-why-changed-body">
                <span class="accordion-label">
                  <span class="accordion-title">Why This Changed</span>
                  <span class="meta">Scenario</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body" id="accordion-why-changed-body" hidden>
            <ul class="why-list" id="why-change-list">
              ${renderChangeExplanations()}
            </ul>
            </div>
          </div>
          <div class="accordion-section" data-accordion-section="inspection" data-default-open="false" data-open="false">
            <div class="accordion-header">
              <button class="accordion-toggle" type="button" data-accordion-toggle="inspection" aria-expanded="false" aria-controls="accordion-inspection-body">
                <span class="accordion-label">
                  <span class="accordion-title">Inspection</span>
                  <span class="meta">Selected well</span>
                </span>
                <span class="accordion-icon" aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
            <div class="accordion-body panel-body detail-list" id="accordion-inspection-body" hidden>
            <p class="summary-note selected-well-narrative" id="selected-well-narrative">${escapeHtml(selectedWellNarrative())}</p>
            ${renderWellEvidence()}
            <div class="detail-item">
              <span>Well</span>
              <strong id="selected-well-name">${mapScenarioViewModel.highestRiskWell?.name ?? "-"}</strong>
            </div>
            <div class="detail-item">
              <span>Risk level</span>
              <strong class="risk-value" id="selected-well-risk">${mapScenarioViewModel.highestRiskWell?.riskLevel ?? "-"}</strong>
            </div>
            <div class="detail-item">
              <span>Pumping</span>
              <strong id="selected-well-pumping">${formatInteger(
                mapScenarioViewModel.highestRiskWell?.pumpingCubicMetersPerDay,
              )} m3/day</strong>
            </div>
            <div class="detail-item">
              <span>Screen bottom</span>
              <strong id="selected-well-screen">${formatNumber(
                mapScenarioViewModel.highestRiskWell?.screenBottomDepthMeters,
              )} m</strong>
            </div>
            <div class="detail-item">
              <span>Local head</span>
              <strong id="selected-well-head">${formatNumber(mapScenarioViewModel.highestRiskWell?.localHeadMeters)} m</strong>
            </div>
            <div class="detail-item">
              <span>Local interface depth</span>
              <strong id="selected-well-interface">${formatNumber(
                mapScenarioViewModel.highestRiskWell?.interfaceDepthMeters,
              )} m</strong>
            </div>
            <div class="detail-item">
              <span>Qcrit</span>
              <strong id="selected-well-qcrit">${formatInteger(
                mapScenarioViewModel.highestRiskWell?.qCritCubicMetersPerDay,
              )} m3/day</strong>
            </div>
            <div class="detail-item">
              <span>Risk ratio</span>
              <strong id="selected-well-ratio">${formatNumber(mapScenarioViewModel.highestRiskWell?.riskRatio)}</strong>
            </div>
            <div class="detail-item">
              <span>Current vs baseline</span>
              <strong id="selected-risk-change">-</strong>
            </div>
            <div class="comparison-grid">
              <div class="detail-item">
                <span>Head change</span>
                <strong id="selected-head-change">-</strong>
              </div>
              <div class="detail-item">
                <span>Interface change</span>
                <strong id="selected-interface-change">-</strong>
              </div>
              <div class="detail-item">
                <span>Qcrit change</span>
                <strong id="selected-qcrit-change">-</strong>
              </div>
              <div class="detail-item">
                <span>Risk-ratio change</span>
                <strong id="selected-ratio-change">-</strong>
              </div>
            </div>
            <div class="detail-item">
              <span>Local hydraulic conductivity</span>
              <strong id="selected-well-k">${formatNumber(
                mapScenarioViewModel.highestRiskWell?.localHydraulicConductivityMetersPerDay,
              )} m/day</strong>
            </div>
            <div class="detail-item">
              <span>Selected modeled canal</span>
              <strong id="selected-canal-name">${mapScenarioViewModel.canals[0]?.name ?? "-"}</strong>
            </div>
            <div class="comparison-grid">
              <div class="detail-item">
                <span>Canal stage</span>
                <strong id="selected-canal-stage">${formatNumber(mapScenarioViewModel.canals[0]?.currentStageMeters)} m</strong>
              </div>
              <div class="detail-item">
                <span>Fixed-head cells</span>
                <strong id="selected-canal-cells">${formatInteger(mapScenarioViewModel.canals[0]?.fixedHeadCellCount)}</strong>
              </div>
            </div>
            <div class="detail-item">
              <span>Solver</span>
              <strong id="solver-label">${mapScenarioViewModel.diagnostics.converged ? "Converged" : "Not converged"} · ${mapScenarioViewModel.diagnostics.iterationCount} iterations</strong>
            </div>
            <div class="detail-item">
              <span>Run time</span>
              <strong id="runtime-label">${formatNumber(mapScenarioViewModel.diagnostics.runTimeMilliseconds, 1)} ms</strong>
            </div>
            <div class="detail-item">
              <span>Plausibility warnings</span>
              <strong id="warning-count-label">${mapScenarioViewModel.diagnostics.warnings.length}</strong>
              <div class="warning-list" id="warning-list">
                ${renderWarningDetails()}
              </div>
            </div>
            <div class="detail-item">
              <span>Highest-risk well</span>
              <strong id="highest-risk-label">${mapScenarioViewModel.highestRiskWell?.name ?? "-"} · ${
                mapScenarioViewModel.highestRiskWell?.riskLevel ?? "-"
              }</strong>
            </div>
            <div class="detail-item">
              <span>Worsened wells</span>
              <strong id="worsened-wells-label">${mapScenarioViewModel.comparisonSummary.worsenedWellCount}</strong>
            </div>
            <div class="detail-item">
              <span>Largest head decline</span>
              <strong id="largest-head-decline-label">-</strong>
            </div>
            <div class="detail-item">
              <span>Largest interface decrease</span>
              <strong id="largest-interface-decrease-label">-</strong>
            </div>
            <p class="summary-note" id="map-summary">${mapScenarioViewModel.summary}</p>
            <p class="regulatory-note">
              USGS/SFWMD isochlor and canal lines are reference context. Modeled canal cells, head, interface, and well risk are simplified Stage 1 outputs, not a regulatory model or calibrated SEAWAT replacement.
            </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
    <section class="scenario-brief-print" id="scenario-brief-print" aria-label="Printable scenario brief">
      ${renderScenarioBriefPrint()}
    </section>
    <script src="https://unpkg.com/maplibre-gl@5.22.0/dist/maplibre-gl.js"></script>
    <script id="map-scenario-data" type="application/json">${serializedMapScenarioViewModel}</script>
    <script>
      let mapScenario = JSON.parse(document.getElementById("map-scenario-data").textContent);
      const baselineInput = JSON.parse(JSON.stringify(mapScenario.input));
      const baselineSelectedWellId = mapScenario.highestRiskWell ? mapScenario.highestRiskWell.id : mapScenario.wells[0]?.id;
      const baselineSelectedCanalId = mapScenario.canals[0]?.id;
      const baselineScenarioSnapshot = {
        ...mapScenario.scenarioSnapshot,
        presetLabel: "Baseline",
      };
      const pinnedScenarioSnapshotStorageKey = "halocline-stage1-pinned-scenario-snapshot";
      let fallbackPinnedScenarioSnapshot = null;
      let pinnedScenarioSnapshot = null;
      let scenarioState = JSON.parse(JSON.stringify(mapScenario.input));
      let activeScenarioPresetId = "baseline";
      let selectedWellId = baselineSelectedWellId;
      let selectedCanalId = baselineSelectedCanalId;
      let mapMode = "current";
      let pendingScenarioTimer = null;
      let requestSequence = 0;

      const mapControls = {
        scenarioPresetList: document.getElementById("scenario-preset-list"),
        recharge: document.getElementById("map-recharge"),
        seaLevel: document.getElementById("map-sea-level"),
        wellSelect: document.getElementById("map-well-select"),
        pumping: document.getElementById("map-pumping"),
        wellfieldSelect: document.getElementById("map-wellfield-select"),
        wellfieldPumping: document.getElementById("map-wellfield-pumping"),
        canalSelect: document.getElementById("map-canal-select"),
        canalStage: document.getElementById("map-canal-stage"),
        initialHead: document.getElementById("map-initial-head"),
        gradient: document.getElementById("map-gradient"),
        baseRecharge: document.getElementById("map-base-recharge"),
        kScale: document.getElementById("map-k-scale"),
        defaultCanalStage: document.getElementById("map-default-canal-stage"),
        rankingSort: document.getElementById("well-ranking-sort"),
        printBrief: document.getElementById("print-brief"),
        pinScenario: document.getElementById("pin-scenario"),
        reset: document.getElementById("map-reset"),
      };
      const liveMapLayersByLayerId = {
        domain: ["model-domain-fill", "model-domain-line", "model-coastline-line"],
        canals: ["model-canal-line"],
        wells: ["model-well-circle", "model-well-dot", "model-well-label"],
        head: ["model-head-fill"],
        interface: ["model-interface-fill"],
        risk: ["model-well-circle"],
        "reference-domain": ["reference-domain-fill", "reference-domain-line"],
        "reference-canals": ["reference-canal-line"],
        "isochlor-2018": ["isochlor-2018-line"],
        "isochlor-2022": ["isochlor-2022-line"],
      };
      const geoBounds = mapScenario.referenceBounds;
      let liveMap = null;
      let liveMapReady = false;
      const accordionStorageKey = "halocline-stage1-map-accordion-state";

      function readAccordionState() {
        try {
          const serialized = window.sessionStorage.getItem(accordionStorageKey);
          const parsed = serialized ? JSON.parse(serialized) : {};
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch (_error) {
          return {};
        }
      }

      function writeAccordionState() {
        const state = {};
        document.querySelectorAll("[data-accordion-section]").forEach(function (section) {
          const sectionId = section.getAttribute("data-accordion-section");
          if (sectionId) state[sectionId] = section.getAttribute("data-open") === "true";
        });

        try {
          window.sessionStorage.setItem(accordionStorageKey, JSON.stringify(state));
        } catch (_error) {
          // Accordions still work without storage; reload persistence is best effort.
        }
      }

      function setAccordionOpen(section, open, shouldPersist) {
        const toggle = section.querySelector("[data-accordion-toggle]");
        const body = section.querySelector(".accordion-body");
        section.setAttribute("data-open", open ? "true" : "false");
        if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (body) body.hidden = !open;
        if (shouldPersist) writeAccordionState();
      }

      function initializeAccordions() {
        const storedState = readAccordionState();
        document.querySelectorAll("[data-accordion-section]").forEach(function (section) {
          const sectionId = section.getAttribute("data-accordion-section");
          const hasStoredState =
            sectionId !== null && Object.prototype.hasOwnProperty.call(storedState, sectionId);
          const shouldOpen = hasStoredState
            ? storedState[sectionId] === true
            : section.getAttribute("data-default-open") === "true";
          const toggle = section.querySelector("[data-accordion-toggle]");

          setAccordionOpen(section, shouldOpen, false);
          if (toggle) {
            toggle.addEventListener("click", function () {
              setAccordionOpen(section, section.getAttribute("data-open") !== "true", true);
            });
          }
        });
      }

      function pointToLngLat(point) {
        return [
          geoBounds.west + (point.x / 100) * (geoBounds.east - geoBounds.west),
          geoBounds.north - (point.y / 100) * (geoBounds.north - geoBounds.south),
        ];
      }

      function closedLngLatRing(points) {
        const ring = points.map(pointToLngLat);
        if (ring.length > 0) ring.push(ring[0]);
        return ring;
      }

      function featureCollection(features) {
        return { type: "FeatureCollection", features };
      }

      function domainFeatures(result) {
        return featureCollection([
          {
            type: "Feature",
            properties: { id: result.domain.id, name: result.domain.name },
            geometry: { type: "Polygon", coordinates: [closedLngLatRing(result.domain.polygon)] },
          },
        ]);
      }

      function coastlineFeatures(result) {
        return featureCollection([
          {
            type: "Feature",
            properties: { id: result.domain.id + "-coastline" },
            geometry: { type: "LineString", coordinates: result.domain.coastline.map(pointToLngLat) },
          },
        ]);
      }

      function canalFeatures(result) {
        return featureCollection(
          result.canals.map(function (canal) {
            return {
              type: "Feature",
              properties: {
                id: canal.id,
                name: canal.name,
                currentStageMeters: canal.currentStageMeters,
                fixedHeadCellCount: canal.fixedHeadCellCount,
              },
              geometry: { type: "LineString", coordinates: canal.polyline.map(pointToLngLat) },
            };
          }),
        );
      }

      function cellFeatures(result) {
        return featureCollection(
          result.grid.cells.map(function (cell) {
            return {
              type: "Feature",
              id: cell.id,
              properties: {
                id: cell.id,
                row: cell.row,
                col: cell.col,
                active: cell.active,
                isCoastalBoundary: cell.isCoastalBoundary,
                isCanalBoundary: cell.isCanalBoundary,
                headMeters: cell.headMeters,
                interfaceDepthMeters: cell.interfaceDepthMeters,
                headColor: mapMode === "change" ? cell.headDifferenceColor : cell.headColor,
                interfaceColor: mapMode === "change" ? cell.interfaceDifferenceColor : "#1f6e9a",
                interfaceOpacity: mapMode === "change" ? cell.interfaceDifferenceOpacity : cell.interfaceOpacity,
              },
              geometry: { type: "Polygon", coordinates: [closedLngLatRing(cell.polygon)] },
            };
          }),
        );
      }

      function wellFeatures(result) {
        return featureCollection(
          result.wells.map(function (well) {
            return {
              type: "Feature",
              id: well.id,
              properties: {
                id: well.id,
                name: well.name,
                riskLevel: well.riskLevel,
                selected: well.id === selectedWellId,
                riskColor: mapMode === "change" ? well.riskChangeColor : well.riskColor,
              },
              geometry: { type: "Point", coordinates: pointToLngLat(well.point) },
            };
          }),
        );
      }

      function updateMapSource(sourceId, data) {
        if (!liveMapReady || !liveMap) return;
        const source = liveMap.getSource(sourceId);
        if (source && source.setData) source.setData(data);
      }

      function setLiveMapLayerVisibility(layerId, visible) {
        if (!liveMapReady || !liveMap) return;
        (liveMapLayersByLayerId[layerId] || []).forEach(function (mapLayerId) {
          if (liveMap.getLayer(mapLayerId)) {
            liveMap.setLayoutProperty(mapLayerId, "visibility", visible ? "visible" : "none");
          }
        });
      }

      function applyCurrentLayerToggleState() {
        document.querySelectorAll("[data-toggle-layer]").forEach(function (toggle) {
          setLiveMapLayerVisibility(toggle.getAttribute("data-toggle-layer"), toggle.checked);
        });
      }

      function repaintLiveMap(result) {
        if (!liveMapReady || !liveMap) return;
        updateMapSource("model-domain", domainFeatures(result));
        updateMapSource("model-coastline", coastlineFeatures(result));
        updateMapSource("model-canals", canalFeatures(result));
        updateMapSource("model-cells", cellFeatures(result));
        updateMapSource("model-wells", wellFeatures(result));
        applyCurrentLayerToggleState();
      }

      function initializeLiveMap() {
        if (!window.maplibregl) {
          setText("basemap-note", "Basemap library unavailable. Showing the local model fallback.");
          return;
        }

        try {
          liveMap = new maplibregl.Map({
            container: "actual-map",
            style: "https://tiles.openfreemap.org/styles/positron",
            center: [-80.32, 25.68],
            zoom: 9.35,
            attributionControl: true,
          });
          liveMap.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");
          liveMap.on("load", function () {
            liveMapReady = true;
            document.getElementById("map-canvas").classList.add("maplibre-ready");
            setText("basemap-note", "OpenFreeMap basemap · USGS isochlors, SFWMD canals, and real-domain simplified Stage 1 model overlays.");

            liveMap.addSource("reference-domain", { type: "geojson", data: mapScenario.referenceLayers.domain.data });
            liveMap.addSource("reference-canals", { type: "geojson", data: mapScenario.referenceLayers.canals.data });
            liveMap.addSource("isochlor-2018", { type: "geojson", data: mapScenario.referenceLayers.isochlor2018.data });
            liveMap.addSource("isochlor-2022", { type: "geojson", data: mapScenario.referenceLayers.isochlor2022.data });
            liveMap.addSource("model-domain", { type: "geojson", data: domainFeatures(mapScenario) });
            liveMap.addSource("model-coastline", { type: "geojson", data: coastlineFeatures(mapScenario) });
            liveMap.addSource("model-canals", { type: "geojson", data: canalFeatures(mapScenario) });
            liveMap.addSource("model-cells", { type: "geojson", data: cellFeatures(mapScenario) });
            liveMap.addSource("model-wells", { type: "geojson", data: wellFeatures(mapScenario) });

            liveMap.addLayer({
              id: "reference-domain-fill",
              type: "fill",
              source: "reference-domain",
              paint: { "fill-color": "#dbe8df", "fill-opacity": 0.18 },
            });
            liveMap.addLayer({
              id: "reference-domain-line",
              type: "line",
              source: "reference-domain",
              paint: {
                "line-color": "#4a6f65",
                "line-width": 2,
                "line-opacity": 0.9,
                "line-dasharray": [2, 1.4],
              },
            });
            liveMap.addLayer({
              id: "model-domain-fill",
              type: "fill",
              source: "model-domain",
              paint: { "fill-color": "#cfe2d9", "fill-opacity": 0.22 },
            });
            liveMap.addLayer({
              id: "model-domain-line",
              type: "line",
              source: "model-domain",
              paint: { "line-color": "#375f55", "line-width": 1.6, "line-opacity": 0.9 },
            });
            liveMap.addLayer({
              id: "model-head-fill",
              type: "fill",
              source: "model-cells",
              paint: {
                "fill-color": ["get", "headColor"],
                "fill-opacity": 0.62,
                "fill-outline-color": "rgba(30, 48, 56, 0.28)",
              },
            });
            liveMap.addLayer({
              id: "model-interface-fill",
              type: "fill",
              source: "model-cells",
              paint: {
                "fill-color": ["get", "interfaceColor"],
                "fill-opacity": ["to-number", ["get", "interfaceOpacity"], 0.2],
              },
            });
            liveMap.addLayer({
              id: "model-coastline-line",
              type: "line",
              source: "model-coastline",
              paint: { "line-color": "#338eb4", "line-width": 3.2, "line-opacity": 0.86 },
            });
            liveMap.addLayer({
              id: "model-canal-line",
              type: "line",
              source: "model-canals",
              paint: {
                "line-color": "#355f47",
                "line-width": 4.4,
                "line-opacity": 0.88,
              },
            });
            liveMap.addLayer({
              id: "reference-canal-line",
              type: "line",
              source: "reference-canals",
              paint: {
                "line-color": "#0f7a58",
                "line-width": 2,
                "line-opacity": 0.62,
                "line-dasharray": [1.5, 1.2],
              },
            });
            liveMap.addLayer({
              id: "isochlor-2018-line",
              type: "line",
              source: "isochlor-2018",
              paint: {
                "line-color": "#7c6f5b",
                "line-width": 2.2,
                "line-opacity": 0.86,
                "line-dasharray": [2, 1.2],
              },
            });
            liveMap.addLayer({
              id: "isochlor-2022-line",
              type: "line",
              source: "isochlor-2022",
              paint: {
                "line-color": "#c05f35",
                "line-width": 2.6,
                "line-opacity": 0.9,
              },
            });
            liveMap.addLayer({
              id: "model-well-circle",
              type: "circle",
              source: "model-wells",
              paint: {
                "circle-color": ["get", "riskColor"],
                "circle-radius": ["case", ["boolean", ["get", "selected"], false], 10, 7],
                "circle-stroke-color": ["case", ["boolean", ["get", "selected"], false], "#111f27", "#ffffff"],
                "circle-stroke-width": ["case", ["boolean", ["get", "selected"], false], 3, 2],
                "circle-opacity": 0.96,
              },
            });
            liveMap.addLayer({
              id: "model-well-dot",
              type: "circle",
              source: "model-wells",
              paint: {
                "circle-color": "#101c22",
                "circle-radius": 2.5,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1,
              },
            });
            liveMap.addLayer({
              id: "model-well-label",
              type: "symbol",
              source: "model-wells",
              layout: {
                "text-field": ["get", "name"],
                "text-size": 12,
                "text-font": ["Noto Sans Bold"],
                "text-offset": [1.1, -1],
                "text-anchor": "left",
              },
              paint: {
                "text-color": "#10222b",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.4,
              },
            });

            liveMap.on("click", "model-well-circle", function (event) {
              const feature = event.features && event.features[0];
              if (feature && feature.properties && feature.properties.id) {
                selectWell(feature.properties.id);
              }
            });
            liveMap.on("mouseenter", "model-well-circle", function () {
              liveMap.getCanvas().style.cursor = "pointer";
            });
            liveMap.on("mouseleave", "model-well-circle", function () {
              liveMap.getCanvas().style.cursor = "";
            });
            liveMap.fitBounds(
              [
                [geoBounds.west, geoBounds.south],
                [geoBounds.east, geoBounds.north],
              ],
              { padding: { top: 64, right: 52, bottom: 48, left: 42 }, duration: 0 },
            );
            repaintLiveMap(mapScenario);
          });
          liveMap.on("error", function () {
            setText("basemap-note", "Basemap tiles unavailable. Showing the local model fallback.");
          });
        } catch (error) {
          setText("basemap-note", "Basemap could not start. Showing the local model fallback.");
        }
      }

      function formatNumberForPanel(value, digits) {
        const resolvedDigits = digits === undefined ? 2 : digits;
        if (value === null || value === undefined || !Number.isFinite(value)) return "-";
        return value.toLocaleString("en-US", {
          maximumFractionDigits: resolvedDigits,
          minimumFractionDigits: resolvedDigits,
        });
      }

      function formatIntegerForPanel(value) {
        if (value === null || value === undefined || !Number.isFinite(value)) return "-";
        return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
      }

      function formatSignedNumber(value, digits, unit) {
        if (value === null || value === undefined || !Number.isFinite(value)) return "-";
        const sign = value > 0 ? "+" : "";
        return sign + formatNumberForPanel(value, digits) + (unit || "");
      }

      function formatSignedInteger(value, unit) {
        if (value === null || value === undefined || !Number.isFinite(value)) return "-";
        const sign = value > 0 ? "+" : "";
        return sign + formatIntegerForPanel(value) + (unit || "");
      }

      function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      }

      function replaceChildren(element, children) {
        if (!element) return;
        element.innerHTML = "";
        children.forEach(function (child) {
          element.append(child);
        });
      }

      function textElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        element.textContent = text;
        return element;
      }

      function briefSection(title, children) {
        const section = document.createElement("section");
        section.className = "brief-section";
        section.append(textElement("h2", "", title));
        children.forEach(function (child) {
          section.append(child);
        });
        return section;
      }

      function renderScenarioBriefPrint(result) {
        const root = document.getElementById("scenario-brief-print");
        const brief = result.scenarioBrief;
        if (!root || !brief) return;

        const article = document.createElement("article");
        article.className = "brief-page";

        const header = document.createElement("header");
        header.className = "brief-header";
        const headerCopy = document.createElement("div");
        headerCopy.append(
          textElement("p", "", "Stage 1 scenario brief"),
          textElement("h1", "", brief.title),
        );
        header.append(headerCopy, textElement("strong", "", brief.scenarioStatusLabel));

        const narrativeCopy = document.createElement("p");
        narrativeCopy.textContent = brief.body;
        const dominantChange = textElement("p", "brief-callout", brief.dominantChange);

        const cardGrid = document.createElement("div");
        cardGrid.className = "brief-card-grid";
        brief.beforeAfterCards.forEach(function (card) {
          const item = document.createElement("div");
          item.className = "brief-card";
          item.append(
            textElement("span", "", card.label),
            textElement("b", "", card.baselineValue + " -> " + card.currentValue),
            textElement("p", "", card.helperText),
          );
          cardGrid.append(item);
        });

        const priorityList = document.createElement("div");
        priorityList.className = "brief-priority-list";
        brief.wellPriorityRows.forEach(function (row) {
          const item = document.createElement("div");
          item.className = "brief-priority-row";
          item.append(
            textElement("b", "", row.rank + ". " + row.wellName),
            textElement("span", "", row.displayValues.riskLevel + " · " + row.changeStatus),
            textElement(
              "span",
              "",
              "Ratio " +
                row.displayValues.riskRatio +
                " · Head " +
                row.displayValues.headChange +
                " · Interface " +
                row.displayValues.interfaceChange,
            ),
            textElement("p", "", row.whyThisWellMatters),
          );
          priorityList.append(item);
        });

        const readoutGrid = document.createElement("div");
        readoutGrid.className = "brief-key-grid";
        brief.calibrationItems.forEach(function (item) {
          const row = document.createElement("div");
          row.className = "brief-key-value";
          row.append(textElement("span", "", item.label), textElement("b", "", item.value));
          readoutGrid.append(row);
        });

        const assumptions = document.createElement("div");
        assumptions.className = "brief-assumption-list";
        brief.modelAssumptions.forEach(function (assumption) {
          const item = document.createElement("div");
          item.append(
            textElement("b", "", assumption.label + ": " + assumption.displayValue),
            textElement("p", "", assumption.explanation),
          );
          assumptions.append(item);
        });

        const changes = document.createElement("ul");
        brief.changeExplanations.forEach(function (explanation) {
          changes.append(textElement("li", "", explanation));
        });

        const warnings = document.createElement("div");
        if (brief.warnings.length === 0) {
          warnings.append(textElement("p", "brief-muted", "No warnings."));
        } else {
          brief.warnings.forEach(function (warning) {
            const item = document.createElement("div");
            item.className = "brief-warning " + warning.severity;
            item.append(
              textElement("span", "", warning.severity),
              textElement("p", "", warning.message),
            );
            warnings.append(item);
          });
        }

        article.append(
          header,
          briefSection(brief.headline, [narrativeCopy, dominantChange]),
          briefSection("Before / After", [cardGrid]),
          briefSection("Well Priority", [priorityList]),
          briefSection("Calibration-Lite Readout", [readoutGrid]),
          briefSection("Model Assumptions", [assumptions]),
          briefSection("Why This Changed", [changes]),
          briefSection("Warnings", [warnings]),
          briefSection("Scenario Summary", [
            textElement("p", "", brief.summary),
            textElement("p", "brief-disclaimer", brief.stage1Disclaimer),
          ]),
        );
        replaceChildren(root, [article]);
      }

      function selectedEvidenceRow() {
        return mapScenario.wellEvidence.rows.find(function (row) {
          return row.wellId === selectedWellId;
        });
      }

      function evidenceValue(labelText, valueText) {
        const value = document.createElement("span");
        const label = document.createElement("b");
        label.textContent = labelText;
        value.append(label, document.createTextNode(valueText));
        return value;
      }

      function evidenceItemElement(item) {
        const row = document.createElement("div");
        row.className = "evidence-item";
        row.setAttribute("data-evidence-item-id", item.id);
        row.append(
          textElement("strong", "", item.label),
          evidenceValue("Before", item.baselineValue),
          evidenceValue("Current", item.currentValue),
          evidenceValue("Change", item.changeValue),
          textElement("p", "", item.helperText),
        );
        return row;
      }

      function evidenceNoteElement(note, type) {
        const item = document.createElement("div");
        item.className = "evidence-note";
        item.setAttribute("data-evidence-" + type + "-id", note.id);
        item.append(textElement("strong", "", note.title), textElement("p", "", note.body));
        return item;
      }

      function renderWellEvidence() {
        const evidence = mapScenario.wellEvidence;
        const row = selectedEvidenceRow();

        setText("well-evidence-status", row ? row.changeStatus : "No selected well");
        setText(
          "well-evidence-why",
          row ? row.whyThisWellMatters : "Select a well to inspect its evidence trace.",
        );
        replaceChildren(
          document.getElementById("well-evidence-items"),
          row ? row.items.map(evidenceItemElement) : [],
        );
        replaceChildren(
          document.getElementById("well-evidence-calculation-notes"),
          evidence.calculationNotes.map(function (note) {
            return evidenceNoteElement(note, "calculation");
          }),
        );
        replaceChildren(
          document.getElementById("well-evidence-provenance-notes"),
          evidence.provenanceNotes.map(function (note) {
            return evidenceNoteElement(note, "provenance");
          }),
        );
        setText("well-evidence-disclaimer", evidence.stage1Disclaimer);
      }

      function renderScenarioNarrative(result) {
        const narrative = result.scenarioNarrative;
        const storyBlock = document.getElementById("scenario-story-block");
        if (storyBlock) {
          storyBlock.className = "story-block " + narrative.riskPosture;
        }
        setText("story-posture", narrative.riskPosture);
        setText("story-headline", narrative.headline);
        setText("story-body", narrative.body);
        setText("story-dominant-change", narrative.dominantChange);
        setText("story-disclaimer", narrative.stage1Disclaimer);

        const cards = narrative.beforeAfterCards.map(function (card) {
          const item = document.createElement("div");
          item.className = "story-card " + card.posture;
          item.setAttribute("data-story-card-id", card.id);

          const label = document.createElement("span");
          label.textContent = card.label;
          const values = document.createElement("div");
          values.className = "story-card-values";
          const baseline = document.createElement("b");
          baseline.textContent = card.baselineValue;
          const current = document.createElement("strong");
          current.textContent = card.currentValue;
          values.append(baseline, current);
          const helper = document.createElement("small");
          helper.textContent = card.helperText;

          item.append(label, values, helper);
          return item;
        });
        replaceChildren(document.getElementById("before-after-grid"), cards);
      }

      function rowsForRankingSort(result, sortId) {
        const rowByWellId = new Map(result.wellRiskRanking.rows.map(function (row) {
          return [row.wellId, row];
        }));
        const sortOption =
          result.wellRiskRanking.sortOptions.find(function (option) {
            return option.id === sortId;
          }) ||
          result.wellRiskRanking.sortOptions.find(function (option) {
            return option.id === result.wellRiskRanking.defaultSort;
          });

        if (!sortOption) return result.wellRiskRanking.rows;
        return sortOption.wellIds
          .map(function (wellId) {
            return rowByWellId.get(wellId);
          })
          .filter(Boolean);
      }

      function updatePrioritySelection() {
        document.querySelectorAll("[data-priority-well-id]").forEach(function (row) {
          row.setAttribute(
            "data-selected",
            row.getAttribute("data-priority-well-id") === selectedWellId ? "true" : "false",
          );
        });
      }

      function selectedRankingRow() {
        return mapScenario.wellRiskRanking.rows.find(function (row) {
          return row.wellId === selectedWellId;
        });
      }

      function priorityMetric(labelText, valueText) {
        const metric = document.createElement("span");
        metric.className = "priority-metric";
        const label = document.createElement("b");
        label.textContent = labelText;
        metric.append(label, document.createTextNode(valueText));
        return metric;
      }

      function renderWellPriority(result, sortId) {
        const selectedSortId = sortId || result.wellRiskRanking.defaultSort;
        if (mapControls.rankingSort) mapControls.rankingSort.value = selectedSortId;
        const rows = rowsForRankingSort(result, selectedSortId).map(function (row, index) {
          const item = document.createElement("button");
          item.className = "priority-row " + row.changeStatus;
          item.type = "button";
          item.setAttribute("data-priority-well-id", row.wellId);
          item.setAttribute("data-selected", row.wellId === selectedWellId ? "true" : "false");

          const rank = document.createElement("span");
          rank.className = "priority-rank";
          rank.textContent = String(index + 1);
          const name = document.createElement("span");
          name.className = "priority-name";
          name.textContent = row.wellName;
          const risk = document.createElement("span");
          risk.className = "priority-risk";
          risk.textContent = row.displayValues.riskLevel;
          const status = document.createElement("span");
          status.className = "priority-status";
          status.textContent = row.changeStatus;

          const ratio = priorityMetric("Ratio", row.displayValues.riskRatio);
          const head = priorityMetric("Head", row.displayValues.headChange);
          const interfaceChange = priorityMetric("Interface", row.displayValues.interfaceChange);

          item.append(rank, name, risk, status, ratio, head, interfaceChange);
          item.addEventListener("click", function () {
            selectWell(row.wellId);
          });
          item.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectWell(row.wellId);
            }
          });
          return item;
        });
        replaceChildren(document.getElementById("well-priority-list"), rows);
      }

      function renderAssumptionList(result) {
        const rows = result.modelAssumptions.map(function (assumption) {
          const row = document.createElement("div");
          row.className = "assumption-row";
          row.setAttribute("data-assumption-id", assumption.id);

          const copy = document.createElement("div");
          const label = document.createElement("strong");
          label.textContent = assumption.label;
          const explanation = document.createElement("span");
          explanation.textContent = assumption.explanation;
          copy.append(label, explanation);

          const value = document.createElement("b");
          value.textContent = assumption.displayValue;
          row.append(copy, value);
          return row;
        });
        replaceChildren(document.getElementById("model-assumption-list"), rows);
      }

      function renderTuningReadout(result) {
        const rows = result.calibrationReadout.tuningValues.map(function (assumption) {
          const item = document.createElement("div");
          item.className = "detail-item compact";
          item.setAttribute("data-tuning-value-id", assumption.id);
          const label = document.createElement("span");
          label.textContent = assumption.label;
          const value = document.createElement("strong");
          value.textContent = assumption.displayValue;
          item.append(label, value);
          return item;
        });
        replaceChildren(document.getElementById("tuning-readout-grid"), rows);
      }

      function renderChangeExplanations(result) {
        const rows = result.changeExplanations.map(function (explanation) {
          const item = document.createElement("li");
          item.textContent = explanation;
          return item;
        });
        replaceChildren(document.getElementById("why-change-list"), rows);
      }

      function renderWarningList(result) {
        const warningList = document.getElementById("warning-list");
        if (!warningList) return;

        warningList.innerHTML = "";
        const warnings = result.diagnostics.warningDetails || [];
        if (warnings.length === 0) {
          warningList.textContent = "No warnings.";
          return;
        }

        warnings.forEach(function (warning) {
          const item = document.createElement("div");
          item.className = "warning-item " + warning.severity;
          const severity = document.createElement("span");
          severity.textContent = warning.severity;
          const message = document.createElement("strong");
          message.textContent = warning.message;
          item.append(severity, message);
          warningList.append(item);
        });
      }

      function cloneInput(input) {
        return JSON.parse(JSON.stringify(input));
      }

      function scenarioPresetById(presetId) {
        return (mapScenario.scenarioPresets || []).find(function (preset) {
          return preset.id === presetId;
        });
      }

      function activeScenarioPresetLabel() {
        if (activeScenarioPresetId === "custom") return "Custom";
        return scenarioPresetById(activeScenarioPresetId)?.label ?? "Custom";
      }

      function updateScenarioPresetUi() {
        setText("scenario-preset-label", "Preset: " + activeScenarioPresetLabel());
        document.querySelectorAll("[data-scenario-preset-id]").forEach(function (button) {
          button.setAttribute(
            "aria-pressed",
            button.getAttribute("data-scenario-preset-id") === activeScenarioPresetId ? "true" : "false",
          );
        });
      }

      function setActiveScenarioPreset(presetId) {
        activeScenarioPresetId = presetId;
        updateScenarioPresetUi();
      }

      function markScenarioCustom() {
        if (activeScenarioPresetId !== "custom") {
          setActiveScenarioPreset("custom");
        }
      }

      function selectedWellfieldIdForPreset() {
        const selectedWell = mapScenario.wells.find(function (well) {
          return well.id === selectedWellId;
        });
        return mapControls.wellfieldSelect.value || selectedWell?.wellfieldId || mapScenario.wells[0]?.wellfieldId;
      }

      function renderScenarioPresetButtons(result) {
        const root = mapControls.scenarioPresetList;
        if (!root || !Array.isArray(result.scenarioPresets)) return;
        const buttons = result.scenarioPresets.map(function (preset) {
          const button = document.createElement("button");
          button.className = "preset-button";
          button.type = "button";
          button.setAttribute("data-scenario-preset-id", preset.id);
          button.setAttribute("aria-pressed", preset.id === activeScenarioPresetId ? "true" : "false");
          button.append(
            textElement("strong", "", preset.label),
            textElement("span", "", preset.description),
          );
          return button;
        });
        replaceChildren(root, buttons);
        updateScenarioPresetUi();
      }

      function applyScenarioPreset(presetId) {
        const preset = scenarioPresetById(presetId);
        if (!preset) return;
        const patch = preset.inputPatch || {};
        scenarioState = cloneInput(baselineInput);
        ensureScenarioMaps();
        scenarioState.wellPumpingCubicMetersPerDayById = {};
        scenarioState.wellfieldPumpingCubicMetersPerDayById = {};
        if (patch.rechargeMultiplier !== undefined) {
          scenarioState.rechargeMultiplier = patch.rechargeMultiplier;
        }
        if (patch.seaLevelRiseMeters !== undefined) {
          scenarioState.seaLevelRiseMeters = patch.seaLevelRiseMeters;
        }
        if (patch.selectedWellfieldPumpingCubicMetersPerDay !== undefined) {
          const wellfieldId = selectedWellfieldIdForPreset();
          if (wellfieldId) {
            scenarioState.wellfieldPumpingCubicMetersPerDayById[wellfieldId] =
              patch.selectedWellfieldPumpingCubicMetersPerDay;
          }
        }
        if (preset.id === "baseline") {
          selectedWellId = baselineSelectedWellId;
          selectedCanalId = baselineSelectedCanalId;
        }
        setActiveScenarioPreset(preset.id);
        syncControlLabels();
        updateSelectedCanalPanel();
        scheduleMapScenarioRun();
      }

      function snapshotWithLabel(snapshot, label) {
        return {
          ...snapshot,
          presetLabel: label,
        };
      }

      function currentScenarioSnapshot(result) {
        return snapshotWithLabel(result.scenarioSnapshot, activeScenarioPresetLabel());
      }

      function loadPinnedScenarioSnapshot() {
        try {
          const serialized = window.sessionStorage.getItem(pinnedScenarioSnapshotStorageKey);
          return serialized ? JSON.parse(serialized) : fallbackPinnedScenarioSnapshot;
        } catch (_error) {
          return fallbackPinnedScenarioSnapshot;
        }
      }

      function storePinnedScenarioSnapshot(snapshot) {
        fallbackPinnedScenarioSnapshot = snapshot;
        try {
          window.sessionStorage.setItem(pinnedScenarioSnapshotStorageKey, JSON.stringify(snapshot));
        } catch (_error) {
          // The in-memory fallback keeps pinning usable when sessionStorage is unavailable.
        }
      }

      function signedMetricDelta(value, suffix) {
        const sign = value > 0 ? "+" : "";
        return sign + value.toLocaleString("en-US", { maximumFractionDigits: 2 }) + (suffix || "");
      }

      function compareScenarioSnapshots(currentSnapshot, pinnedSnapshot) {
        if (!pinnedSnapshot) return "Pin current scenario to compare later runs against it.";
        const changes = [];
        const currentMetrics = currentSnapshot.metrics;
        const pinnedMetrics = pinnedSnapshot.metrics;
        const worsenedDelta =
          currentMetrics.worsenedWellCount - pinnedMetrics.worsenedWellCount;
        const drawdownDelta =
          currentMetrics.maxDrawdownMeters - pinnedMetrics.maxDrawdownMeters;
        const warningDelta =
          currentMetrics.warningCount - pinnedMetrics.warningCount;
        const postureDelta =
          currentMetrics.riskPostureRank - pinnedMetrics.riskPostureRank;

        if (worsenedDelta !== 0) {
          changes.push(signedMetricDelta(worsenedDelta, "") + " worsened wells");
        }
        if (currentSnapshot.highestRiskWellId !== pinnedSnapshot.highestRiskWellId) {
          changes.push(
            "highest-risk well changed from " +
              (pinnedSnapshot.displayValues.highestRiskWell || "-") +
              " to " +
              (currentSnapshot.displayValues.highestRiskWell || "-"),
          );
        }
        if (Math.abs(drawdownDelta) >= 0.005) {
          changes.push(signedMetricDelta(drawdownDelta, " m") + " max drawdown");
        }
        if (warningDelta !== 0) {
          changes.push(signedMetricDelta(warningDelta, "") + " warnings");
        }
        if (postureDelta !== 0) {
          changes.push(
            "posture changed from " +
              pinnedSnapshot.riskPosture +
              " to " +
              currentSnapshot.riskPosture,
          );
        }

        return changes.length > 0
          ? "Compared to pinned: " + changes.join("; ") + "."
          : "Compared to pinned: current snapshot matches the pinned scenario metrics.";
      }

      function updateSnapshotCard(kind, snapshot, emptyText) {
        const card = document.getElementById("snapshot-" + kind + "-card");
        if (!card) return;
        if (!snapshot) {
          card.className = "snapshot-card empty";
          setText("snapshot-" + kind + "-label", "No scenario pinned");
          setText("snapshot-" + kind + "-headline", emptyText);
          setText("snapshot-" + kind + "-posture", "Session only");
          setText("snapshot-" + kind + "-wells", "-");
          setText("snapshot-" + kind + "-highest", "-");
          setText("snapshot-" + kind + "-drawdown", "-");
          setText("snapshot-" + kind + "-warnings", "-");
          return;
        }

        card.className = "snapshot-card " + snapshot.riskPosture;
        setText("snapshot-" + kind + "-label", snapshot.presetLabel || snapshot.scenarioStatusLabel);
        setText("snapshot-" + kind + "-headline", snapshot.headline);
        setText("snapshot-" + kind + "-posture", snapshot.riskPosture);
        setText("snapshot-" + kind + "-wells", snapshot.displayValues.worsenedWells);
        setText("snapshot-" + kind + "-highest", snapshot.displayValues.highestRiskWell);
        setText("snapshot-" + kind + "-drawdown", snapshot.displayValues.maxDrawdown);
        setText("snapshot-" + kind + "-warnings", snapshot.displayValues.warnings);
      }

      function renderScenarioCompare(result) {
        const currentSnapshot = currentScenarioSnapshot(result);
        const compareCallout = document.getElementById("compare-to-pinned");

        updateSnapshotCard("baseline", baselineScenarioSnapshot);
        updateSnapshotCard("current", currentSnapshot);
        updateSnapshotCard(
          "pinned",
          pinnedScenarioSnapshot,
          "Pin the current scenario to compare it against later runs.",
        );
        if (compareCallout) {
          compareCallout.textContent = compareScenarioSnapshots(currentSnapshot, pinnedScenarioSnapshot);
          compareCallout.classList.toggle("empty", !pinnedScenarioSnapshot);
        }
        setText("compare-disclaimer", currentSnapshot.stage1Disclaimer);
      }

      function ensureScenarioMaps() {
        scenarioState.wellPumpingCubicMetersPerDayById =
          scenarioState.wellPumpingCubicMetersPerDayById || {};
        scenarioState.wellfieldPumpingCubicMetersPerDayById =
          scenarioState.wellfieldPumpingCubicMetersPerDayById || {};
        scenarioState.canalStageMetersById =
          scenarioState.canalStageMetersById || {};
        scenarioState.modelTuning =
          scenarioState.modelTuning || {};
      }

      function pumpingForSelectedWell() {
        ensureScenarioMaps();
        if (!selectedWellId) return 0;
        const selectedWell = mapScenario.wells.find(function (well) {
          return well.id === selectedWellId;
        });
        return (
          scenarioState.wellPumpingCubicMetersPerDayById[selectedWellId] ??
          (selectedWell
            ? scenarioState.wellfieldPumpingCubicMetersPerDayById[selectedWell.wellfieldId]
            : undefined) ??
          selectedWell?.pumpingCubicMetersPerDay ??
          0
        );
      }

      function pumpingForSelectedWellfield() {
        ensureScenarioMaps();
        const wellfieldId = mapControls.wellfieldSelect.value;
        return scenarioState.wellfieldPumpingCubicMetersPerDayById[wellfieldId];
      }

      function stageForSelectedCanal() {
        ensureScenarioMaps();
        const canalId = selectedCanalId || mapControls.canalSelect.value;
        const selectedCanal = mapScenario.canals.find(function (canal) {
          return canal.id === canalId;
        });
        return (
          scenarioState.canalStageMetersById[canalId] ??
          scenarioState.modelTuning.defaultCanalStageMeters ??
          selectedCanal?.currentStageMeters ??
          selectedCanal?.baselineStageMeters ??
          0.55
        );
      }

      function modelTuningValue(key) {
        ensureScenarioMaps();
        return (
          scenarioState.modelTuning[key] ??
          mapScenario.input.resolvedModelTuning[key]
        );
      }

      function setRunStatus(text) {
        setText("map-run-status", text);
      }

      function syncControlLabels() {
        const recharge = Number(scenarioState.rechargeMultiplier);
        const seaLevel = Number(scenarioState.seaLevelRiseMeters);
        mapControls.recharge.value = String(recharge);
        mapControls.seaLevel.value = String(seaLevel);
        mapControls.pumping.value = String(Math.round(pumpingForSelectedWell()));
        mapControls.wellfieldPumping.value = String(Math.round(pumpingForSelectedWellfield() ?? 0));
        mapControls.canalStage.value = String(Number(stageForSelectedCanal()).toFixed(2));
        mapControls.initialHead.value = String(Number(modelTuningValue("initialHeadMeters")).toFixed(2));
        mapControls.gradient.value = String(Number(modelTuningValue("regionalGradientMetersPerKilometer")).toFixed(3));
        mapControls.baseRecharge.value = String(Math.round(modelTuningValue("baseRechargeMillimetersPerYear")));
        mapControls.kScale.value = String(Number(modelTuningValue("hydraulicConductivityScale")).toFixed(2));
        mapControls.defaultCanalStage.value = String(Number(modelTuningValue("defaultCanalStageMeters")).toFixed(2));
        setText("map-recharge-value", recharge.toFixed(2) + "x");
        setText("map-sea-level-value", seaLevel.toFixed(2) + " m");
        setText("map-pumping-value", formatIntegerForPanel(pumpingForSelectedWell()) + " m3/day");
        setText(
          "map-wellfield-pumping-value",
          pumpingForSelectedWellfield() === undefined
            ? "No override"
            : formatIntegerForPanel(pumpingForSelectedWellfield()) + " m3/day",
        );
        setText("map-canal-stage-value", Number(stageForSelectedCanal()).toFixed(2) + " m");
        setText("map-initial-head-value", Number(modelTuningValue("initialHeadMeters")).toFixed(2) + " m");
        setText("map-gradient-value", Number(modelTuningValue("regionalGradientMetersPerKilometer")).toFixed(3) + " m/km");
        setText("map-base-recharge-value", formatIntegerForPanel(modelTuningValue("baseRechargeMillimetersPerYear")) + " mm/yr");
        setText("map-k-scale-value", Number(modelTuningValue("hydraulicConductivityScale")).toFixed(2) + "x");
        setText("map-default-canal-stage-value", Number(modelTuningValue("defaultCanalStageMeters")).toFixed(2) + " m");
      }

      function populateWellSelect() {
        mapControls.wellSelect.innerHTML = "";
        mapScenario.wells.forEach(function (well) {
          const option = document.createElement("option");
          option.value = well.id;
          option.textContent = well.name;
          mapControls.wellSelect.append(option);
        });
      }

      function populateWellfieldSelect() {
        const wellfields = Array.from(new Set(mapScenario.wells.map(function (well) {
          return well.wellfieldId;
        })));
        mapControls.wellfieldSelect.innerHTML = "";
        wellfields.forEach(function (wellfieldId) {
          const option = document.createElement("option");
          const wellCount = mapScenario.wells.filter(function (well) {
            return well.wellfieldId === wellfieldId;
          }).length;
          option.value = wellfieldId;
          option.textContent = wellfieldId + " (" + wellCount + " wells)";
          mapControls.wellfieldSelect.append(option);
        });
      }

      function populateCanalSelect() {
        mapControls.canalSelect.innerHTML = "";
        mapScenario.canals.forEach(function (canal) {
          const option = document.createElement("option");
          option.value = canal.id;
          option.textContent = canal.name;
          mapControls.canalSelect.append(option);
        });
        if (selectedCanalId) mapControls.canalSelect.value = selectedCanalId;
      }

      function updateSelectedCanalPanel() {
        const canal = mapScenario.canals.find(function (candidate) {
          return candidate.id === selectedCanalId;
        }) || mapScenario.canals[0];
        if (!canal) {
          setText("selected-canal-name", "-");
          setText("selected-canal-stage", "-");
          setText("selected-canal-cells", "-");
          return;
        }

        selectedCanalId = canal.id;
        mapControls.canalSelect.value = canal.id;
        setText("selected-canal-name", canal.name);
        setText("selected-canal-stage", formatNumberForPanel(canal.currentStageMeters) + " m");
        setText("selected-canal-cells", formatIntegerForPanel(canal.fixedHeadCellCount));
      }

      function selectWell(wellId) {
        const well = mapScenario.wells.find(function (candidate) {
          return candidate.id === wellId;
        });
        if (!well) return;
        selectedWellId = well.id;
        mapControls.wellSelect.value = well.id;

        document.querySelectorAll("[data-well-id]").forEach(function (element) {
          element.setAttribute("data-selected", element.getAttribute("data-well-id") === well.id ? "true" : "false");
        });
        updatePrioritySelection();

        setText("selected-well-name", well.name);
        setText("selected-well-narrative", selectedRankingRow()?.whyThisWellMatters || "Select a well to see why it matters in this run.");
        renderWellEvidence();
        setText("selected-well-risk", well.riskLevel);
        setText("selected-well-pumping", formatIntegerForPanel(well.pumpingCubicMetersPerDay) + " m3/day");
        setText("selected-well-screen", formatNumberForPanel(well.screenBottomDepthMeters) + " m");
        setText("selected-well-head", formatNumberForPanel(well.localHeadMeters) + " m");
        setText("selected-well-interface", formatNumberForPanel(well.interfaceDepthMeters) + " m");
        setText("selected-well-qcrit", formatIntegerForPanel(well.qCritCubicMetersPerDay) + " m3/day");
        setText("selected-well-ratio", formatNumberForPanel(well.riskRatio));
        setText("selected-risk-change", well.riskLevelBefore + " → " + well.riskLevelAfter);
        setText("selected-head-change", formatSignedNumber(well.localHeadDifferenceMeters, 2, " m"));
        setText("selected-interface-change", formatSignedNumber(well.interfaceDepthDifferenceMeters, 2, " m"));
        setText("selected-qcrit-change", formatSignedInteger(well.qCritDifferenceCubicMetersPerDay, " m3/day"));
        setText("selected-ratio-change", formatSignedNumber(well.riskRatioDifference, 2, ""));
        setText("selected-well-k", formatNumberForPanel(well.localHydraulicConductivityMetersPerDay) + " m/day");
        syncControlLabels();
        repaintLiveMap(mapScenario);
      }

      function setLayerVisibility(layerId, visible) {
        document.querySelectorAll('[data-layer="' + layerId + '"]').forEach(function (element) {
          element.style.display = visible ? "" : "none";
        });
        setLiveMapLayerVisibility(layerId, visible);
      }

      function updateScenarioLabels(result) {
        const statusLabel = result.scenarioStatus === "baseline" ? "Baseline" : "Modified";
        setText("scenario-status-label", statusLabel);
        setText("map-run-status", statusLabel + " scenario");
        renderScenarioPresetButtons(result);
        renderScenarioNarrative(result);
        renderScenarioCompare(result);
        renderWellPriority(result, mapControls.rankingSort?.value || result.wellRiskRanking.defaultSort);
        renderScenarioBriefPrint(result);
        renderWellEvidence();
        if (mapMode === "change") {
          setText(
            "head-range-label",
            "Head change: " +
              (result.comparisonSummary.largestHeadDeclineCellId
                ? formatSignedNumber(result.comparisonSummary.largestHeadDeclineMeters, 2, " m") +
                  " at " +
                  result.comparisonSummary.largestHeadDeclineCellId
                : "no decline"),
          );
          setText(
            "interface-range-label",
            "Interface change: " +
              (result.comparisonSummary.largestInterfaceDepthDecreaseCellId
                ? formatSignedNumber(result.comparisonSummary.largestInterfaceDepthDecreaseMeters, 2, " m") +
                  " at " +
                  result.comparisonSummary.largestInterfaceDepthDecreaseCellId
                : "no decrease"),
          );
        } else {
          setText("head-range-label", "Head: " + formatNumberForPanel(result.ranges.headMeters.min) + " to " + formatNumberForPanel(result.ranges.headMeters.max) + " m");
          setText("interface-range-label", "Interface: " + formatNumberForPanel(result.ranges.interfaceDepthMeters.min) + " to " + formatNumberForPanel(result.ranges.interfaceDepthMeters.max) + " m");
        }
        setText("solver-label", (result.diagnostics.converged ? "Converged" : "Not converged") + " · " + formatIntegerForPanel(result.diagnostics.iterationCount) + " iterations");
        setText("runtime-label", formatNumberForPanel(result.diagnostics.runTimeMilliseconds, 1) + " ms");
        const warnings = result.diagnostics.warnings || [];
        setText("warning-count-label", formatIntegerForPanel(warnings.length));
        setText("readout-head-range", formatNumberForPanel(result.calibrationReadout.activeHeadRangeMeters.min) + " to " + formatNumberForPanel(result.calibrationReadout.activeHeadRangeMeters.max) + " m");
        setText("readout-interface-range", formatNumberForPanel(result.calibrationReadout.interfaceDepthRangeMeters.min) + " to " + formatNumberForPanel(result.calibrationReadout.interfaceDepthRangeMeters.max) + " m");
        setText("readout-max-drawdown", formatNumberForPanel(result.calibrationReadout.maxDrawdownMeters) + " m");
        setText(
          "readout-highest-risk",
          result.calibrationReadout.highestRiskWellName
            ? result.calibrationReadout.highestRiskWellName + " · " + result.calibrationReadout.highestRiskLevel
            : "-",
        );
        setText("readout-warning-count", formatIntegerForPanel(result.calibrationReadout.warningCount));
        renderAssumptionList(result);
        renderTuningReadout(result);
        renderChangeExplanations(result);
        renderWarningList(result);
        setText("highest-risk-label", result.highestRiskWell ? result.highestRiskWell.name + " · " + result.highestRiskWell.riskLevel : "-");
        setText("worsened-wells-label", formatIntegerForPanel(result.comparisonSummary.worsenedWellCount));
        setText(
          "largest-head-decline-label",
          result.comparisonSummary.largestHeadDeclineCellId
            ? formatSignedNumber(result.comparisonSummary.largestHeadDeclineMeters, 2, " m") +
              " at " +
              result.comparisonSummary.largestHeadDeclineCellId
            : "-",
        );
        setText(
          "largest-interface-decrease-label",
          result.comparisonSummary.largestInterfaceDepthDecreaseCellId
            ? formatSignedNumber(result.comparisonSummary.largestInterfaceDepthDecreaseMeters, 2, " m") +
              " at " +
              result.comparisonSummary.largestInterfaceDepthDecreaseCellId
            : "-",
        );
        setText("map-summary", result.summary);
      }

      function repaintMap(result) {
        result.grid.cells.forEach(function (cell) {
          const headElement = document.querySelector('[data-cell-id="' + cell.id + '"]');
          const interfaceElement = document.querySelector('[data-interface-cell-id="' + cell.id + '"]');
          if (headElement) {
            headElement.setAttribute("fill", mapMode === "change" ? cell.headDifferenceColor : cell.headColor);
          }
          if (interfaceElement) {
            interfaceElement.setAttribute(
              "fill",
              mapMode === "change" ? cell.interfaceDifferenceColor : "#1f6e9a",
            );
            interfaceElement.setAttribute(
              "opacity",
              String(mapMode === "change" ? cell.interfaceDifferenceOpacity : cell.interfaceOpacity),
            );
          }
        });

        result.wells.forEach(function (well) {
          const wellGroup = document.querySelector('[data-well-id="' + well.id + '"]');
          const riskMarker = document.querySelector('[data-risk-well-id="' + well.id + '"]');
          if (wellGroup) {
            wellGroup.setAttribute("aria-label", "Inspect " + well.name + ", " + well.riskLevel + " risk");
            const title = wellGroup.querySelector("title");
            if (title) title.textContent = well.name + " · " + well.riskLevel + " risk";
          }
          if (riskMarker) {
            riskMarker.setAttribute("fill", mapMode === "change" ? well.riskChangeColor : well.riskColor);
          }
        });
        repaintLiveMap(result);
      }

      function setMapMode(nextMode) {
        mapMode = nextMode;
        document.querySelectorAll("[data-map-mode]").forEach(function (button) {
          button.setAttribute("aria-pressed", button.getAttribute("data-map-mode") === mapMode ? "true" : "false");
        });
        repaintMap(mapScenario);
        updateScenarioLabels(mapScenario);
      }

      function renderMapScenario(result) {
        mapScenario = result;
        scenarioState = cloneInput(result.input);
        repaintMap(result);
        updateScenarioLabels(result);
        if (!result.wells.some(function (well) { return well.id === selectedWellId; })) {
          selectedWellId = result.highestRiskWell ? result.highestRiskWell.id : result.wells[0]?.id;
        }
        if (!result.canals.some(function (canal) { return canal.id === selectedCanalId; })) {
          selectedCanalId = result.canals[0]?.id;
        }
        selectWell(selectedWellId);
        updateSelectedCanalPanel();
      }

      async function fetchMapScenario() {
        const sequence = ++requestSequence;
        setRunStatus("Calculating");
        const response = await fetch("/api/map-scenario", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(scenarioState),
        });

        if (!response.ok) {
          setRunStatus("Error");
          throw new Error("Map scenario request failed");
        }

        const result = await response.json();
        if (sequence !== requestSequence) return;
        renderMapScenario(result);
      }

      function scheduleMapScenarioRun() {
        clearTimeout(pendingScenarioTimer);
        pendingScenarioTimer = setTimeout(function () {
          fetchMapScenario().catch(function (error) {
            setText("map-summary", error.message);
          });
        }, 120);
      }

      document.querySelectorAll("[data-toggle-layer]").forEach(function (toggle) {
        toggle.addEventListener("change", function () {
          setLayerVisibility(toggle.getAttribute("data-toggle-layer"), toggle.checked);
        });
        setLayerVisibility(toggle.getAttribute("data-toggle-layer"), toggle.checked);
      });

      document.querySelectorAll("[data-map-mode]").forEach(function (button) {
        button.addEventListener("click", function () {
          setMapMode(button.getAttribute("data-map-mode"));
        });
      });

      mapControls.scenarioPresetList?.addEventListener("click", function (event) {
        let target = event.target;
        if (target && target.nodeType === 3) target = target.parentElement;
        const button = target?.closest?.("[data-scenario-preset-id]");
        if (!button) return;
        applyScenarioPreset(button.getAttribute("data-scenario-preset-id"));
      });

      mapControls.recharge.addEventListener("input", function () {
        markScenarioCustom();
        scenarioState.rechargeMultiplier = Number(mapControls.recharge.value);
        syncControlLabels();
        scheduleMapScenarioRun();
      });

      mapControls.seaLevel.addEventListener("input", function () {
        markScenarioCustom();
        scenarioState.seaLevelRiseMeters = Number(mapControls.seaLevel.value);
        syncControlLabels();
        scheduleMapScenarioRun();
      });

      mapControls.wellSelect.addEventListener("change", function () {
        selectWell(mapControls.wellSelect.value);
      });

      mapControls.rankingSort?.addEventListener("change", function () {
        renderWellPriority(mapScenario, mapControls.rankingSort.value);
        updatePrioritySelection();
      });

      mapControls.printBrief?.addEventListener("click", function () {
        renderScenarioBriefPrint(mapScenario);
        window.print();
      });

      mapControls.pinScenario?.addEventListener("click", function () {
        pinnedScenarioSnapshot = currentScenarioSnapshot(mapScenario);
        storePinnedScenarioSnapshot(pinnedScenarioSnapshot);
        renderScenarioCompare(mapScenario);
      });

      mapControls.wellfieldSelect.addEventListener("change", function () {
        syncControlLabels();
      });

      mapControls.canalSelect.addEventListener("change", function () {
        selectedCanalId = mapControls.canalSelect.value;
        syncControlLabels();
        updateSelectedCanalPanel();
      });

      mapControls.pumping.addEventListener("input", function () {
        if (!selectedWellId) return;
        markScenarioCustom();
        ensureScenarioMaps();
        const pumping = Number(mapControls.pumping.value);
        scenarioState.wellPumpingCubicMetersPerDayById[selectedWellId] = pumping;
        syncControlLabels();
        scheduleMapScenarioRun();
      });

      mapControls.wellfieldPumping.addEventListener("input", function () {
        markScenarioCustom();
        ensureScenarioMaps();
        const wellfieldId = mapControls.wellfieldSelect.value;
        scenarioState.wellfieldPumpingCubicMetersPerDayById[wellfieldId] = Number(mapControls.wellfieldPumping.value);
        syncControlLabels();
        scheduleMapScenarioRun();
      });

      mapControls.canalStage.addEventListener("input", function () {
        if (!selectedCanalId) return;
        markScenarioCustom();
        ensureScenarioMaps();
        scenarioState.canalStageMetersById[selectedCanalId] = Number(mapControls.canalStage.value);
        syncControlLabels();
        scheduleMapScenarioRun();
      });

      function updateModelTuning(key, value) {
        markScenarioCustom();
        ensureScenarioMaps();
        scenarioState.modelTuning[key] = value;
        syncControlLabels();
        scheduleMapScenarioRun();
      }

      mapControls.initialHead.addEventListener("input", function () {
        updateModelTuning("initialHeadMeters", Number(mapControls.initialHead.value));
      });

      mapControls.gradient.addEventListener("input", function () {
        updateModelTuning("regionalGradientMetersPerKilometer", Number(mapControls.gradient.value));
      });

      mapControls.baseRecharge.addEventListener("input", function () {
        updateModelTuning("baseRechargeMillimetersPerYear", Number(mapControls.baseRecharge.value));
      });

      mapControls.kScale.addEventListener("input", function () {
        updateModelTuning("hydraulicConductivityScale", Number(mapControls.kScale.value));
      });

      mapControls.defaultCanalStage.addEventListener("input", function () {
        updateModelTuning("defaultCanalStageMeters", Number(mapControls.defaultCanalStage.value));
      });

      mapControls.reset.addEventListener("click", function () {
        applyScenarioPreset("baseline");
      });

      document.querySelectorAll("[data-well-id]").forEach(function (wellMarker) {
        wellMarker.addEventListener("click", function () {
          selectWell(wellMarker.getAttribute("data-well-id"));
        });
        wellMarker.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectWell(wellMarker.getAttribute("data-well-id"));
          }
        });
      });

      initializeAccordions();
      populateWellSelect();
      populateWellfieldSelect();
      populateCanalSelect();
      pinnedScenarioSnapshot = loadPinnedScenarioSnapshot();
      syncControlLabels();
      updateScenarioLabels(mapScenario);
      selectWell(mapScenario.highestRiskWell ? mapScenario.highestRiskWell.id : mapScenario.wells[0]?.id);
      updateSelectedCanalPanel();
      initializeLiveMap();
    </script>
  </body>
</html>`;

export async function handleCheckpointRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  try {
    const staticPngAsset = staticPngAssets.get(url.pathname);
    if (request.method === "GET" && staticPngAsset) {
      await sendPng(response, staticPngAsset);
      return;
    }

    if (request.method === "GET" && url.pathname === "/") {
      sendHtml(response, marketingHtml);
      return;
    }

    if (request.method === "GET" && url.pathname === "/checkpoint") {
      sendHtml(response, checkpointHtml);
      return;
    }

    if (request.method === "GET" && url.pathname === "/map") {
      sendHtml(response, mapShellHtml);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/map-shell") {
      sendJson(response, 200, mapShellViewModel);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/map-scenario") {
      sendJson(response, 200, mapScenarioViewModel);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/map-scenario") {
      const body = await readRequestBody(request);
      const input = body.length > 0 ? (JSON.parse(body) as MapScenarioInput) : {};
      sendJson(response, 200, buildMapScenarioViewModel({ input }));
      return;
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/api/scenario" || url.pathname === "/api/checkpoint")
    ) {
      sendJson(response, 200, runCheckpointScenario());
      return;
    }

    if (
      request.method === "POST" &&
      (url.pathname === "/api/scenario" || url.pathname === "/api/checkpoint")
    ) {
      const body = await readRequestBody(request);
      const input = body.length > 0 ? (JSON.parse(body) as CheckpointScenarioInput) : {};
      sendJson(response, 200, runCheckpointScenario(input));
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
}

export function createCheckpointServer() {
  return createServer(handleCheckpointRequest);
}

const isDirectRun = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const server = createCheckpointServer();

  server.on("error", (error) => {
    console.error(`Unable to start Halocline Stage 1 checkpoint on http://${host}:${port}.`);
    if ("code" in error && error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the existing dev server and run npm run dev again.`);
    }
    console.error(error);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    console.log(`Halocline Stage 1 checkpoint running at http://${host}:${port}`);
  });
}
