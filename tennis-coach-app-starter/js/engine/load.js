export function estimateLoad(sessionPlan) {
  const blockCount = sessionPlan.blocks.length;
  if (sessionPlan.expectedDurationMin <= 45) return "low";
  if (blockCount <= 2) return "moderate";
  if (blockCount <= 4) return "moderate";
  return "high";
}
