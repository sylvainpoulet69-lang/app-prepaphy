import { state, setState } from "./state.js";
import { trainingBlocks } from "./blocks.js";
import { demoAthletes, demoDevelopmentProfiles, demoPhysicalProfiles } from "../data/demoAthletes.js";
import { demoEvents, demoWeeks, demoReadiness } from "../data/demoEvents.js";
import { generateSession } from "./engine/sessionBuilder.js";
import { comparePlannedVsActualLoad, computeInternalLoad } from "./engine/load.js";
import { loadAthleteContext, saveFeedbackAndRebalanceWeek } from "./engine/planning.js";
import { formatKeyLabel } from "./ui/common.js";
import { renderProfileView } from "./ui/profileView.js";
import { renderCalendarView } from "./ui/calendarView.js";
import { renderWeekView } from "./ui/weekView.js";
import { renderSessionView } from "./ui/sessionView.js";
import { renderFeedbackView } from "./ui/feedbackView.js";

const SCREEN_LABELS = {
  profile: "Profile",
  calendar: "Calendar",
  week: "Week",
  session: "Session of the day",
  feedback: "Feedback"
};

const LOAD_TO_RPE = {
  low: 3,
  moderate: 5,
  high: 7,
  very_high: 8
};

function getAthlete() {
  return state.athletes.find((athlete) => athlete.id === state.activeAthleteId) || null;
}

function getTodayReadiness() {
  return state.readiness.find((entry) => entry.athleteId === state.activeAthleteId) || null;
}

function getCurrentDate() {
  return getTodayReadiness()?.date || new Date().toISOString().slice(0, 10);
}

function getActiveWeek() {
  const athleteId = state.activeAthleteId;
  const today = getCurrentDate();

  return (
    state.weeks.find(
      (week) =>
        week.athleteId === athleteId &&
        week.startDate <= today &&
        week.endDate >= today
    ) ||
    state.weeks.find((week) => week.athleteId === athleteId) ||
    null
  );
}

function getAthleteEvents() {
  return state.events
    .filter((event) => event.athleteId === state.activeAthleteId)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}

function getSessionInternalLoad(session) {
  if (!session) return 0;
  if (session.plannedInternalLoad) return session.plannedInternalLoad;

  const duration = Number(session.expectedDurationMin) || 0;
  const targetRPE = LOAD_TO_RPE[session.expectedLoad] || LOAD_TO_RPE.moderate;
  return computeInternalLoad(targetRPE, duration);
}

function syncWeekMetrics() {
  const week = getActiveWeek();
  if (!week) return;

  const weekSessions = state.sessions.filter(
    (session) =>
      session.athleteId === week.athleteId &&
      session.date >= week.startDate &&
      session.date <= week.endDate &&
      session.isValid
  );

  week.plannedSessionCount = weekSessions.length;
  week.plannedLoad = weekSessions.reduce((sum, session) => sum + getSessionInternalLoad(session), 0);
}

function validateGeneratedSession(session) {
  const issues = [];
  const messages = [];
  const mainPhase = (session?.phases || []).find((phase) => phase.type === "main");

  if (!session) {
    issues.push("missing_session");
    messages.push("The engine did not return a session object.");
  }

  if (!mainPhase) {
    issues.push("missing_main_phase");
    messages.push("No main phase was returned by the session builder.");
  }

  if (!mainPhase?.block) {
    issues.push("missing_main_block");
    messages.push("No main block is selected, so the session cannot be used safely.");
  }

  return {
    isValid: issues.length === 0,
    issues,
    messages
  };
}

function upsertTodaySession(session) {
  const athlete = getAthlete();
  const week = getActiveWeek();
  const date = getCurrentDate();
  const validation = validateGeneratedSession(session);

  if (!validation.isValid) {
    setState({
      currentSession: session ? { ...session, isValid: false } : null,
      feedbackResult: null,
      generationStatus: {
        type: "error",
        message: validation.messages[0] || "No valid session can be generated from the current inputs.",
        issues: validation.issues,
        messages: validation.messages
      },
      feedbackStatus: {
        type: "error",
        message: "Feedback is unavailable until a valid session is generated."
      }
    });
    return;
  }

  const sessionId = `session_${athlete?.id || "unknown"}_${date}`;
  const existingIndex = state.sessions.findIndex((item) => item.id === sessionId);
  const enrichedSession = {
    ...session,
    isValid: true,
    id: sessionId,
    athleteId: athlete?.id || null,
    weekId: week?.id || null,
    date,
    plannedInternalLoad: getSessionInternalLoad(session),
    comparisonPreview: comparePlannedVsActualLoad(session, {})
  };

  if (existingIndex >= 0) {
    state.sessions.splice(existingIndex, 1, enrichedSession);
  } else {
    state.sessions.push(enrichedSession);
  }

  setState({
    currentSession: enrichedSession,
    feedbackResult: null,
    generationStatus: {
      type: "success",
      message: `Session generated around ${formatKeyLabel(enrichedSession.mainObjective)} with a clear main block.`,
      issues: [],
      messages: []
    },
    feedbackStatus: null
  });
  syncWeekMetrics();
}

function generateTodaySession() {
  const session = generateSession({ state });
  upsertTodaySession(session);
  renderApp();
}

function validateFeedbackForm(formData, currentSession) {
  const errors = [];
  const completed = formData.get("completed");
  const actualDurationMin = Number(formData.get("actualDurationMin"));
  const sessionRPE = Number(formData.get("sessionRPE"));
  const painAfterLevel = Number(formData.get("painAfterLevel"));

  if (!currentSession?.isValid) {
    errors.push("Generate a valid session before submitting feedback.");
  }

  if (!["yes", "no"].includes(completed)) {
    errors.push("Select whether the session was completed.");
  }

  if (!Number.isFinite(actualDurationMin) || actualDurationMin < 1) {
    errors.push("Enter an actual duration of at least 1 minute.");
  }

  if (!Number.isFinite(sessionRPE) || sessionRPE < 1 || sessionRPE > 10) {
    errors.push("Enter a session RPE between 1 and 10.");
  }

  if (!Number.isFinite(painAfterLevel) || painAfterLevel < 0 || painAfterLevel > 10) {
    errors.push("Enter a pain-after score between 0 and 10.");
  }

  return errors;
}

function submitFeedback(formData) {
  const currentSession = state.currentSession;
  const week = getActiveWeek();
  const errors = validateFeedbackForm(formData, currentSession);

  if (!currentSession || !week || errors.length) {
    setState({
      feedbackStatus: {
        type: "error",
        message: errors[0] || "Feedback cannot be submitted without an active week and a valid session."
      },
      activeScreen: "feedback"
    });
    renderApp();
    return;
  }

  const completed = formData.get("completed") === "yes";
  const actualDurationMin = Number(formData.get("actualDurationMin")) || 0;
  const sessionRPE = Number(formData.get("sessionRPE")) || 0;
  const painAfterLevel = Number(formData.get("painAfterLevel")) || 0;
  const comments = (formData.get("comments") || "").toString().trim();

  const feedbackInput = {
    athleteId: state.activeAthleteId,
    completed,
    actualDurationMin,
    sessionRPE,
    painAfterLevel,
    comments,
    date: getCurrentDate(),
    perceivedQuality: completed ? 3 : 2
  };

  const result = saveFeedbackAndRebalanceWeek(week, currentSession, feedbackInput, {
    state,
    athlete: getAthlete(),
    readiness: getTodayReadiness()
  });

  setState({
    feedbackResult: result,
    feedbackStatus: {
      type: "success",
      message: "Feedback saved and week metrics refreshed."
    },
    activeScreen: "feedback"
  });
  syncWeekMetrics();
  renderApp();
}

function renderScreen(context) {
  switch (state.activeScreen) {
    case "calendar":
      return renderCalendarView(context);
    case "week":
      return renderWeekView(context);
    case "session":
      return renderSessionView(context);
    case "feedback":
      return renderFeedbackView(context);
    case "profile":
    default:
      return renderProfileView(context);
  }
}

function bindFeedbackForm(root) {
  const feedbackForm = root.querySelector("#feedback-form");
  if (!feedbackForm) return;

  const errorsNode = root.querySelector("#feedback-errors");
  const submitButton = root.querySelector("[data-feedback-submit]");

  const refreshFeedbackValidation = () => {
    const errors = validateFeedbackForm(new FormData(feedbackForm), state.currentSession);

    if (errorsNode) {
      errorsNode.innerHTML = errors.length
        ? renderNotice({ tone: "warning", title: "Feedback incomplete", message: errors[0] })
        : renderNotice({ tone: "success", title: "Ready to submit", message: "All required fields are valid." });
    }

    if (submitButton) {
      submitButton.disabled = errors.length > 0;
    }
  };

  feedbackForm.addEventListener("input", refreshFeedbackValidation);
  feedbackForm.addEventListener("change", refreshFeedbackValidation);
  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitFeedback(new FormData(feedbackForm));
  });

  refreshFeedbackValidation();
}

function bindAppEvents(root) {
  root.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      setState({ activeScreen: button.dataset.screen });
      renderApp();
    });
  });

  const generateButton = root.querySelector("[data-action='generate-session']");
  if (generateButton) {
    generateButton.addEventListener("click", generateTodaySession);
  }

  bindFeedbackForm(root);
}

export function renderApp() {
  const root = document.getElementById("app");
  if (!root) return;

  const athleteContext = loadAthleteContext(state, state.activeAthleteId);
  const context = {
    athlete: getAthlete(),
    readiness: getTodayReadiness(),
    week: getActiveWeek(),
    events: getAthleteEvents(),
    currentSession: state.currentSession,
    feedbackResult: state.feedbackResult,
    generationStatus: state.generationStatus,
    feedbackStatus: state.feedbackStatus,
    athleteContext,
    today: getCurrentDate(),
    screens: SCREEN_LABELS,
    state
  };

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar card">
        <div>
          <p class="eyebrow">V1 demo</p>
          <h1>Tennis Coach App</h1>
          <p class="muted">Functional first interface wired to the current engine and demo data.</p>
        </div>
        <nav class="screen-nav" aria-label="Main screens">
          ${Object.entries(SCREEN_LABELS)
            .map(
              ([key, label]) => `
                <button class="nav-button ${state.activeScreen === key ? "is-active" : ""}" data-screen="${key}">
                  ${label}
                </button>
              `
            )
            .join("")}
        </nav>
        <section class="sidebar-summary">
          <h2>Today context</h2>
          <p><strong>Date:</strong> ${context.today}</p>
          <p><strong>Athlete:</strong> ${context.athlete?.firstName || "-"} ${context.athlete?.lastName || ""}</p>
          <p><strong>Availability:</strong> ${context.readiness?.availabilityMinutes ?? 60} min</p>
          <p><strong>Current week type:</strong> ${formatKeyLabel(context.week?.weekType)}</p>
        </section>
        <section class="sidebar-summary limitations-panel">
          <h2>V1 limitations</h2>
          <ul class="simple-list compact-list">
            <li>Demo data only, with one active athlete and in-memory state.</li>
            <li>No persistence, no backend, and no multi-athlete workflow yet.</li>
            <li>Week and load indicators stay intentionally simple for V1 review.</li>
          </ul>
        </section>
      </aside>
      <main class="main-panel">
        <header class="page-header card">
          <div>
            <p class="eyebrow">Screen</p>
            <h2>${SCREEN_LABELS[state.activeScreen]}</h2>
          </div>
          <div class="header-badges">
            <span class="badge">Readiness ${context.readiness?.readinessScore ?? "-"}/5</span>
            <span class="badge">Pain ${context.readiness?.painLevel ?? "-"}/5</span>
          </div>
        </header>
        ${renderScreen(context)}
      </main>
    </div>
  `;

  bindAppEvents(root);
}

function bootstrap() {
  setState({
    athletes: demoAthletes,
    developmentProfiles: demoDevelopmentProfiles,
    physicalProfiles: demoPhysicalProfiles,
    events: demoEvents,
    weeks: demoWeeks,
    readiness: demoReadiness,
    blocks: trainingBlocks,
    activeScreen: "profile",
    currentSession: null,
    feedbackResult: null,
    generationStatus: null,
    feedbackStatus: null
  });

  renderApp();
}

bootstrap();
