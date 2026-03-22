export function explainDecision(sessionPlan, context, rejectedBlocks = []) {
  const rejectedSummary = rejectedBlocks.length
    ? ` Blocs rejetés: ${rejectedBlocks.map((r) => `${r.blockId} (${r.reason})`).join(", ")}.`
    : "";

  return `Séance choisie avec objectif ${sessionPlan.mainObjective}, rôle ${sessionPlan.sessionRole}, durée ${sessionPlan.expectedDurationMin} min.${rejectedSummary}`;
}
