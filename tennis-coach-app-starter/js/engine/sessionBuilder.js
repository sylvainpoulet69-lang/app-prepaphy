import { selectTodayGoal } from "./goals.js";
import { getCandidateBlocks } from "./candidates.js";
import { hardFilter } from "./filters.js";
import { scoreAndSelect, scoreAndSelectSecondary, scoreAndSelectTransfer } from "./scoring.js";
import { estimateLoad } from "./load.js";
import { explainDecision } from "./explain.js";

const LOAD_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const FRESHNESS_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const DURATION_TEMPLATES = {
  45: { opening: 8, activation: 5, main: 22, secondary: 5, transfer: 6, finish: 4 },
  60: { opening: 10, activation: 6, main: 32, secondary: 6, transfer: 6, finish: 6 },
  90: { opening: 12, activation: 8, main: 54, secondary: 8, transfer: 8, finish: 8 }
};

function getFreshnessBucket(readiness) {
  if (!readiness) return "moderate";

  if (
    readiness.painLevel >= 3 ||
    readiness.fatigueLevel >= 4 ||
    readiness.muscleSoreness >= 4 ||
    readiness.readinessScore <= 2
  ) {
    return "low";
  }

  if (
    readiness.fatigueLevel >= 3 ||
    readiness.muscleSoreness >= 3 ||
    readiness.readinessScore === 3
  ) {
    return "moderate";
  }

  return "high";
}

function getBlockCompatibility(leftBlock, rightBlock) {
  if (!leftBlock || !rightBlock) return 0;

  const leftAvoid = leftBlock.compatibility?.avoidWith || [];
  const rightAvoid = rightBlock.compatibility?.avoidWith || [];
  if (leftAvoid.includes(rightBlock.id) || rightAvoid.includes(leftBlock.id)) {
    return 0;
  }

  const leftGood = leftBlock.compatibility?.goodWith || [];
  const rightGood = rightBlock.compatibility?.goodWith || [];
  if (leftGood.includes(rightBlock.id) || rightGood.includes(leftBlock.id)) {
    return 1;
  }

  const leftCaution = leftBlock.compatibility?.cautionWith || [];
  const rightCaution = rightBlock.compatibility?.cautionWith || [];
  if (leftCaution.includes(rightBlock.id) || rightCaution.includes(leftBlock.id)) {
    return 0.5;
  }

  return 0.75;
}

function isOpeningFriendly(block) {
  if (!block) return false;

  const recommended = block.sessionRole?.recommendedPosition || [];
  const freshnessCost = block.loadProfile?.freshnessCost || "moderate";
  const neuralStress = block.dominantStress?.neural || "low";

  return recommended.includes("start") && freshnessCost !== "very_high" && neuralStress !== "very_high";
}

function inferPhaseType(block, fallbackType) {
  if (!block) return fallbackType;

  if (block.primaryObjective === "support_recovery" || block.family === "prevention") return "finish";
  if (block.sessionRole?.canBeTransfer) return "transfer";
  if (block.family === "coordination") return "activation";
  if (isOpeningFriendly(block) && block.loadProfile?.estimatedInternalLoad === "low") return "activation";
  return fallbackType;
}

function createPhase(type, block = null, options = {}) {
  const phaseLabels = {
    opening: "Ouverture / warm-up",
    activation: "Activation / coordination",
    main: "Bloc principal",
    secondary: "Bloc secondaire",
    transfer: "Transfert tennis",
    finish: "Fin / prévention"
  };

  return {
    type,
    label: phaseLabels[type],
    block,
    isMandatory: type === "opening" || type === "main",
    notes: options.notes || []
  };
}

function normalizeDuration(durationMin) {
  return DURATION_TEMPLATES[durationMin] ? durationMin : 60;
}

function buildPhases(parts, context) {
  const phases = [
    createPhase("opening", null, {
      notes: [
        "Toujours prévoir une montée progressive avant les blocs sélectionnés."
      ]
    })
  ];

  const secondaryPhaseType = inferPhaseType(parts.secondaryBlock, "secondary");
  const finishPhaseType = inferPhaseType(parts.finishBlock, "finish");

  const preMainBlock = secondaryPhaseType === "activation" ? parts.secondaryBlock : null;
  const postMainSecondary = secondaryPhaseType === "secondary" ? parts.secondaryBlock : null;
  const transferBlock = parts.transferBlock || null;
  const finishBlock = finishPhaseType === "finish" ? parts.finishBlock : null;

  if (preMainBlock) {
    phases.push(createPhase("activation", preMainBlock));
  } else if (context?.goal?.sessionRole === "activation") {
    phases.push(createPhase("activation", null, {
      notes: ["Accent sur coordination légère et préparation spécifique avant le bloc principal."]
    }));
  }

  phases.push(createPhase("main", parts.mainBlock));

  if (postMainSecondary) {
    phases.push(createPhase("secondary", postMainSecondary));
  }

  if (transferBlock) {
    phases.push(createPhase("transfer", transferBlock));
  }

  if (finishBlock) {
    phases.push(createPhase("finish", finishBlock));
  }

  return phases;
}

function allocatePhaseDurations(phases, durationMin) {
  const normalizedDuration = normalizeDuration(durationMin);
  const template = DURATION_TEMPLATES[normalizedDuration];
  const presentTypes = new Set(phases.map((phase) => phase.type));
  const allocations = {};
  let allocatedTotal = 0;

  for (const phase of phases) {
    const templateValue = template[phase.type] || 0;
    if (phase.block || phase.isMandatory) {
      allocations[phase.type] = templateValue;
      allocatedTotal += templateValue;
    }
  }

  let remaining = normalizedDuration - allocatedTotal;

  if (!presentTypes.has("activation") && remaining > 0) {
    allocations.main = (allocations.main || 0) + Math.min(remaining, normalizedDuration === 90 ? 6 : 4);
    remaining = normalizedDuration - Object.values(allocations).reduce((sum, value) => sum + value, 0);
  }

  if (!presentTypes.has("secondary") && remaining > 0) {
    allocations.main = (allocations.main || 0) + Math.min(remaining, normalizedDuration === 45 ? 4 : 6);
    remaining = normalizedDuration - Object.values(allocations).reduce((sum, value) => sum + value, 0);
  }

  if (!presentTypes.has("transfer") && remaining > 0) {
    allocations.main = (allocations.main || 0) + Math.min(remaining, normalizedDuration === 90 ? 8 : 4);
    remaining = normalizedDuration - Object.values(allocations).reduce((sum, value) => sum + value, 0);
  }

  if (!presentTypes.has("finish") && remaining > 0) {
    allocations.main = (allocations.main || 0) + remaining;
    remaining = 0;
  }

  if (remaining > 0) {
    allocations.main = (allocations.main || 0) + remaining;
  }

  return phases.map((phase) => ({
    ...phase,
    targetDurationMin: allocations[phase.type] || 0
  }));
}

function getOrderedBlocks(phases) {
  return phases.filter((phase) => phase.block).map((phase) => phase.block);
}

export function canAddSecondary(mainBlock, context, goal) {
  if (!mainBlock) return false;

  const availableDuration = context.readiness?.availabilityMinutes || 60;
  const freshness = getFreshnessBucket(context.readiness);
  const mainFreshnessNeed = mainBlock.constraints?.minimumFreshness || "low";
  const mainWeeklyCost = LOAD_ORDER[mainBlock.loadProfile?.weeklyCost || "moderate"];
  const mainInternalLoad = LOAD_ORDER[mainBlock.loadProfile?.estimatedInternalLoad || "moderate"];
  const mainFreshnessCost = LOAD_ORDER[mainBlock.loadProfile?.freshnessCost || "moderate"];
  const goalLoad = LOAD_ORDER[goal?.targetLoad || "moderate"];

  const hasEnoughTimeRemaining = availableDuration >= 60;
  const loadRemainsCoherent = mainWeeklyCost <= goalLoad && mainInternalLoad <= LOAD_ORDER.high;
  const readinessStillAllowsQuality = FRESHNESS_ORDER[freshness] >= FRESHNESS_ORDER[mainFreshnessNeed];
  const mainCanAcceptPairing = mainFreshnessCost < LOAD_ORDER.very_high;
  const secondaryAddsValue = goal?.sessionRole !== "recovery";

  return (
    hasEnoughTimeRemaining &&
    loadRemainsCoherent &&
    readinessStillAllowsQuality &&
    mainCanAcceptPairing &&
    secondaryAddsValue
  );
}

export function getTransferCandidates(mainBlock, context, blockLibrary) {
  if (!mainBlock) return [];

  const availableDuration = context.readiness?.availabilityMinutes || 60;
  const freshness = getFreshnessBucket(context.readiness);
  const sourceBlocks = Array.isArray(blockLibrary)
    ? blockLibrary
    : (blockLibrary?.transferCandidates || []);

  return sourceBlocks.filter((block) => {
    if (!block?.sessionRole?.canBeTransfer) return false;
    if (block.id === mainBlock.id) return false;
    if (block.sportContext !== "tennis_specific") return false;
    if (availableDuration < 60) return false;
    if (goalWouldBeUnderminedByTransfer(mainBlock, block)) return false;
    if (FRESHNESS_ORDER[freshness] < FRESHNESS_ORDER[block.constraints?.minimumFreshness || "low"]) {
      return false;
    }

    return getBlockCompatibility(mainBlock, block) > 0;
  });
}

function goalWouldBeUnderminedByTransfer(mainBlock, transferBlock) {
  const compatibilityScore = getBlockCompatibility(mainBlock, transferBlock);
  const transferLoad = LOAD_ORDER[transferBlock.loadProfile?.estimatedInternalLoad || "moderate"];
  const mainFreshnessCost = LOAD_ORDER[mainBlock.loadProfile?.freshnessCost || "moderate"];

  if (compatibilityScore <= 0) return true;
  if (mainFreshnessCost >= LOAD_ORDER.high && transferLoad >= LOAD_ORDER.high) return true;

  return false;
}

export function selectFinishBlock(context, candidateSet) {
  return candidateSet.supportCandidates?.[0] || null;
}

export function assembleSession(parts, envelope, context = {}) {
  const phases = buildPhases(parts, { ...context, goal: envelope.goal });
  const orderedBlocks = getOrderedBlocks(phases);

  return {
    mainObjective: envelope.goal.mainObjective,
    sessionRole: envelope.goal.sessionRole,
    expectedDurationMin: normalizeDuration(envelope.expectedDurationMin),
    expectedLoad: "moderate",
    freshnessRequirement: envelope.goal.freshnessRequirement,
    transferLevel: parts.transferBlock ? "medium" : "low",
    blocks: orderedBlocks,
    phases,
    explanation: "",
    warnings: [],
    selectionMeta: envelope.selectionMeta || {},
    goalMeta: envelope.goal
  };
}

export function scaleToDuration(sessionPlan, durationMin) {
  const normalizedDuration = normalizeDuration(durationMin);
  const scaledPhases = allocatePhaseDurations(sessionPlan.phases || [], normalizedDuration);
  const blocks = getOrderedBlocks(scaledPhases);

  return {
    ...sessionPlan,
    expectedDurationMin: normalizedDuration,
    phases: scaledPhases,
    blocks,
    scalingNotes: {
      mode: normalizedDuration === 45 ? "compressed" : (normalizedDuration === 90 ? "extended" : "standard"),
      preservedMainDominance: true
    }
  };
}

export function generateSession({ state }) {
  const athlete = state.athletes.find((a) => a.id === state.activeAthleteId);
  const readiness = state.readiness.find((r) => r.athleteId === state.activeAthleteId) || null;
  const context = { athlete, readiness, state };

  const goal = selectTodayGoal(context);
  const candidateSet = getCandidateBlocks(goal, state.blocks);

  const mainFiltered = hardFilter(candidateSet.mainCandidates, context, goal);
  const mainChoice = scoreAndSelect(mainFiltered.allowed, context, goal);
  const mainBlock = mainChoice.selected;

  const secondaryChoice = canAddSecondary(mainBlock, context, goal)
    ? scoreAndSelectSecondary(candidateSet.secondaryCandidates, mainBlock, context, goal)
    : { selected: null, score: 0, runnerUp: [], decisionFactors: [] };
  const secondaryBlock = secondaryChoice.selected;

  const transferChoice = scoreAndSelectTransfer(
    getTransferCandidates(mainBlock, context, candidateSet),
    mainBlock,
    context,
    goal
  );
  const transferBlock = transferChoice.selected;
  const finishBlock = selectFinishBlock(context, candidateSet);

  let session = assembleSession(
    { mainBlock, secondaryBlock, transferBlock, finishBlock },
    {
      expectedDurationMin: readiness?.availabilityMinutes || 60,
      goal,
      selectionMeta: {
        mainChoice,
        secondaryChoice,
        transferChoice,
        rejectedMainBlocks: mainFiltered.rejected
      }
    },
    context
  );

  session = scaleToDuration(session, readiness?.availabilityMinutes || 60);
  session.expectedLoad = estimateLoad(session, context);
  session.explanation = explainDecision(session, context, mainFiltered.rejected);

  return session;
}
