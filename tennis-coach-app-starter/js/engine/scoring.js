const FRESHNESS_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const LEVEL_ORDER = { beginner: 1, intermediate: 2, competitor: 3, advanced: 3 };
const LOAD_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };

const MAIN_WEIGHTS = {
  objective: 3,
  role: 2,
  profile: 3,
  recentHistory: 2,
  readiness: 3,
  duration: 1,
  eventProximity: 2,
  weeklyLoad: 1
};

function getSessionDate(context) {
  return context.readiness?.date || new Date().toISOString().slice(0, 10);
}

function getDaysUntil(dateA, dateB) {
  const a = new Date(`${dateA}T00:00:00Z`);
  const b = new Date(`${dateB}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

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

function getUpcomingEvent(context, sessionDate) {
  const athleteId = context.athlete?.id;
  return (context.state?.events || [])
    .filter((event) => event.athleteId === athleteId && event.isConfirmed !== false)
    .filter((event) => event.startDate >= sessionDate)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))[0] || null;
}

function getCurrentWeek(context, sessionDate) {
  return (
    (context.state?.weeks || []).find(
      (week) =>
        week.athleteId === context.athlete?.id &&
        week.startDate <= sessionDate &&
        week.endDate >= sessionDate
    ) || null
  );
}

function getRecentSessions(context, sessionDate) {
  const athleteId = context.athlete?.id;
  return (context.state?.sessions || []).filter((session) => {
    if (session.athleteId !== athleteId || !session.date || session.date >= sessionDate) {
      return false;
    }

    const daysAgo = getDaysUntil(session.date, sessionDate);
    return daysAgo >= 0 && daysAgo <= 2;
  });
}

function getRecentBlockIds(session) {
  const blockIds = new Set();

  (session.blockIds || []).forEach((id) => blockIds.add(id));
  (session.blocks || []).forEach((block) => {
    if (typeof block === "string") blockIds.add(block);
    if (block?.id) blockIds.add(block.id);
  });

  return blockIds;
}

function getPhysicalProfile(context) {
  return (
    context.state?.physicalProfiles?.find(
      (profile) => profile.athleteId === context.athlete?.id
    ) || null
  );
}

function getCompetitionAllowance(block) {
  if (typeof block.constraints?.allowedNearCompetition === "number") {
    return block.constraints.allowedNearCompetition;
  }

  const restrictions = block.constraints?.eventRestrictions || [];
  const blockedSameOrNextDay = restrictions.some((restriction) =>
    restriction.includes("close") || restriction.includes("fatigue") || restriction.includes("limit")
  );
  const blockedMajorEventWindow = restrictions.some((restriction) => restriction.includes("major_event"));

  if (blockedSameOrNextDay) return 1;
  if (blockedMajorEventWindow) return 2;
  return Number.POSITIVE_INFINITY;
}

function getCompatibilityScore(leftBlock, rightBlock) {
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

function scoreObjectiveMatch(block, goal) {
  if (block.primaryObjective === goal.mainObjective) {
    return 1;
  }

  if ((block.secondaryObjectives || []).includes(goal.mainObjective)) {
    return 0.5;
  }

  return 0;
}

function scoreRoleCoherence(block, goal) {
  if (goal.sessionRole === "recovery") {
    const blockLoad = LOAD_ORDER[block.loadProfile?.estimatedInternalLoad || "moderate"];
    const weeklyCost = LOAD_ORDER[block.loadProfile?.weeklyCost || "moderate"];
    return blockLoad <= LOAD_ORDER.moderate && weeklyCost <= LOAD_ORDER.moderate ? 1 : 0;
  }

  if (goal.sessionRole === "activation") {
    return block.loadProfile?.freshnessCost === "very_high" ? 0 : 1;
  }

  return block.sessionRole?.canBePrimary ? 1 : 0;
}

function scoreProfileCompatibility(block, context, goal) {
  const athleteLevel = LEVEL_ORDER[context.athlete?.level] || LEVEL_ORDER.beginner;
  const minimumLevel = LEVEL_ORDER[block.constraints?.minimumLevel] || LEVEL_ORDER.beginner;

  if (athleteLevel < minimumLevel) {
    return 0;
  }

  let score = 0.6;
  const physicalProfile = getPhysicalProfile(context);
  const athleteProfileType = context.athlete?.profileType;

  if (athleteProfileType === "youth" && block.constraints?.ageRestrictions) {
    score -= 0.1;
  }

  if (physicalProfile) {
    const qualityMap = {
      acceleration: physicalProfile.accelerationLevel,
      max_speed: physicalProfile.speedLevel,
      repeated_sprint: physicalProfile.repeatedSprintLevel,
      aerobic_power: physicalProfile.aerobicLevel,
      power: physicalProfile.powerLevel,
      force_general: physicalProfile.forceLevel,
      coordination: physicalProfile.coordinationLevel,
      tennis_movement: physicalProfile.agilityLevel,
      support_recovery: physicalProfile.robustnessLevel
    };

    const qualityLevel = qualityMap[goal.mainObjective];
    if (typeof qualityLevel === "number") {
      if (qualityLevel <= 2 && block.primaryObjective === goal.mainObjective) score += 0.4;
      else if (qualityLevel === 3) score += 0.2;
    }

    if (physicalProfile.priorityQuality1 === goal.mainObjective && block.primaryObjective === goal.mainObjective) {
      score += 0.2;
    }
  }

  return Math.max(0, Math.min(score, 1));
}

function scoreRecentHistoryCompatibility(block, recentSessions) {
  if (!recentSessions.length) return 1;

  let score = 1;
  for (const session of recentSessions) {
    const recentBlockIds = getRecentBlockIds(session);
    const avoidWith = block.compatibility?.avoidWith || [];

    if (recentBlockIds.has(block.id)) {
      return 0;
    }

    if (avoidWith.some((id) => recentBlockIds.has(id))) {
      score = Math.min(score, 0);
    }

    if (session.mainObjective === block.primaryObjective) {
      score = Math.min(score, 0.25);
    }
  }

  return score;
}

function scoreReadinessCompatibility(block, context, goal) {
  const freshness = getFreshnessBucket(context.readiness);
  const availableFreshness = FRESHNESS_ORDER[freshness] || FRESHNESS_ORDER.moderate;
  const minimumFreshness = FRESHNESS_ORDER[block.constraints?.minimumFreshness || "low"] || FRESHNESS_ORDER.low;
  const goalFreshness = FRESHNESS_ORDER[goal.freshnessRequirement || "moderate"] || FRESHNESS_ORDER.moderate;

  if (availableFreshness < minimumFreshness) {
    return 0;
  }

  if (availableFreshness >= goalFreshness && availableFreshness >= minimumFreshness) {
    return 1;
  }

  return 0.5;
}

function scoreDurationFit(block, context) {
  const availableDuration = context.readiness?.availabilityMinutes || 60;
  const durationCompatibility = block.constraints?.durationCompatibility || [];

  if (!durationCompatibility.length) {
    return 1;
  }

  return durationCompatibility.includes(availableDuration) ? 1 : 0;
}

function scoreEventProximityFit(block, upcomingEvent, daysUntilEvent) {
  if (!upcomingEvent || daysUntilEvent === null) return 1;

  const allowance = getCompetitionAllowance(block);
  if (daysUntilEvent > allowance) {
    return 1;
  }

  if (upcomingEvent.importanceLevel >= 3) {
    return 0;
  }

  return 0.5;
}

function scoreWeeklyLoadFit(block, currentWeek, goal, recentSessions) {
  const blockWeeklyCost = LOAD_ORDER[block.loadProfile?.weeklyCost || "moderate"];
  const blockInternalLoad = LOAD_ORDER[block.loadProfile?.estimatedInternalLoad || "moderate"];
  const weekTargetLoad = LOAD_ORDER[currentWeek?.targetLoad || goal.targetLoad || "moderate"];
  const recentHighLoadCount = recentSessions.filter((session) => {
    const sessionLoad = session.actualLoad || session.expectedLoad || session.load || "moderate";
    return LOAD_ORDER[sessionLoad] >= LOAD_ORDER.high;
  }).length;

  if (blockWeeklyCost > weekTargetLoad || blockInternalLoad > LOAD_ORDER[goal.targetLoad || "moderate"]) {
    return 0;
  }

  if (recentHighLoadCount >= 1 && blockInternalLoad >= LOAD_ORDER.high) {
    return 0;
  }

  if (blockWeeklyCost === weekTargetLoad) {
    return 0.75;
  }

  return 1;
}

function buildDecisionFactors(criteriaScores, weights) {
  return Object.entries(criteriaScores)
    .filter(([criterion, value]) => value > 0)
    .sort((left, right) => (right[1] * weights[right[0]]) - (left[1] * weights[left[0]]))
    .map(([criterion]) => criterion);
}

function finalizeSelection(scored) {
  const sorted = scored.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.block.name.localeCompare(right.block.name);
  });

  return {
    selected: sorted[0]?.block || null,
    score: sorted[0]?.score || 0,
    runnerUp: sorted.slice(1, 3).map((item) => ({ id: item.block.id, score: item.score })),
    decisionFactors: sorted[0]?.decisionFactors || []
  };
}

function getMainContextScores(block, context, goal) {
  const sessionDate = getSessionDate(context);
  const recentSessions = getRecentSessions(context, sessionDate);
  const upcomingEvent = getUpcomingEvent(context, sessionDate);
  const daysUntilEvent = upcomingEvent ? getDaysUntil(sessionDate, upcomingEvent.startDate) : null;
  const currentWeek = getCurrentWeek(context, sessionDate);

  return {
    objective: scoreObjectiveMatch(block, goal),
    role: scoreRoleCoherence(block, goal),
    profile: scoreProfileCompatibility(block, context, goal),
    recentHistory: scoreRecentHistoryCompatibility(block, recentSessions),
    readiness: scoreReadinessCompatibility(block, context, goal),
    duration: scoreDurationFit(block, context),
    eventProximity: scoreEventProximityFit(block, upcomingEvent, daysUntilEvent),
    weeklyLoad: scoreWeeklyLoadFit(block, currentWeek, goal, recentSessions)
  };
}

function getSecondaryCriteriaScores(block, mainBlock, context, goal) {
  const sessionDate = getSessionDate(context);
  const recentSessions = getRecentSessions(context, sessionDate);
  const upcomingEvent = getUpcomingEvent(context, sessionDate);
  const daysUntilEvent = upcomingEvent ? getDaysUntil(sessionDate, upcomingEvent.startDate) : null;
  const currentWeek = getCurrentWeek(context, sessionDate);

  const objectiveScore = block.primaryObjective === goal.mainObjective
    ? 0
    : ((block.secondaryObjectives || []).includes(goal.mainObjective) ? 0.5 : 0.75);

  return {
    objective: objectiveScore,
    role: block.sessionRole?.canBeSecondary ? 1 : 0,
    profile: scoreProfileCompatibility(block, context, goal),
    recentHistory: scoreRecentHistoryCompatibility(block, recentSessions),
    readiness: scoreReadinessCompatibility(block, context, goal),
    duration: scoreDurationFit(block, context),
    eventProximity: scoreEventProximityFit(block, upcomingEvent, daysUntilEvent),
    weeklyLoad: Math.min(
      scoreWeeklyLoadFit(block, currentWeek, goal, recentSessions),
      getCompatibilityScore(block, mainBlock)
    )
  };
}

function getTransferCriteriaScores(block, mainBlock, context, goal) {
  const sessionDate = getSessionDate(context);
  const recentSessions = getRecentSessions(context, sessionDate);
  const upcomingEvent = getUpcomingEvent(context, sessionDate);
  const daysUntilEvent = upcomingEvent ? getDaysUntil(sessionDate, upcomingEvent.startDate) : null;
  const currentWeek = getCurrentWeek(context, sessionDate);

  return {
    objective: (block.secondaryObjectives || []).includes(goal.mainObjective)
      ? 1
      : (block.primaryObjective === goal.mainObjective ? 0.5 : 0.25),
    role: block.sessionRole?.canBeTransfer ? 1 : 0,
    profile: scoreProfileCompatibility(block, context, goal),
    recentHistory: scoreRecentHistoryCompatibility(block, recentSessions),
    readiness: Math.min(
      scoreReadinessCompatibility(block, context, goal),
      getCompatibilityScore(block, mainBlock)
    ),
    duration: scoreDurationFit(block, context),
    eventProximity: scoreEventProximityFit(block, upcomingEvent, daysUntilEvent),
    weeklyLoad: scoreWeeklyLoadFit(block, currentWeek, goal, recentSessions)
  };
}

export function scoreAndSelect(candidates, context, goal) {
  if (!candidates.length) {
    return { selected: null, score: 0, runnerUp: [], decisionFactors: [] };
  }

  const scored = candidates.map((block) => {
    const criteriaScores = getMainContextScores(block, context, goal);
    const weightedScore = Object.entries(criteriaScores).reduce(
      (total, [criterion, value]) => total + (value * MAIN_WEIGHTS[criterion]),
      0
    );

    return {
      block,
      score: weightedScore,
      decisionFactors: buildDecisionFactors(criteriaScores, MAIN_WEIGHTS)
    };
  });

  return finalizeSelection(scored);
}

export function scoreAndSelectSecondary(candidates, mainBlock, context, goal) {
  if (!candidates.length || !mainBlock) {
    return { selected: null, score: 0, runnerUp: [], decisionFactors: [] };
  }

  const scored = candidates
    .filter((block) => getCompatibilityScore(block, mainBlock) > 0)
    .map((block) => {
      const criteriaScores = getSecondaryCriteriaScores(block, mainBlock, context, goal);
      const weightedScore = Object.entries(criteriaScores).reduce(
        (total, [criterion, value]) => total + (value * MAIN_WEIGHTS[criterion]),
        0
      );

      return {
        block,
        score: weightedScore,
        decisionFactors: ["secondary_value", ...buildDecisionFactors(criteriaScores, MAIN_WEIGHTS)]
      };
    });

  return finalizeSelection(scored);
}

export function scoreAndSelectTransfer(candidates, mainBlock, context, goal) {
  if (!candidates.length || !mainBlock) {
    return { selected: null, score: 0, runnerUp: [], decisionFactors: [] };
  }

  const scored = candidates
    .filter((block) => getCompatibilityScore(block, mainBlock) > 0)
    .map((block) => {
      const criteriaScores = getTransferCriteriaScores(block, mainBlock, context, goal);
      const weightedScore = Object.entries(criteriaScores).reduce(
        (total, [criterion, value]) => total + (value * MAIN_WEIGHTS[criterion]),
        0
      );

      return {
        block,
        score: weightedScore,
        decisionFactors: ["transfer_preserves_main", ...buildDecisionFactors(criteriaScores, MAIN_WEIGHTS)]
      };
    });

  return finalizeSelection(scored);
}
