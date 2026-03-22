function formatDecisionFlags(goal, context) {
  const flags = goal?.decisionFlags || [];
  const readiness = context.readiness || {};

  if (flags.includes("safety_first")) {
    return "Objectif du jour choisi en priorité pour protéger l'athlète, avec un état du jour dégradé (douleur/fatigue élevées).";
  }

  if (flags.includes("pre_competition_activation")) {
    return "Objectif du jour orienté activation car un événement est proche, afin de préparer sans ajouter une fatigue inutile.";
  }

  if (flags.includes("weekly_priority_2")) {
    return "Objectif du jour basculé sur la priorité 2 car elle restait au moins aussi peu couverte que la priorité 1 dans la semaine.";
  }

  if (flags.includes("weekly_priority_1")) {
    return "Objectif du jour maintenu sur la priorité 1 hebdomadaire, cohérente avec le profil et la couverture recherchée cette semaine.";
  }

  if (readiness.readinessScore !== undefined) {
    return `Objectif du jour choisi à partir de l'état du jour (readiness ${readiness.readinessScore}/5), des priorités hebdomadaires et de la proximité compétitive.`;
  }

  return "Objectif du jour choisi à partir du contexte athlète, des priorités hebdomadaires et du calendrier.";
}

function formatMainBlockReason(sessionPlan) {
  const mainBlock = (sessionPlan.phases || []).find((phase) => phase.type === "main")?.block;
  const mainChoice = sessionPlan.selectionMeta?.mainChoice || {};

  if (!mainBlock) {
    return "Aucun bloc principal n'a pu être retenu après filtrage.";
  }

  const factors = (mainChoice.decisionFactors || []).slice(0, 3).join(", ");
  const runnerUp = mainChoice.runnerUp?.[0];
  const margin = runnerUp ? (mainChoice.score - runnerUp.score).toFixed(1) : null;

  let sentence = `Le bloc principal retenu est ${mainBlock.name} car il répond directement à l'objectif ${sessionPlan.mainObjective}`;
  if (factors) {
    sentence += `, avec des facteurs forts sur ${factors}`;
  }
  if (margin) {
    sentence += `, et une avance de ${margin} point(s) sur le meilleur concurrent`;
  }

  return `${sentence}.`;
}

function formatOptionalBlocksReason(sessionPlan) {
  const secondaryPhase = (sessionPlan.phases || []).find((phase) => phase.type === "secondary" || phase.type === "activation");
  const transferPhase = (sessionPlan.phases || []).find((phase) => phase.type === "transfer");
  const finishPhase = (sessionPlan.phases || []).find((phase) => phase.type === "finish");
  const secondaryChoice = sessionPlan.selectionMeta?.secondaryChoice || {};
  const transferChoice = sessionPlan.selectionMeta?.transferChoice || {};

  const parts = [];

  if (secondaryPhase?.block) {
    const label = secondaryPhase.type === "activation" ? "Un bloc d'activation/coordination" : "Un bloc secondaire";
    const factors = (secondaryChoice.decisionFactors || []).slice(0, 2).join(", ");
    parts.push(`${label} a été ajouté (${secondaryPhase.block.name}) pour enrichir la séance sans prendre le dessus sur le bloc principal${factors ? `, surtout via ${factors}` : ""}.`);
  } else {
    parts.push("Aucun bloc secondaire additionnel n'a été gardé quand il n'apportait pas assez de valeur ou risquait de diluer l'objectif principal.");
  }

  if (transferPhase?.block) {
    const factors = (transferChoice.decisionFactors || []).slice(0, 2).join(", ");
    parts.push(`Le transfert tennis ${transferPhase.block.name} a été ajouté car il restait cohérent avec le bloc principal${factors ? `, avec un signal positif sur ${factors}` : ""}.`);
  } else {
    parts.push("Aucun transfert tennis n'a été ajouté quand le temps, la fraîcheur ou la cohérence avec le bloc principal ne le justifiaient pas.");
  }

  if (finishPhase?.block) {
    parts.push(`La séance se termine par ${finishPhase.block.name} pour garder une fin cohérente orientée prévention/récupération.`);
  }

  return parts.join(" ");
}

function summarizeRejectedConstraints(rejectedBlocks) {
  if (!rejectedBlocks.length) {
    return "Aucune contrainte majeure n'a éliminé les blocs principaux restants.";
  }

  const counts = rejectedBlocks.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});

  const topReasons = Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([reason, count]) => `${reason} x${count}`)
    .join(", ");

  return `Contraintes de filtre les plus pénalisantes aujourd'hui : ${topReasons}.`;
}

export function explainDecision(sessionPlan, context, rejectedBlocks = []) {
  const goalReason = formatDecisionFlags(sessionPlan.goalMeta, context);
  const mainReason = formatMainBlockReason(sessionPlan);
  const optionalReason = formatOptionalBlocksReason(sessionPlan);
  const rejectedReason = summarizeRejectedConstraints(rejectedBlocks);

  return [goalReason, mainReason, optionalReason, rejectedReason].join(" ");
}
