import type { GridCell } from "./types.ts";

export function isFixedHeadCell(cell: GridCell): boolean {
  return cell.fixedHeadMeters !== undefined;
}

export function fixedHeadOrNull(cell: GridCell): number | null {
  return cell.fixedHeadMeters ?? null;
}
