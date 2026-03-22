import { selectTodayGoal } from "./goals.js";
import { getCandidateBlocks } from "./candidates.js";
import { hardFilter } from "./filters.js";
import { scoreAndSelect, scoreAndSelectSecondary, scoreAndSelectTransfer } from "./scoring.js";
import { estimateLoad } from "./load.js";
import { explainDecision } from "./explain.js";

const LOAD_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const FRESHNESS_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };

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

export function assembleSession(parts, envelope) {
  const blocks = [parts.mainBlock, parts.secondaryBlock, parts.transferBlock, parts.finishBlock].filter(Boolean);
  return {
    mainObjective: envelope.goal.mainObjective,
    sessionRole: envelope.goal.sessionRole,
    expectedDurationMin: envelope.expectedDurationMin,
    expectedLoad: "moderate",
    freshnessRequirement: envelope.goal.freshnessRequirement,
    transferLevel: parts.transferBlock ? "medium" : "low",
    blocks,
    explanation: "",
    warnings: []
  };
}

export function scaleToDuration(sessionPlan, durationMin) {
  sessionPlan.expectedDurationMin = durationMin;
  if (durationMin === 45 && sessionPlan.blocks.length > 3) {
    sessionPlan.blocks = sessionPlan.blocks.slice(0, 3);
  }
  return sessionPlan;
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

  const secondaryBlock = canAddSecondary(mainBlock, context, goal)
    ? scoreAndSelectSecondary(candidateSet.secondaryCandidates, mainBlock, context, goal).selected
    : null;

  const transferBlock = scoreAndSelectTransfer(
    getTransferCandidates(mainBlock, context, candidateSet),
    mainBlock,
    context,
    goal
  ).selected;
  const finishBlock = selectFinishBlock(context, candidateSet);

  let session = assembleSession(
    { mainBlock, secondaryBlock, transferBlock, finishBlock },
    { expectedDurationMin: readiness?.availabilityMinutes || 60, goal }
  );

  session = scaleToDuration(session, readiness?.availabilityMinutes || 60);
  session.expectedLoad = estimateLoad(session);
  session.explanation = explainDecision(session, context, mainFiltered.rejected);

  return session;
}
