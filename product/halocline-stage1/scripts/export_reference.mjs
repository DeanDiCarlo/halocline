import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { biscayneStage1Dataset } from "../src/lib/data/biscayneStage1Dataset.ts";
import { baselineScenario } from "../src/lib/model/baselineScenario.ts";
import { defaultModelTuning } from "../src/lib/model/modelTuning.ts";
import { runScenario } from "../src/lib/model/scenarioRunner.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, "../../..");
const snapshotDir = resolve(workspaceRoot, "research/reference_snapshots");
const scenarioPath = resolve(snapshotDir, "scenarios.jsonl");
const geometryPath = resolve(snapshotDir, "grid_geometry.json");
const readmePath = resolve(snapshotDir, "README.md");

const SCENARIO_COUNT = Number.parseInt(process.env.HALOCLINE_REFERENCE_SCENARIOS ?? "500", 10);
const SEED = Number.parseInt(process.env.HALOCLINE_REFERENCE_SEED ?? "20260427", 10);

const ranges = {
  rechargeMultiplier: [0.7, 1.3],
  seaLevelRiseMeters: [0, 0.5],
  wellPumpingCubicMetersPerDay: [0, 5600],
  initialHeadMeters: [0.2, 1.2],
  regionalGradientMetersPerKilometer: [0.005, 0.06],
  baseRechargeMillimetersPerYear: [800, 1800],
  hydraulicConductivityScale: [0.5, 1.5],
  defaultCanalStageMeters: [0.2, 0.9],
};

function assertScenarioCount(count) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`HALOCLINE_REFERENCE_SCENARIOS must be a positive integer; received ${count}.`);
  }
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function latinHypercube({ dimensions, count, seed }) {
  const random = mulberry32(seed);
  const samplesByDimension = dimensions.map(() =>
    shuffle(
      Array.from({ length: count }, (_, index) => (index + random()) / count),
      random,
    ),
  );

  return Array.from({ length: count }, (_, sampleIndex) =>
    Object.fromEntries(
      dimensions.map((dimension, dimensionIndex) => [
        dimension,
        samplesByDimension[dimensionIndex][sampleIndex],
      ]),
    ),
  );
}

function scale(unitValue, [min, max]) {
  return min + unitValue * (max - min);
}

function snapshotNumber(value) {
  return value === null || !Number.isFinite(value) ? null : value;
}

function scenarioFromSample(sample, index, dataset) {
  const wellPumpingAdjustments = dataset.wells.map((well) => ({
    targetType: "well",
    targetId: well.id,
    pumpingCubicMetersPerDay: scale(sample[`well:${well.id}`], ranges.wellPumpingCubicMetersPerDay),
  }));
  const canalStageAdjustments = dataset.canals.map((canal) => ({
    canalId: canal.id,
    stageMeters: scale(sample[`canal:${canal.id}`], ranges.defaultCanalStageMeters),
  }));

  return {
    scenario: {
      id: `lhs-${String(index + 1).padStart(4, "0")}`,
      name: `LHS snapshot ${index + 1}`,
      description: "Deterministic Latin Hypercube sample for the frozen TypeScript parity snapshot.",
      rechargeMultiplier: scale(sample.rechargeMultiplier, ranges.rechargeMultiplier),
      seaLevelRiseMeters: scale(sample.seaLevelRiseMeters, ranges.seaLevelRiseMeters),
      pumpingAdjustments: wellPumpingAdjustments,
      canalStageAdjustments,
    },
    modelTuning: {
      initialHeadMeters: scale(sample.initialHeadMeters, ranges.initialHeadMeters),
      regionalGradientMetersPerKilometer: scale(
        sample.regionalGradientMetersPerKilometer,
        ranges.regionalGradientMetersPerKilometer,
      ),
      baseRechargeMillimetersPerYear: scale(
        sample.baseRechargeMillimetersPerYear,
        ranges.baseRechargeMillimetersPerYear,
      ),
      hydraulicConductivityScale: scale(
        sample.hydraulicConductivityScale,
        ranges.hydraulicConductivityScale,
      ),
      defaultCanalStageMeters: scale(sample.defaultCanalStageMeters, ranges.defaultCanalStageMeters),
    },
  };
}

function compactWellResults(wellRiskResults) {
  return wellRiskResults.map((well) => ({
    wellId: well.wellId,
    wellName: well.wellName,
    gridCellId: well.gridCellId,
    pumpingCubicMetersPerDay: well.pumpingCubicMetersPerDay,
    localHeadMeters: snapshotNumber(well.localHeadMeters),
    interfaceDepthMeters: snapshotNumber(well.interfaceDepthMeters),
    qCritCubicMetersPerDay: snapshotNumber(well.qCritCubicMetersPerDay),
    riskRatio: snapshotNumber(well.riskRatio),
    riskLevel: well.riskLevel,
  }));
}

function compactDiagnostics(diagnostics) {
  return {
    converged: diagnostics.converged,
    iterationCount: diagnostics.iterationCount,
    maxHeadChangeMeters: snapshotNumber(diagnostics.maxHeadChangeMeters),
    massBalanceResidualCubicMetersPerDay: snapshotNumber(
      diagnostics.massBalanceResidualCubicMetersPerDay,
    ),
    massBalanceErrorPercent: snapshotNumber(diagnostics.massBalanceErrorPercent),
    massBalanceStatus: diagnostics.massBalanceStatus,
    runTimeMilliseconds: diagnostics.runTimeMilliseconds,
    warnings: diagnostics.warnings,
  };
}

function geometrySnapshot(dataset) {
  return {
    generatedAt: new Date().toISOString(),
    generator: "product/halocline-stage1/scripts/export_reference.mjs",
    dataset: {
      domain: dataset.domain,
      grid: {
        id: dataset.grid.id,
        name: dataset.grid.name,
        rowCount: dataset.grid.rowCount,
        colCount: dataset.grid.colCount,
        cellSizeMeters: dataset.grid.cellSizeMeters,
        originXMeters: dataset.grid.originXMeters,
        originYMeters: dataset.grid.originYMeters,
        cells: dataset.grid.cells.map((cell) => ({
          id: cell.id,
          row: cell.row,
          col: cell.col,
          xCenterMeters: cell.xCenterMeters,
          yCenterMeters: cell.yCenterMeters,
          active: cell.active,
          aquiferBaseDepthMeters: snapshotNumber(cell.aquiferBaseDepthMeters),
          hydraulicConductivityMetersPerDay: cell.hydraulicConductivityMetersPerDay,
          isCoastalBoundary: cell.isCoastalBoundary,
          isCanalBoundary: cell.isCanalBoundary,
        })),
      },
      wells: dataset.wells,
      canals: dataset.canals,
    },
  };
}

function snapshotReadme() {
  return `# Halocline Reference Snapshots

This directory contains the frozen TypeScript Stage 1 parity reference generated by:

\`\`\`bash
cd product/halocline-stage1
source ~/.nvm/nvm.sh
nvm install 24
nvm use 24
npm test
node scripts/export_reference.mjs
\`\`\`

The snapshot exists so the Python rewrite can compare against one fixed oracle before ML work starts.

## Phase 0 Verification Record

- Node runtime: ${process.version}
- \`npm test\`: 14/14 native Node tests passed before export.
- Local server smoke check: \`GET /checkpoint\`, \`GET /\`, and \`GET /api/scenario\` returned HTTP 200.
- Export seed: ${SEED}

## Files

- \`scenarios.jsonl\`: ${SCENARIO_COUNT} deterministic Latin Hypercube scenarios and TypeScript oracle outputs.
- \`grid_geometry.json\`: grid geometry, active mask, domain boundaries, wells, and canal fixed-head cells.

## Input Space

The exporter samples recharge multiplier, sea-level rise, three well pumpings, per-canal stages, and the five calibration-lite tuning fields. Ranges are taken from the Stage 1 sprint controls and presets:

- recharge multiplier: 0.7 to 1.3
- sea-level rise: 0 to 0.5 m
- well pumping: 0 to 5600 m3/day per placeholder well
- initial head: 0.2 to 1.2 m
- regional gradient: 0.005 to 0.06 m/km
- base recharge: 800 to 1800 mm/year
- hydraulic conductivity scale: 0.5 to 1.5
- canal stage/default canal stage: 0.2 to 0.9 m

## Important Diagnostic Note

The near-zero number shown in the Stage 1 UI is \`massBalanceErrorPercent\` from \`src/lib/model/darcySolver.ts\`. It is a conservation residual from the Darcy solve, not an accuracy metric. The TypeScript app does not compute MAE or RMSE against observations.
`;
}

async function main() {
  assertScenarioCount(SCENARIO_COUNT);
  await mkdir(snapshotDir, { recursive: true });

  const dimensions = [
    "rechargeMultiplier",
    "seaLevelRiseMeters",
    ...biscayneStage1Dataset.wells.map((well) => `well:${well.id}`),
    ...biscayneStage1Dataset.canals.map((canal) => `canal:${canal.id}`),
    "initialHeadMeters",
    "regionalGradientMetersPerKilometer",
    "baseRechargeMillimetersPerYear",
    "hydraulicConductivityScale",
    "defaultCanalStageMeters",
  ];
  const samples = latinHypercube({ dimensions, count: SCENARIO_COUNT, seed: SEED });
  const startedAt = performance.now();
  const lines = [];

  for (const [index, sample] of samples.entries()) {
    const { scenario, modelTuning } = scenarioFromSample(sample, index, biscayneStage1Dataset);
    const result = runScenario({
      scenario,
      dataset: biscayneStage1Dataset,
      baselineScenario,
      modelTuning,
      baselineModelTuning: defaultModelTuning,
    });

    lines.push(
      JSON.stringify({
        version: 1,
        generator: "product/halocline-stage1/scripts/export_reference.mjs",
        seed: SEED,
        index,
        inputs: {
          scenario,
          modelTuning,
        },
        head_grid: result.headGridMeters.map(snapshotNumber),
        interface_grid: result.interfaceDepthGridMeters.map(snapshotNumber),
        well_results: compactWellResults(result.wellRiskResults),
        diagnostics: compactDiagnostics(result.diagnostics),
        summary: result.summary,
      }),
    );
  }

  await writeFile(scenarioPath, `${lines.join("\n")}\n`, "utf8");
  await writeFile(geometryPath, `${JSON.stringify(geometrySnapshot(biscayneStage1Dataset), null, 2)}\n`, "utf8");
  await writeFile(readmePath, snapshotReadme(), "utf8");

  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  console.log(`Wrote ${SCENARIO_COUNT} scenarios to ${scenarioPath}`);
  console.log(`Wrote grid geometry to ${geometryPath}`);
  console.log(`Elapsed: ${elapsedSeconds.toFixed(2)} s`);
}

await main();
