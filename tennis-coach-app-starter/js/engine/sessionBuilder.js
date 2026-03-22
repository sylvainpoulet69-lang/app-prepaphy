import { selectTodayGoal } from "./goals.js";
import { getCandidateBlocks } from "./candidates.js";
import { hardFilter } from "./filters.js";
import { scoreAndSelect, scoreAndSelectSecondary, scoreAndSelectTransfer } from "./scoring.js";
import { estimateLoad } from "./load.js";
import { explainDecision } from "./explain.js";

export function canAddSecondary(mainBlock, context, envelope) {
  return envelope.expectedDurationMin >= 60;
}

export function getTransferCandidates(mainBlock, context, candidateSet) {
  return candidateSet.transferCandidates || [];
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

  const secondaryBlock = canAddSecondary(mainBlock, context, { expectedDurationMin: 60 })
    ? scoreAndSelectSecondary(candidateSet.secondaryCandidates, mainBlock).selected
    : null;

  const transferBlock = scoreAndSelectTransfer(getTransferCandidates(mainBlock, context, candidateSet), mainBlock).selected;
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
