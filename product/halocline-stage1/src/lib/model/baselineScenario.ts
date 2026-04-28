import type { Scenario } from "./types.ts";

export const baselineScenario: Scenario = {
  id: "baseline",
  name: "Baseline",
  description: "Stage 1 baseline using current pumping, recharge, sea level, and canal stages.",
  rechargeMultiplier: 1,
  seaLevelRiseMeters: 0,
  pumpingAdjustments: [],
  canalStageAdjustments: [],
};
