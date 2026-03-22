const FRESHNESS_ORDER = { low: 1, moderate: 2, high: 3 };

function getSessionDate(context) {
  return context.readiness?.date || new Date().toISOString().slice(0, 10);
}


function getActiveWeek(context, sessionDate) {
  const weeks = context.state?.weeks || [];
  const athleteId = context.athlete?.id;

  return (
    weeks.find(
      (week) =>
        week.athleteId === athleteId &&
        week.startDate <= sessionDate &&
        week.endDate >= sessionDate
    ) ||
    weeks.find((week) => week.athleteId === athleteId && week.startDate >= sessionDate) ||
    weeks.find((week) => week.athleteId === athleteId) ||
    null
  );
}

function getPhysicalProfile(context) {
  return (
    context.state?.physicalProfiles?.find(
      (profile) => profile.athleteId === context.athlete?.id
    ) || null
  );
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

function countObjectiveExposure(context, sessionDate, objective) {
  const athleteId = context.athlete?.id;
  const sessions = context.state?.sessions || [];

  return sessions.filter((session) => {
    if (session.athleteId !== athleteId) return false;
    if (!session.date || session.date > sessionDate) return false;
    return session.mainObjective === objective;
  }).length;
}

function selectPriorityObjective(priority1, priority2, context, sessionDate) {
  if (!priority1 && !priority2) return "support_recovery";
  if (priority1 && !priority2) return priority1;
  if (!priority1 && priority2) return priority2;

  const priority1Done = countObjectiveExposure(context, sessionDate, priority1);
  const priority2Done = countObjectiveExposure(context, sessionDate, priority2);

  return priority1Done <= priority2Done ? priority1 : priority2;
}

function getFreshnessRequirement(mainObjective, sessionRole) {
  if (sessionRole === "recovery") return "low";
  if (sessionRole === "activation") return "moderate";

  if (["acceleration", "max_speed", "power"].includes(mainObjective)) {
    return "high";
  }

  return "moderate";
}

function getTargetLoad(sessionRole, mainObjective, context) {
  if (sessionRole === "recovery" || sessionRole === "activation") return "low";
  if (["repeated_sprint", "aerobic_power"].includes(mainObjective)) return "high";

  const tolerance = getPhysicalProfile(context)?.loadTolerance;
  return tolerance === "high" ? "moderate" : "moderate";
}

export function selectTodayGoal(context) {
  const sessionDate = getSessionDate(context);
  const readiness = context.readiness || null;
  const activeWeek = getActiveWeek(context, sessionDate);
  const physicalProfile = getPhysicalProfile(context);
  const upcomingEvent = getUpcomingEvent(context, sessionDate);
  const daysUntilEvent = upcomingEvent ? getDaysUntil(sessionDate, upcomingEvent.startDate) : null;
  const freshness = getFreshnessBucket(readiness);

  const priority1 = activeWeek?.priority1 || physicalProfile?.priorityQuality1 || physicalProfile?.limitingFactor || null;
  const priority2 = activeWeek?.priority2 || physicalProfile?.priorityQuality2 || null;

  let sessionRole = "priority_1";
  let mainObjective = priority1 || "support_recovery";
  const decisionFlags = [];

  // Safety and recovery always win when the athlete state is clearly degraded.
  if (
    readiness &&
    (readiness.painLevel >= 4 || readiness.fatigueLevel >= 4 || readiness.muscleSoreness >= 4)
  ) {
    sessionRole = "recovery";
    mainObjective = "support_recovery";
    decisionFlags.push("safety_first", "recovery_state");
  }
  // Pre-competition activation comes before generic weekly priorities.
  else if (upcomingEvent && daysUntilEvent !== null && daysUntilEvent <= 1) {
    sessionRole = "activation";
    mainObjective = context.athlete?.profileType === "youth" ? "coordination" : "tennis_movement";
    decisionFlags.push("pre_competition_activation");
    if (upcomingEvent.importanceLevel >= 3) {
      decisionFlags.push("important_event_close");
    }
  }
  // Weekly priority 1 stays first unless it has already been covered more than priority 2.
  else {
    mainObjective = selectPriorityObjective(priority1, priority2, context, sessionDate);
    sessionRole = mainObjective === priority2 ? "priority_2" : "priority_1";
    if (mainObjective === priority1) {
      decisionFlags.push("weekly_priority_1");
    } else if (mainObjective === priority2) {
      decisionFlags.push("weekly_priority_2");
    }
  }

  const freshnessRequirement = getFreshnessRequirement(mainObjective, sessionRole);
  if (FRESHNESS_ORDER[freshness] < FRESHNESS_ORDER[freshnessRequirement]) {
    decisionFlags.push("freshness_below_ideal");
  }

  return {
    sessionRole,
    mainObjective,
    secondaryIntent: sessionRole === "activation" ? "tennis_transfer_light" : "support_or_transfer_if_time",
    targetLoad: getTargetLoad(sessionRole, mainObjective, context),
    freshnessRequirement,
    decisionFlags,
    rationale: `Goal selected from athlete state, weekly priorities, and event proximity for ${sessionDate}.`
  };
}
