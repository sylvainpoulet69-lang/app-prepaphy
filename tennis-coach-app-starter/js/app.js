import { state, setState } from "./state.js";
import { trainingBlocks } from "./blocks.js";
import { demoAthletes, demoDevelopmentProfiles, demoPhysicalProfiles } from "../data/demoAthletes.js";
import { demoEvents, demoWeeks, demoReadiness } from "../data/demoEvents.js";
import { generateSession } from "./engine/sessionBuilder.js";
import { comparePlannedVsActualLoad, computeInternalLoad } from "./engine/load.js";
import { loadAthleteContext, saveFeedbackAndRebalanceWeek } from "./engine/planning.js";
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
      session.date <= week.endDate
  );

  week.plannedSessionCount = weekSessions.length;
  week.plannedLoad = weekSessions.reduce((sum, session) => sum + getSessionInternalLoad(session), 0);
}

function upsertTodaySession(session) {
  const athlete = getAthlete();
  const readiness = getTodayReadiness();
  const week = getActiveWeek();
  const date = getCurrentDate();
  const sessionId = `session_${athlete?.id || "unknown"}_${date}`;
  const existingIndex = state.sessions.findIndex((item) => item.id === sessionId);
  const enrichedSession = {
    ...session,
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

  setState({ currentSession: enrichedSession, feedbackResult: null });
  syncWeekMetrics();
}

function generateTodaySession() {
  const session = generateSession({ state });
  upsertTodaySession(session);
  renderApp();
}

function submitFeedback(formData) {
  const currentSession = state.currentSession;
  const week = getActiveWeek();
  if (!currentSession || !week) return;

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

  const feedbackForm = root.querySelector("#feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitFeedback(new FormData(feedbackForm));
    });
  }
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
          <p><strong>Current week type:</strong> ${context.week?.weekType || "-"}</p>
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
    feedbackResult: null
  });

  renderApp();
}

bootstrap();
