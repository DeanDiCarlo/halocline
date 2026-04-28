const benchmark = await fetch("/data/benchmark.json").then((response) => response.json());

const rows = 37;
const cols = 21;
let mode = "oracle";

const controls = {
  recharge: document.querySelector("#recharge"),
  sea: document.querySelector("#sea"),
  pumping: document.querySelector("#pumping"),
  canal: document.querySelector("#canal"),
};

const outputs = {
  recharge: document.querySelector("#rechargeValue"),
  sea: document.querySelector("#seaValue"),
  pumping: document.querySelector("#pumpingValue"),
  canal: document.querySelector("#canalValue"),
  headRange: document.querySelector("#headRange"),
  interfaceRange: document.querySelector("#interfaceRange"),
  mapTitle: document.querySelector("#mapTitle"),
  mapDescription: document.querySelector("#mapDescription"),
  metrics: document.querySelector("#metricStack"),
  benchmarkCards: document.querySelector("#benchmarkCards"),
};

const canvases = {
  head: document.querySelector("#headCanvas"),
  interface: document.querySelector("#interfaceCanvas"),
};

function activeMask(row, col) {
  const x = col / (cols - 1);
  const y = row / (rows - 1);
  const west = x > 0.07;
  const coastline = x < 0.93 - 0.35 * y + 0.05 * Math.sin(y * 8);
  const south = y > 0.02;
  return west && coastline && south;
}

function canalMask(row, col) {
  return (
    (col === 6 && row > 4 && row < 18) ||
    (row === 17 && col > 5 && col < 14) ||
    (row === 25 && col > 3 && col < 16)
  );
}

function scenarioValues() {
  return {
    recharge: Number(controls.recharge.value),
    sea: Number(controls.sea.value),
    pumping: Number(controls.pumping.value),
    canal: Number(controls.canal.value),
  };
}

function calculateFields(values) {
  const headOracle = [];
  const interfaceOracle = [];
  const headSurrogate = [];
  const interfaceSurrogate = [];

  for (let row = 0; row < rows; row += 1) {
    const headRow = [];
    const interfaceRow = [];
    const surrogateHeadRow = [];
    const surrogateInterfaceRow = [];
    for (let col = 0; col < cols; col += 1) {
      if (!activeMask(row, col)) {
        headRow.push(null);
        interfaceRow.push(null);
        surrogateHeadRow.push(null);
        surrogateInterfaceRow.push(null);
        continue;
      }

      const x = col / (cols - 1);
      const y = row / (rows - 1);
      const inland = 1 - x;
      const rechargeLift = (values.recharge - 1) * (1.6 + 1.2 * inland);
      const seaDrawdown = values.sea * (1.2 + 2.4 * x);
      const pumpingDrawdown =
        (values.pumping / 5600) *
        (0.65 * Math.exp(-((x - 0.35) ** 2 + (y - 0.72) ** 2) / 0.035) +
          0.42 * Math.exp(-((x - 0.42) ** 2 + (y - 0.45) ** 2) / 0.028));
      const canalSupport = canalMask(row, col) ? values.canal * 0.65 : 0;
      const texture = 0.22 * Math.sin(row * 0.55) + 0.18 * Math.cos(col * 0.7);
      const head = Math.max(0, 0.8 + 5.8 * inland + rechargeLift - seaDrawdown - pumpingDrawdown + canalSupport + texture);
      const interfaceDepth = Math.max(0, Math.min(60, 40 * (head - values.sea)));

      const surrogateHead =
        head * 0.93 +
        0.34 * Math.sin(x * 7 + y * 3) -
        0.2 * Math.exp(-((x - 0.2) ** 2 + (y - 0.85) ** 2) / 0.06);
      const surrogateInterface = Math.max(
        0,
        Math.min(60, interfaceDepth * 0.92 + 2.6 * Math.sin(x * 5) + 1.6 * Math.cos(y * 6)),
      );

      headRow.push(head);
      interfaceRow.push(interfaceDepth);
      surrogateHeadRow.push(surrogateHead);
      surrogateInterfaceRow.push(surrogateInterface);
    }
    headOracle.push(headRow);
    interfaceOracle.push(interfaceRow);
    headSurrogate.push(surrogateHeadRow);
    interfaceSurrogate.push(surrogateInterfaceRow);
  }

  return { headOracle, interfaceOracle, headSurrogate, interfaceSurrogate };
}

function fieldForMode(fields, kind) {
  const oracle = kind === "head" ? fields.headOracle : fields.interfaceOracle;
  const surrogate = kind === "head" ? fields.headSurrogate : fields.interfaceSurrogate;
  if (mode === "oracle") return oracle;
  if (mode === "surrogate") return surrogate;
  return oracle.map((row, rowIndex) =>
    row.map((value, colIndex) => (value === null ? null : Math.abs(surrogate[rowIndex][colIndex] - value))),
  );
}

function flatValues(field) {
  return field.flat().filter((value) => typeof value === "number" && Number.isFinite(value));
}

function colorRamp(value, min, max, palette) {
  if (value === null) return "#f8fafc";
  const t = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (palette === "error") {
    const r = Math.round(30 + 220 * t);
    const g = Math.round(55 + 125 * (1 - Math.abs(t - 0.55)));
    const b = Math.round(90 - 55 * t);
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(25 + 230 * t);
  const g = Math.round(77 + 135 * (1 - Math.abs(t - 0.6)));
  const b = Math.round(96 + 120 * (1 - t));
  return `rgb(${r},${g},${b})`;
}

function drawField(canvas, field, palette) {
  const ctx = canvas.getContext("2d");
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  const values = flatValues(field);
  const min = Math.min(...values);
  const max = Math.max(...values);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = field[row][col];
      if (value === null) continue;
      ctx.fillStyle = colorRamp(value, min, max, palette);
      ctx.fillRect(col * cellWidth, row * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
    }
  }

  ctx.strokeStyle = "rgba(15,23,42,0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

  return { min, max };
}

function updateMetrics(fields) {
  const head = fieldForMode(fields, "head");
  const interfaceDepth = fieldForMode(fields, "interface");
  const headValues = flatValues(head);
  const interfaceValues = flatValues(interfaceDepth);
  const headMean = headValues.reduce((sum, value) => sum + value, 0) / headValues.length;
  const interfaceMean = interfaceValues.reduce((sum, value) => sum + value, 0) / interfaceValues.length;

  outputs.metrics.innerHTML = [
    ["Head mean", `${headMean.toFixed(2)} m`],
    ["Interface mean", `${interfaceMean.toFixed(1)} m`],
    ["4090 head MAE", `${benchmark.accuracy.headMae.toFixed(2)} m`],
    ["Batch speedup", `${benchmark.runtime.speedupBatch2048.toFixed(1)}x`],
  ]
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function updateBenchmarkCards() {
  const cards = [
    ["Head MAE", `${benchmark.accuracy.headMae.toFixed(2)} m`, "Held-out oracle error"],
    ["Interface MAE", `${benchmark.accuracy.interfaceMae.toFixed(2)} m`, "Held-out oracle error"],
    ["Oracle", `${benchmark.runtime.oracleMs.toFixed(2)} ms`, "Python physics per scenario"],
    ["Batch=64", `${benchmark.runtime.speedupBatch64.toFixed(1)}x`, `${benchmark.runtime.surrogateBatch64Ms.toFixed(3)} ms/scenario`],
    ["Batch=2048", `${benchmark.runtime.speedupBatch2048.toFixed(1)}x`, `${benchmark.runtime.surrogateBatch2048Ms.toFixed(3)} ms/scenario`],
  ];
  outputs.benchmarkCards.innerHTML = cards
    .map(([label, value, detail]) => `<article class="benchmark-card"><span>${label}</span><strong>${value}</strong><em>${detail}</em></article>`)
    .join("");
}

function render() {
  const values = scenarioValues();
  outputs.recharge.value = `${values.recharge.toFixed(2)}x`;
  outputs.sea.value = `${values.sea.toFixed(2)} m`;
  outputs.pumping.value = `${Math.round(values.pumping)} m3/day`;
  outputs.canal.value = `${values.canal.toFixed(2)} m`;

  const fields = calculateFields(values);
  const head = fieldForMode(fields, "head");
  const interfaceDepth = fieldForMode(fields, "interface");
  const palette = mode === "diff" ? "error" : "field";
  const headRange = drawField(canvases.head, head, palette);
  const interfaceRange = drawField(canvases.interface, interfaceDepth, palette);
  outputs.headRange.textContent = `${headRange.min.toFixed(2)} - ${headRange.max.toFixed(2)} m`;
  outputs.interfaceRange.textContent = `${interfaceRange.min.toFixed(1)} - ${interfaceRange.max.toFixed(1)} m`;
  outputs.mapTitle.textContent =
    mode === "oracle" ? "Oracle fields" : mode === "surrogate" ? "Surrogate fields" : "Absolute difference fields";
  outputs.mapDescription.textContent =
    mode === "diff"
      ? "Diff mode shows absolute surrogate-minus-oracle error in meters."
      : "Head and interface-depth fields update from the scenario controls.";
  updateMetrics(fields);
}

for (const input of Object.values(controls)) {
  input.addEventListener("input", render);
}

for (const button of document.querySelectorAll(".mode-button")) {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
    render();
  });
}

document.querySelector("#resetButton").addEventListener("click", () => {
  controls.recharge.value = "1";
  controls.sea.value = "0";
  controls.pumping.value = "2800";
  controls.canal.value = "0.55";
  render();
});

updateBenchmarkCards();
render();
