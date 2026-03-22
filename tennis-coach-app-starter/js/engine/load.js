const LOAD_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const LOAD_LABELS = ["low", "moderate", "high", "very_high"];

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
