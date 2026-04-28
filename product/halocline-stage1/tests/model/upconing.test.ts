import test from "node:test";
import assert from "node:assert/strict";

import { classifyRisk, computeUpconingRisk } from "../../src/lib/model/upconing.ts";

function assertApproxEqual(actual: number, expected: number, tolerance = 1e-6): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("computes critical pumping threshold for the Stage 1 reference example", () => {
  const result = computeUpconingRisk({
    pumpingCubicMetersPerDay: 1000,
    localHydraulicConductivityMetersPerDay: 50,
    wellScreenBottomDepthMeters: 0,
    interfaceDepthMeters: 30,
    densityContrastRatio: 0.025,
  });

  assert.equal(result.dMeters, 30);
  assert.equal(result.zCritMeters, 9);
  assertApproxEqual(result.qCritCubicMetersPerDay, 2120.5750411731105);
});

test("classifies 5000 cubic meters per day as critical against the reference threshold", () => {
  const result = computeUpconingRisk({
    pumpingCubicMetersPerDay: 5000,
    localHydraulicConductivityMetersPerDay: 50,
    wellScreenBottomDepthMeters: 0,
    interfaceDepthMeters: 30,
    densityContrastRatio: 0.025,
  });

  assert.equal(result.riskLevel, "critical");
  assert.ok(result.riskRatio >= 1);
});

test("classifies risk ratios at the selected thresholds", () => {
  assert.equal(classifyRisk(0.49), "low");
  assert.equal(classifyRisk(0.5), "moderate");
  assert.equal(classifyRisk(0.74), "moderate");
  assert.equal(classifyRisk(0.75), "high");
  assert.equal(classifyRisk(0.99), "high");
  assert.equal(classifyRisk(1), "critical");
  assert.equal(classifyRisk(Infinity), "critical");
});

test("interface at the well screen returns critical risk with zero critical pumping", () => {
  const result = computeUpconingRisk({
    pumpingCubicMetersPerDay: 100,
    localHydraulicConductivityMetersPerDay: 50,
    wellScreenBottomDepthMeters: 30,
    interfaceDepthMeters: 30,
  });

  assert.equal(result.dMeters, 0);
  assert.equal(result.zCritMeters, 0);
  assert.equal(result.qCritCubicMetersPerDay, 0);
  assert.equal(result.riskRatio, Infinity);
  assert.equal(result.riskLevel, "critical");
});

test("interface above the well screen returns critical risk with zero critical pumping", () => {
  const result = computeUpconingRisk({
    pumpingCubicMetersPerDay: 100,
    localHydraulicConductivityMetersPerDay: 50,
    wellScreenBottomDepthMeters: 35,
    interfaceDepthMeters: 30,
  });

  assert.equal(result.dMeters, -5);
  assert.equal(result.zCritMeters, 0);
  assert.equal(result.qCritCubicMetersPerDay, 0);
  assert.equal(result.riskRatio, Infinity);
  assert.equal(result.riskLevel, "critical");
});
