import { baselineScenario } from "../model/baselineScenario.ts";
import type { CanalStageAdjustment, PumpingAdjustment, Scenario } from "../model/types.ts";

export type ScenarioState = {
  baselineScenario: Scenario;
  currentScenario: Scenario;
};

export type ScenarioStore = {
  getState: () => ScenarioState;
  resetToBaseline: () => ScenarioState;
  setRechargeMultiplier: (rechargeMultiplier: number) => ScenarioState;
  setSeaLevelRiseMeters: (seaLevelRiseMeters: number) => ScenarioState;
  setWellPumpingCubicMetersPerDay: (wellId: string, pumpingCubicMetersPerDay: number) => ScenarioState;
  setWellfieldPumpingCubicMetersPerDay: (
    wellfieldId: string,
    pumpingCubicMetersPerDay: number,
  ) => ScenarioState;
  setCanalStageMeters: (canalId: string, stageMeters: number) => ScenarioState;
};

export function createScenarioStore(initialScenario: Scenario = baselineScenario): ScenarioStore {
  let state: ScenarioState = {
    baselineScenario,
    currentScenario: structuredClone(initialScenario),
  };

  function updateScenario(partialScenario: Partial<Scenario>): ScenarioState {
    state = {
      ...state,
      currentScenario: {
        ...state.currentScenario,
        ...partialScenario,
      },
    };
    return state;
  }

  function upsertPumpingAdjustment(adjustment: PumpingAdjustment): ScenarioState {
    const pumpingAdjustments = state.currentScenario.pumpingAdjustments.filter(
      (existing) =>
        existing.targetType !== adjustment.targetType || existing.targetId !== adjustment.targetId,
    );
    pumpingAdjustments.push(adjustment);
    return updateScenario({ pumpingAdjustments });
  }

  function upsertCanalStageAdjustment(adjustment: CanalStageAdjustment): ScenarioState {
    const canalStageAdjustments = state.currentScenario.canalStageAdjustments.filter(
      (existing) => existing.canalId !== adjustment.canalId,
    );
    canalStageAdjustments.push(adjustment);
    return updateScenario({ canalStageAdjustments });
  }

  return {
    getState: () => state,
    resetToBaseline: () => {
      state = {
        baselineScenario,
        currentScenario: structuredClone(state.baselineScenario),
      };
      return state;
    },
    setRechargeMultiplier: (rechargeMultiplier) => updateScenario({ rechargeMultiplier }),
    setSeaLevelRiseMeters: (seaLevelRiseMeters) => updateScenario({ seaLevelRiseMeters }),
    setWellPumpingCubicMetersPerDay: (wellId, pumpingCubicMetersPerDay) =>
      upsertPumpingAdjustment({
        targetType: "well",
        targetId: wellId,
        pumpingCubicMetersPerDay,
      }),
    setWellfieldPumpingCubicMetersPerDay: (wellfieldId, pumpingCubicMetersPerDay) =>
      upsertPumpingAdjustment({
        targetType: "wellfield",
        targetId: wellfieldId,
        pumpingCubicMetersPerDay,
      }),
    setCanalStageMeters: (canalId, stageMeters) =>
      upsertCanalStageAdjustment({
        canalId,
        stageMeters,
      }),
  };
}
