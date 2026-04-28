import test from "node:test";
import assert from "node:assert/strict";

import { createScenarioStore } from "../../src/lib/state/scenarioStore.ts";

test("scenario state represents recharge, sea-level, pumping, and canal-stage changes", () => {
  const store = createScenarioStore();

  store.setRechargeMultiplier(1.15);
  store.setSeaLevelRiseMeters(0.35);
  store.setWellPumpingCubicMetersPerDay("well-a1", 5000);
  store.setCanalStageMeters("canal-primary", 0.75);

  const { currentScenario } = store.getState();

  assert.equal(currentScenario.rechargeMultiplier, 1.15);
  assert.equal(currentScenario.seaLevelRiseMeters, 0.35);
  assert.deepEqual(currentScenario.pumpingAdjustments, [
    {
      targetType: "well",
      targetId: "well-a1",
      pumpingCubicMetersPerDay: 5000,
    },
  ]);
  assert.deepEqual(currentScenario.canalStageAdjustments, [
    {
      canalId: "canal-primary",
      stageMeters: 0.75,
    },
  ]);
});

test("scenario store upserts pumping and canal-stage changes", () => {
  const store = createScenarioStore();

  store.setWellPumpingCubicMetersPerDay("well-a1", 4000);
  store.setWellPumpingCubicMetersPerDay("well-a1", 5000);
  store.setCanalStageMeters("canal-primary", 0.65);
  store.setCanalStageMeters("canal-primary", 0.8);

  const { currentScenario } = store.getState();

  assert.equal(currentScenario.pumpingAdjustments.length, 1);
  assert.equal(currentScenario.pumpingAdjustments[0]?.pumpingCubicMetersPerDay, 5000);
  assert.equal(currentScenario.canalStageAdjustments.length, 1);
  assert.equal(currentScenario.canalStageAdjustments[0]?.stageMeters, 0.8);
});

test("scenario store resets to baseline", () => {
  const store = createScenarioStore();

  store.setRechargeMultiplier(0.9);
  store.setSeaLevelRiseMeters(0.5);
  store.resetToBaseline();

  const { currentScenario } = store.getState();

  assert.equal(currentScenario.id, "baseline");
  assert.equal(currentScenario.rechargeMultiplier, 1);
  assert.equal(currentScenario.seaLevelRiseMeters, 0);
  assert.deepEqual(currentScenario.pumpingAdjustments, []);
  assert.deepEqual(currentScenario.canalStageAdjustments, []);
});
