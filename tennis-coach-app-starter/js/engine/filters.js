const FRESHNESS_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };
const LEVEL_ORDER = { beginner: 1, intermediate: 2, competitor: 3, advanced: 3 };
const LOAD_ORDER = { low: 1, moderate: 2, high: 3, very_high: 4 };

function getSessionDate(context) {
  return context.readiness?.date || new Date().toISOString().slice(0, 10);
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
  const events = (context.state?.events || [])
    .filter((event) => event.athleteId === athleteId && event.isConfirmed !== false)
    .filter((event) => event.startDate >= sessionDate)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));

  return events[0] || null;
}

function getDaysUntil(dateA, dateB) {
  const a = new Date(`${dateA}T00:00:00Z`);
  const b = new Date(`${dateB}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

function getRecentSessions(context, sessionDate) {
  const athleteId = context.athlete?.id;
  const sessions = context.state?.sessions || [];

  return sessions.filter((session) => {
    if (session.athleteId !== athleteId || !session.date || session.date >= sessionDate) {
      return false;
    }

    const daysAgo = getDaysUntil(session.date, sessionDate);
    return daysAgo >= 0 && daysAgo <= 2;
  });
}

function getRecentBlockIds(session) {
  const blockIds = new Set();

  if (Array.isArray(session.blockIds)) {
    session.blockIds.forEach((id) => blockIds.add(id));
  }

  if (Array.isArray(session.blocks)) {
    session.blocks.forEach((block) => {
      if (typeof block === "string") blockIds.add(block);
      if (block?.id) blockIds.add(block.id);
    });
  }

  return blockIds;
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

function isRoleCompatible(block, goal) {
  if (block.primaryObjective !== goal.mainObjective && !block.sessionRole?.canBePrimary) {
    return false;
  }

  if (goal.sessionRole === "recovery") {
    return block.loadProfile?.estimatedInternalLoad !== "high" && block.loadProfile?.weeklyCost !== "high";
  }

  if (goal.sessionRole === "activation") {
    return block.loadProfile?.freshnessCost !== "very_high" && block.loadProfile?.weeklyCost !== "high";
  }

  return block.sessionRole?.canBePrimary;
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

function isEventRestricted(block, upcomingEvent, daysUntilEvent) {
  if (!upcomingEvent || daysUntilEvent === null) return false;

  const allowance = getCompetitionAllowance(block);
  if (!Number.isFinite(allowance) || daysUntilEvent > allowance) {
    return false;
  }

  if (upcomingEvent.importanceLevel >= 3) {
    return true;
  }

  return daysUntilEvent <= 1;
}

function exceedsLoadBudget(block, week, goal) {
  const blockWeeklyCost = LOAD_ORDER[block.loadProfile?.weeklyCost || "moderate"];
  const weekTargetLoad = LOAD_ORDER[week?.targetLoad || goal.targetLoad || "moderate"];

  return blockWeeklyCost > weekTargetLoad;
}

function hasRecentHistoryConflict(block, recentSessions) {
  return recentSessions.some((session) => {
    const recentBlockIds = getRecentBlockIds(session);
    const recentObjective = session.mainObjective;
    const avoidWith = block.compatibility?.avoidWith || [];

    return (
      recentBlockIds.has(block.id) ||
      avoidWith.some((id) => recentBlockIds.has(id)) ||
      recentObjective === block.primaryObjective
    );
  });
}

function isLoadConsistent(block, recentSessions, goal) {
  const recentHighLoadCount = recentSessions.filter((session) => {
    const sessionLoad = session.actualLoad || session.expectedLoad || session.load || "moderate";
    return LOAD_ORDER[sessionLoad] >= LOAD_ORDER.high;
  }).length;

  const blockLoad = LOAD_ORDER[block.loadProfile?.estimatedInternalLoad || "moderate"];
  const targetLoad = LOAD_ORDER[goal.targetLoad || "moderate"];

  if (blockLoad > targetLoad) {
    return false;
  }

  if (recentHighLoadCount >= 1 && blockLoad >= LOAD_ORDER.high) {
    return false;
  }

  return true;
}

function isPainRestricted(block, readiness) {
  const injuryContraindications = block.constraints?.injuryContraindications || [];
  const painLocation = readiness?.painLocation?.toLowerCase() || "";
  const painLevel = readiness?.painLevel || 0;
  const normalizedLocation = painLocation.replace(/\s+/g, "_");
  const hasAcuteRestriction = injuryContraindications.some((contra) => contra.startsWith("acute_"));
  const locationMatched = injuryContraindications.some((contra) => {
    if (!painLocation) return false;
    return contra.includes(normalizedLocation) || normalizedLocation.includes(contra.replace(/^acute_/, ""));
  });
  const lowerLimbPain = ["knee", "ankle", "hamstring", "quad", "calf", "lower_limb", "leg"].some((term) =>
    normalizedLocation.includes(term)
  );
  const genericLowerLimbContra = injuryContraindications.includes("acute_lower_limb_pain");

  if (painLevel >= 3 && hasAcuteRestriction) {
    return true;
  }

  if (locationMatched) {
    return true;
  }

  if (painLevel >= 2 && lowerLimbPain && genericLowerLimbContra) {
    return true;
  }

  return false;
}

export function hardFilter(candidates, context, goal) {
  const allowed = [];
  const rejected = [];
  const readiness = context.readiness || null;
  const sessionDate = getSessionDate(context);
  const freshness = getFreshnessBucket(readiness);
  const availableDuration = readiness?.availabilityMinutes || 60;
  const upcomingEvent = getUpcomingEvent(context, sessionDate);
  const daysUntilEvent = upcomingEvent ? getDaysUntil(sessionDate, upcomingEvent.startDate) : null;
  const recentSessions = getRecentSessions(context, sessionDate);
  const currentWeek = getCurrentWeek(context, sessionDate);
  const athleteLevel = LEVEL_ORDER[context.athlete?.level] || LEVEL_ORDER.beginner;

  for (const block of candidates) {
    const minimumFreshness = block.minFreshness || block.constraints?.minimumFreshness || "low";
    const durationCompatibility = block.constraints?.durationCompatibility || [];

    if (isPainRestricted(block, readiness)) {
      rejected.push({ blockId: block.id, reason: "injury_or_pain_contraindication" });
      continue;
    }

    if (FRESHNESS_ORDER[freshness] < FRESHNESS_ORDER[minimumFreshness]) {
      rejected.push({ blockId: block.id, reason: "insufficient_freshness" });
      continue;
    }

    if (!isRoleCompatible(block, goal)) {
      rejected.push({ blockId: block.id, reason: "role_incompatible" });
      continue;
    }

    if (isEventRestricted(block, upcomingEvent, daysUntilEvent)) {
      rejected.push({ blockId: block.id, reason: "event_too_close" });
      continue;
    }

    if (athleteLevel < (LEVEL_ORDER[block.constraints?.minimumLevel] || LEVEL_ORDER.beginner)) {
      rejected.push({ blockId: block.id, reason: "level_incompatible" });
      continue;
    }

    if (durationCompatibility.length > 0 && !durationCompatibility.includes(availableDuration)) {
      rejected.push({ blockId: block.id, reason: "duration_incompatible" });
      continue;
    }

    if (hasRecentHistoryConflict(block, recentSessions)) {
      rejected.push({ blockId: block.id, reason: "recent_history_conflict" });
      continue;
    }

    if (!isLoadConsistent(block, recentSessions, goal) || exceedsLoadBudget(block, currentWeek, goal)) {
      rejected.push({ blockId: block.id, reason: "load_budget_exceeded" });
      continue;
    }

    allowed.push(block);
  }

  return { allowed, rejected };
}
