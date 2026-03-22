const LOAD_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const LOAD_LABELS = ["low", "moderate", "high", "very_high"];
const LOAD_TO_RPE_ANCHOR = {
  low: 3,
  moderate: 5,
  high: 7,
  very_high: 8
};

function getNumericLoad(value = "moderate") {
  return LOAD_ORDER[value] || LOAD_ORDER.moderate;
}

function getNumericStress(value = "low") {
  return LOAD_ORDER[value] || LOAD_ORDER.low;
}

function getBlockLoadScore(block) {
  const loadProfile = block.loadProfile || {};
  const dominantStress = block.dominantStress || {};

  const profileScore = (
    getNumericLoad(loadProfile.estimatedInternalLoad) +
    getNumericLoad(loadProfile.weeklyCost) +
    getNumericLoad(loadProfile.freshnessCost)
  ) / 3;

  const stressScore = (
    getNumericStress(dominantStress.neural) +
    getNumericStress(dominantStress.metabolic) +
    getNumericStress(dominantStress.mechanical) +
    getNumericStress(dominantStress.cognitive)
  ) / 4;

  return (profileScore * 0.7) + (stressScore * 0.3);
}

function toPositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}

function getPlannedLoadAnchor(sessionPlan = {}) {
  if (toPositiveNumber(sessionPlan.plannedInternalLoad)) {
    return {
      plannedInternalLoad: toPositiveNumber(sessionPlan.plannedInternalLoad),
      source: "planned_internal_load"
    };
  }

  const plannedDurationMin = toPositiveNumber(sessionPlan.expectedDurationMin);
  const plannedRPE = toPositiveNumber(
    sessionPlan.targetSessionRPE ??
    sessionPlan.expectedSessionRPE ??
    sessionPlan.plannedSessionRPE
  );

  if (plannedDurationMin && plannedRPE) {
    return {
      plannedInternalLoad: computeInternalLoad(plannedRPE, plannedDurationMin),
      plannedSessionRPE: plannedRPE,
      source: "planned_duration_x_rpe"
    };
  }

  // V1 fallback: when the session only carries a qualitative load label,
  // anchor comparison on a simple session-RPE estimate to keep the logic explainable.
  if (plannedDurationMin && sessionPlan.expectedLoad) {
    const anchoredRPE = LOAD_TO_RPE_ANCHOR[sessionPlan.expectedLoad] || LOAD_TO_RPE_ANCHOR.moderate;
    return {
      plannedInternalLoad: computeInternalLoad(anchoredRPE, plannedDurationMin),
      plannedSessionRPE: anchoredRPE,
      source: "expected_load_anchor"
    };
  }

  return {
    plannedInternalLoad: 0,
    source: "missing_planned_load"
  };
}

export function estimateLoad(sessionPlan, context = {}) {
  const blocks = sessionPlan.blocks || [];
  const durationMin = sessionPlan.expectedDurationMin || context.readiness?.availabilityMinutes || 60;

  if (!blocks.length) {
    return durationMin <= 45 ? "low" : "moderate";
  }

  const averageBlockScore = blocks.reduce((sum, block) => sum + getBlockLoadScore(block), 0) / blocks.length;
  const highStressBlockCount = blocks.filter((block) => {
    const stress = block.dominantStress || {};
    return [stress.neural, stress.metabolic, stress.mechanical, stress.cognitive].some((value) => getNumericStress(value) >= LOAD_ORDER.high);
  }).length;

  const blockCountFactor = blocks.length >= 4 ? 0.35 : (blocks.length === 3 ? 0.2 : 0.05);
  const densityFactor = durationMin <= 45
    ? blocks.length * 0.15
    : (durationMin >= 90 ? blocks.length * 0.08 : blocks.length * 0.1);
  const durationFactor = durationMin === 45 ? -0.2 : (durationMin === 90 ? 0.25 : 0);
  const stressFactor = highStressBlockCount >= 2 ? 0.35 : (highStressBlockCount === 1 ? 0.15 : 0);

  const sessionScore = averageBlockScore + blockCountFactor + densityFactor + durationFactor + stressFactor;
  const boundedIndex = Math.max(0, Math.min(Math.round(sessionScore) - 1, LOAD_LABELS.length - 1));

  return LOAD_LABELS[boundedIndex];
}

export function computeInternalLoad(rpe, durationMin) {
  const numericRPE = toPositiveNumber(rpe);
  const numericDuration = toPositiveNumber(durationMin);

  return numericRPE * numericDuration;
}

export function comparePlannedVsActualLoad(sessionPlan = {}, feedback = {}) {
  const plannedLoad = getPlannedLoadAnchor(sessionPlan);
  const actualDurationMin = toPositiveNumber(feedback.actualDurationMin);
  const actualSessionRPE = toPositiveNumber(feedback.sessionRPE);
  const actualInternalLoad = toPositiveNumber(feedback.internalLoad) || computeInternalLoad(actualSessionRPE, actualDurationMin);
  const expectedInternalLoad = plannedLoad.plannedInternalLoad;
  const delta = actualInternalLoad - expectedInternalLoad;
  const deltaRatio = expectedInternalLoad > 0 ? delta / expectedInternalLoad : 0;

  // V1 thresholds stay intentionally simple and conservative:
  // within +/-15% of planned load = on target.
  let status = "on_target";
  if (expectedInternalLoad > 0 && deltaRatio > 0.15) {
    status = "overload";
  } else if (expectedInternalLoad > 0 && deltaRatio < -0.15) {
    status = "underload";
  }

  return {
    expectedInternalLoad,
    actualInternalLoad,
    delta,
    deltaRatio,
    status,
    expectedDurationMin: toPositiveNumber(sessionPlan.expectedDurationMin),
    actualDurationMin,
    plannedSessionRPE: plannedLoad.plannedSessionRPE || 0,
    actualSessionRPE,
    source: plannedLoad.source
  };
}
