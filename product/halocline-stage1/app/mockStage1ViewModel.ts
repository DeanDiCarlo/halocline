import { mockStage1Dataset } from "../src/lib/data/mockDataset.ts";
import { baselineScenario } from "../src/lib/model/baselineScenario.ts";
import type { Stage1Dataset } from "../src/lib/model/types.ts";

export type MockStage1ViewModel = {
  domainName: string;
  gridLabel: string;
  wellCount: number;
  canalCount: number;
  activeCellCount: number;
  baselineScenarioName: string;
};

export function loadMockStage1ViewModel(dataset: Stage1Dataset = mockStage1Dataset): MockStage1ViewModel {
  return {
    domainName: dataset.domain.name,
    gridLabel: `${dataset.grid.rowCount} x ${dataset.grid.colCount}`,
    wellCount: dataset.wells.length,
    canalCount: dataset.canals.length,
    activeCellCount: dataset.grid.cells.filter((cell) => cell.active).length,
    baselineScenarioName: baselineScenario.name,
  };
}
