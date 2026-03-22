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
  if (goal.sessionRole === "recovery") {
    return block.primaryObjective === "support_recovery" || block.family === "prevention";
  }

  if (goal.sessionRole === "activation") {
    return (
      block.primaryObjective === goal.mainObjective ||
      block.primaryObjective === "coordination" ||
      block.primaryObjective === "tennis_movement"
    );
  }

  return block.sessionRole.canBePrimary;
}

function isEventRestricted(block, upcomingEvent, daysUntilEvent) {
  const restrictions = block.constraints?.eventRestrictions || [];
  if (!upcomingEvent || restrictions.length === 0 || daysUntilEvent === null) return false;

  if (daysUntilEvent <= 1) {
    return restrictions.some((restriction) =>
      restriction.includes("close") || restriction.includes("limit") || restriction.includes("fatigue")
    );
  }

  if (upcomingEvent.importanceLevel >= 3 && daysUntilEvent <= 2) {
    return restrictions.some((restriction) => restriction.includes("major_event"));
  }

  return false;
}

function exceedsLoadBudget(block, week) {
  if (!week?.targetLoad) return false;
  if (week.targetLoad === "low" && LOAD_ORDER[block.loadProfile?.weeklyCost] > LOAD_ORDER.low) {
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
  const painLocation = readiness?.painLocation?.toLowerCase() || "";

  for (const block of candidates) {
    const injuryContraindications = block.constraints?.injuryContraindications || [];
    const recentConflict = recentSessions.some((session) => {
      const recentBlockIds = getRecentBlockIds(session);
      return recentBlockIds.has(block.id) || (block.compatibility?.avoidWith || []).some((id) => recentBlockIds.has(id));
    });

    // Hard reject if today's pain or known risk pattern directly matches a contraindication.
    if (
      injuryContraindications.some((contra) => painLocation && contra.includes(painLocation)) ||
      (readiness?.painLevel >= 3 && injuryContraindications.some((contra) => contra.startsWith("acute_")))
    ) {
      rejected.push({ blockId: block.id, reason: "injury_or_pain_contraindication" });
      continue;
    }

    // Hard reject if freshness is below the minimum requirement declared by the block.
    if (FRESHNESS_ORDER[freshness] < FRESHNESS_ORDER[block.constraints?.minimumFreshness || "low"]) {
      rejected.push({ blockId: block.id, reason: "insufficient_freshness" });
      continue;
    }

    // Hard reject if the block does not fit the intended session role.
    if (!isRoleCompatible(block, goal)) {
      rejected.push({ blockId: block.id, reason: "role_incompatible" });
      continue;
    }

    // Hard reject if the next event is too close for this block's declared restrictions.
    if (isEventRestricted(block, upcomingEvent, daysUntilEvent)) {
      rejected.push({ blockId: block.id, reason: "event_too_close" });
      continue;
    }

    // Hard reject if the athlete does not meet the block's minimum level requirement.
    if (athleteLevel < (LEVEL_ORDER[block.constraints?.minimumLevel] || LEVEL_ORDER.beginner)) {
      rejected.push({ blockId: block.id, reason: "level_incompatible" });
      continue;
    }

    // Hard reject if the available session duration cannot fit the block.
    if (!(block.constraints?.durationCompatibility || []).includes(availableDuration)) {
      rejected.push({ blockId: block.id, reason: "duration_too_short" });
      continue;
    }

    // Hard reject obvious recent-history conflicts before any later scoring layer exists.
    if (recentConflict) {
      rejected.push({ blockId: block.id, reason: "recent_history_conflict" });
      continue;
    }

    // Hard reject only the clearest load-budget overshoot cases.
    if (exceedsLoadBudget(block, currentWeek)) {
      rejected.push({ blockId: block.id, reason: "load_budget_exceeded" });
      continue;
    }

    allowed.push(block);
  }

  return { allowed, rejected };
}
