import { comparePlannedVsActualLoad, computeInternalLoad } from "./load.js";

function getSessionDate(sessionPlan = {}, feedback = {}, context = {}) {
  return (
    feedback.date ||
    sessionPlan.date ||
    context.readiness?.date ||
    new Date().toISOString().slice(0, 10)
  );
}

function createFeedbackId(feedback, athleteId) {
  if (feedback.id) return feedback.id;
  const date = feedback.date || new Date().toISOString().slice(0, 10);
  return `feedback_${athleteId || "unknown"}_${date}_${Date.now()}`;
}

function getPainLocation(feedback = {}) {
  return feedback.painAfterLocation || feedback.painLocation || "";
}

function isSessionInsideWeek(session, week) {
  if (!session?.date || !week) return false;
  return session.date >= week.startDate && session.date <= week.endDate;
}

function getDaysUntil(dateA, dateB) {
  const left = new Date(`${dateA}T00:00:00Z`);
  const right = new Date(`${dateB}T00:00:00Z`);
  return Math.round((right - left) / 86400000);
}

function getUpcomingEventForWeek(week, sessionDate, context = {}) {
  const athleteId = week?.athleteId || context.athlete?.id;
  const events = (context.state?.events || [])
    .filter((event) => event.athleteId === athleteId && event.isConfirmed !== false)
    .filter((event) => event.startDate >= sessionDate)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));

  return events[0] || null;
}

function reduceDurationStep(durationMin) {
  if (durationMin >= 90) return 60;
  if (durationMin >= 60) return 45;
  return durationMin || 45;
}

function reduceLoadStep(loadLabel = "moderate") {
  if (loadLabel === "very_high") return "high";
  if (loadLabel === "high") return "moderate";
  return "low";
}

function shouldReduceFutureDemand(feedback, comparison, context = {}) {
  const readiness = context.readiness || {};
  const highPain = (feedback.painAfterLevel || 0) >= 4 || (readiness.painLevel || 0) >= 4;
  const highFatigue = (readiness.fatigueLevel || 0) >= 4 || (readiness.muscleSoreness || 0) >= 4;
  const poorQuality = feedback.perceivedQuality !== undefined && feedback.perceivedQuality !== null && feedback.perceivedQuality <= 2;

  return comparison.status === "overload" || highPain || highFatigue || poorQuality;
}

function isKeyPriorityMiss(sessionPlan, feedback) {
  return !feedback.completed && ["priority_1", "priority_2"].includes(sessionPlan.sessionRole);
}

function makeSessionEligibleAgain(session, sessionPlan) {
  const nextRebalance = { ...(session.rebalance || {}) };
  nextRebalance.priorityCatchUpEligible = true;
  nextRebalance.priorityToRevisit = sessionPlan.mainObjective;
  nextRebalance.reason = "missed_key_priority_session";

  return {
    ...session,
    rebalance: nextRebalance
  };
}

function reduceFutureSessionDemand(session, sessionDate, comparison) {
  const nextDuration = reduceDurationStep(session.expectedDurationMin || 60);
  const nextRebalance = {
    ...(session.rebalance || {}),
    reducedAfterDate: sessionDate,
    reason: "post_feedback_load_protection",
    loadComparisonStatus: comparison.status,
    previousExpectedDurationMin: session.expectedDurationMin || 60,
    previousExpectedLoad: session.expectedLoad || "moderate"
  };

  return {
    ...session,
    expectedDurationMin: nextDuration,
    expectedLoad: reduceLoadStep(session.expectedLoad || "moderate"),
    transferLevel: "low",
    rebalance: nextRebalance
  };
}

export function loadAthleteContext(state, athleteId) {
  return {
    athlete: state.athletes.find((a) => a.id === athleteId),
    developmentProfile: state.developmentProfiles.find((d) => d.athleteId === athleteId),
    physicalProfile: state.physicalProfiles.find((p) => p.athleteId === athleteId),
    events: state.events.filter((e) => e.athleteId === athleteId),
    weeks: state.weeks.filter((w) => w.athleteId === athleteId),
    readiness: state.readiness.filter((r) => r.athleteId === athleteId),
    feedbacks: state.feedbacks.filter((f) => f.athleteId === athleteId)
  };
}

export function saveSessionFeedback(feedback = {}, state) {
  const athleteId = feedback.athleteId || state?.activeAthleteId || null;
  const normalizedFeedback = {
    id: createFeedbackId(feedback, athleteId),
    athleteId,
    sessionId: feedback.sessionId || null,
    weekId: feedback.weekId || null,
    date: feedback.date || new Date().toISOString().slice(0, 10),
    completed: Boolean(feedback.completed),
    actualDurationMin: Number(feedback.actualDurationMin) || 0,
    sessionRPE: Number(feedback.sessionRPE) || 0,
    internalLoad: Number(feedback.internalLoad) || computeInternalLoad(feedback.sessionRPE, feedback.actualDurationMin),
    painAfterLevel: Number(feedback.painAfterLevel) || 0,
    painAfterLocation: getPainLocation(feedback),
    perceivedQuality: feedback.perceivedQuality ?? null,
    comments: feedback.comments || ""
  };

  if (state) {
    state.feedbacks = [...(state.feedbacks || []), normalizedFeedback];
  }

  return normalizedFeedback;
}

export function saveFeedbackAndRebalanceWeek(week, sessionPlan, feedback, context = {}) {
  const state = context.state || null;
  const sessionDate = getSessionDate(sessionPlan, feedback, context);
  const savedFeedback = saveSessionFeedback({
    ...feedback,
    athleteId: feedback.athleteId || week?.athleteId || sessionPlan?.athleteId || state?.activeAthleteId || null,
    weekId: feedback.weekId || week?.id || null,
    sessionId: feedback.sessionId || sessionPlan?.id || null,
    date: sessionDate
  }, state);
  const comparison = comparePlannedVsActualLoad(sessionPlan, savedFeedback);
  const actualLoadToAdd = savedFeedback.completed ? comparison.actualInternalLoad : 0;

  if (week) {
    week.completedLoad = (week.completedLoad || 0) + actualLoadToAdd;
    week.actualSessionCount = (week.actualSessionCount || 0) + (savedFeedback.completed ? 1 : 0);
  }

  const sessions = state?.sessions || [];
  const upcomingEvent = getUpcomingEventForWeek(week, sessionDate, context);
  const competitionIsClose = upcomingEvent ? getDaysUntil(sessionDate, upcomingEvent.startDate) <= 3 : false;
  const reduceFutureDemand = shouldReduceFutureDemand(savedFeedback, comparison, context);
  const missedKeyPriority = isKeyPriorityMiss(sessionPlan, savedFeedback);
  let catchUpGranted = false;

  if (state && Array.isArray(sessions)) {
    state.sessions = sessions.map((session) => {
      const isFutureSession = session.athleteId === week?.athleteId && isSessionInsideWeek(session, week) && session.date > sessionDate;
      if (!isFutureSession) {
        return session;
      }

      // V1 stays conservative: only trim future demand when feedback clearly says the week is too heavy.
      let nextSession = session;
      if (reduceFutureDemand) {
        nextSession = reduceFutureSessionDemand(nextSession, sessionDate, comparison);
      }

      // If a key priority session was missed, keep the same weekly priorities and simply make one future slot eligible again.
      if (!catchUpGranted && missedKeyPriority && !competitionIsClose && !reduceFutureDemand) {
        nextSession = makeSessionEligibleAgain(nextSession, sessionPlan);
        catchUpGranted = true;
      }

      return nextSession;
    });
  }

  if (week) {
    week.rebalanceSummary = {
      comparisonStatus: comparison.status,
      reducedFutureDemand: reduceFutureDemand,
      competitionIsClose,
      catchUpGranted,
      preservedWeeklyPriorities: true,
      rationale: competitionIsClose
        ? "Competition is close, so freshness stays above catch-up."
        : (reduceFutureDemand
          ? "Future sessions were reduced conservatively after overload / pain / fatigue signals."
          : "Future sessions stay mostly unchanged unless a missed priority needs one eligible slot again.")
    };
  }

  return {
    feedback: savedFeedback,
    comparison,
    week,
    updatedSessions: state?.sessions || []
  };
}
