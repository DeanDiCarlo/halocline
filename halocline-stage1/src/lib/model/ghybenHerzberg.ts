export type InterfaceDepthFromHeadParams = {
  freshwaterHeadMeters: number;
  seaLevelMeters: number;
  aquiferBaseDepthMeters?: number;
  rhoFreshKgPerCubicMeter?: number;
  rhoSaltKgPerCubicMeter?: number;
};

export type InterfaceDepthEstimate = {
  depthMeters: number;
  unclampedDepthMeters: number;
  relativeHeadMeters: number;
  clampedAtAquiferBase: boolean;
  invertedFreshwaterLens: boolean;
};

export function estimateInterfaceDepthFromHead(
  params: InterfaceDepthFromHeadParams,
): InterfaceDepthEstimate {
  const rhoFreshKgPerCubicMeter = params.rhoFreshKgPerCubicMeter ?? 1000;
  const rhoSaltKgPerCubicMeter = params.rhoSaltKgPerCubicMeter ?? 1025;
  const relativeHeadMeters = params.freshwaterHeadMeters - params.seaLevelMeters;
  const multiplier =
    rhoFreshKgPerCubicMeter / (rhoSaltKgPerCubicMeter - rhoFreshKgPerCubicMeter);
  const unclampedDepthMeters = Math.max(0, multiplier * relativeHeadMeters);
  const aquiferBaseDepthMeters = params.aquiferBaseDepthMeters;
  const hasAquiferBase =
    aquiferBaseDepthMeters !== undefined &&
    Number.isFinite(aquiferBaseDepthMeters) &&
    aquiferBaseDepthMeters >= 0;
  const depthMeters = hasAquiferBase
    ? Math.min(unclampedDepthMeters, aquiferBaseDepthMeters)
    : unclampedDepthMeters;

  return {
    depthMeters,
    unclampedDepthMeters,
    relativeHeadMeters,
    clampedAtAquiferBase: hasAquiferBase && unclampedDepthMeters > aquiferBaseDepthMeters,
    invertedFreshwaterLens: relativeHeadMeters < 0,
  };
}

export function interfaceDepthFromHead(params: InterfaceDepthFromHeadParams): number {
  return estimateInterfaceDepthFromHead(params).depthMeters;
}
