import test from "node:test";
import assert from "node:assert/strict";

import {
  estimateInterfaceDepthFromHead,
  interfaceDepthFromHead,
} from "../../src/lib/model/ghybenHerzberg.ts";

function assertApproxEqual(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("converts 0.8 m of freshwater head to about 32 m of interface depth", () => {
  assertApproxEqual(
    interfaceDepthFromHead({
      freshwaterHeadMeters: 0.8,
      seaLevelMeters: 0,
    }),
    32,
  );
});

test("converts 0.55 m of freshwater head to about 22 m of interface depth", () => {
  assertApproxEqual(
    interfaceDepthFromHead({
      freshwaterHeadMeters: 0.55,
      seaLevelMeters: 0,
    }),
    22,
  );
});

test("raised sea level reduces relative head and interface depth", () => {
  assertApproxEqual(
    interfaceDepthFromHead({
      freshwaterHeadMeters: 0.8,
      seaLevelMeters: 0.2,
    }),
    24,
  );
});

test("negative relative head returns zero interface depth", () => {
  assert.equal(
    interfaceDepthFromHead({
      freshwaterHeadMeters: 0.1,
      seaLevelMeters: 0.2,
    }),
    0,
  );
});

test("interface depth clamps at the aquifer base", () => {
  const estimate = estimateInterfaceDepthFromHead({
    freshwaterHeadMeters: 2,
    seaLevelMeters: 0,
    aquiferBaseDepthMeters: 60,
  });

  assert.equal(estimate.depthMeters, 60);
  assert.equal(estimate.unclampedDepthMeters, 80);
  assert.equal(estimate.clampedAtAquiferBase, true);
  assert.equal(estimate.invertedFreshwaterLens, false);
});

test("negative relative head marks freshwater-lens inversion", () => {
  const estimate = estimateInterfaceDepthFromHead({
    freshwaterHeadMeters: 0.1,
    seaLevelMeters: 0.2,
    aquiferBaseDepthMeters: 60,
  });

  assert.equal(estimate.depthMeters, 0);
  assert.equal(estimate.clampedAtAquiferBase, false);
  assert.equal(estimate.invertedFreshwaterLens, true);
});
