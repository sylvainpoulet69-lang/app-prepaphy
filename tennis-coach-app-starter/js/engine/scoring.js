export function scoreAndSelect(candidates, context, goal) {
  const scored = candidates.map((block) => {
    let score = 0;

    if (block.primaryObjective === goal.mainObjective) score += 9;
    if (block.sessionRole.canBePrimary) score += 3;
    if (goal.sessionRole === "priority_1") score += 2;
    if (goal.freshnessRequirement === block.constraints.minimumFreshness) score += 2;

    return {
      block,
      score,
      decisionFactors: ["starter_scoring"]
    };
  }).sort((a, b) => b.score - a.score);

  return {
    selected: scored[0]?.block || null,
    score: scored[0]?.score || 0,
    runnerUp: scored.slice(1, 3).map((x) => ({ id: x.block.id, score: x.score })),
    decisionFactors: scored[0]?.decisionFactors || []
  };
}

export function scoreAndSelectSecondary(candidates, mainBlock) {
  if (!candidates.length) return { selected: null, score: 0, runnerUp: [], decisionFactors: [] };
  return {
    selected: candidates[0],
    score: 1,
    runnerUp: candidates.slice(1, 3).map((x) => ({ id: x.id, score: 0 })),
    decisionFactors: ["starter_secondary"]
  };
}

export function scoreAndSelectTransfer(candidates, mainBlock) {
  if (!candidates.length) return { selected: null, score: 0, runnerUp: [], decisionFactors: [] };
  return {
    selected: candidates[0],
    score: 1,
    runnerUp: candidates.slice(1, 3).map((x) => ({ id: x.id, score: 0 })),
    decisionFactors: ["starter_transfer"]
  };
}
