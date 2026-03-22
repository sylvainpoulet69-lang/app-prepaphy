import { formatKeyLabel, renderEmptyState, renderNotice, splitSentences } from "./common.js";

const PHASE_TITLES = {
  opening: "Phase 1 · Opening",
  activation: "Phase 2 · Activation",
  main: "Phase 3 · Main block",
  secondary: "Phase 4 · Secondary block",
  transfer: "Phase 5 · Tennis transfer",
  finish: "Phase 6 · Finish"
};

function renderPhaseList(session) {
  if (!session?.phases?.length) {
    return renderEmptyState({
      title: "No phases generated",
      message: "The current session does not expose readable phase output yet."
    });
  }

  return `
    <div class="phase-stack">
      ${session.phases
        .map((phase) => {
          const blockLabel = phase.block ? phase.block.name : "Coach-managed transition";
          const blockRole = phase.block?.primaryObjective ? formatKeyLabel(phase.block.primaryObjective) : "Preparation";
          const notes = (phase.notes || []).filter(Boolean);

          return `
            <article class="phase-card">
              <div class="phase-card-header">
                <div>
                  <p class="eyebrow">${PHASE_TITLES[phase.type] || phase.label}</p>
                  <h4>${phase.label}</h4>
                </div>
                <span class="badge subtle-badge">${phase.targetDurationMin || 0} min</span>
              </div>
              <p><strong>Block:</strong> ${blockLabel}</p>
              <p><strong>Block goal:</strong> ${blockRole}</p>
              ${notes.length ? `<ul class="simple-list">${notes.map((note) => `<li>${note}</li>`).join("")}</ul>` : ""}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderWarnings(session, generationStatus) {
  const warnings = [
    ...(generationStatus?.messages || []),
    ...(session?.warnings || [])
  ].filter(Boolean);

  if (!warnings.length) {
    return renderNotice({
      tone: "info",
      title: "No engine warnings",
      message: "The current session output does not expose additional warning flags."
    });
  }

  return `<ul class="simple-list warning-list">${warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>`;
}

function renderExplanation(session) {
  const items = splitSentences(session?.explanation || "");

  if (!items.length) {
    return renderEmptyState({
      title: "No explanation available",
      message: "The engine did not return a readable explanation for this session."
    });
  }

  return `
    <ol class="explanation-list">
      ${items.map((item) => `<li>${item}</li>`).join("")}
    </ol>
  `;
}

export function renderSessionView({ athlete, readiness, currentSession, generationStatus }) {
  const hasValidSession = Boolean(currentSession?.isValid);

  return `
    <section class="view-grid">
      <article class="card action-card">
        <div>
          <h3>Generate today's session</h3>
          <p class="muted">Use the current athlete, readiness, calendar, and week data already present in the demo.</p>
          ${!athlete ? renderNotice({ tone: "warning", title: "Missing athlete context", message: "No session can be generated until an active athlete exists." }) : ""}
          ${!readiness ? renderNotice({ tone: "warning", title: "Missing readiness context", message: "V1 can still try a default session, but today-specific safety and availability logic will be weaker." }) : ""}
          ${generationStatus?.type === "error"
            ? renderNotice({ tone: "warning", title: "No valid session generated", message: generationStatus.message || "The engine returned a session shape that cannot be safely used in the UI." })
            : generationStatus?.type === "success"
              ? renderNotice({ tone: "success", title: "Session generated", message: generationStatus.message || "Today's session was refreshed from the current demo context." })
              : renderNotice({ tone: "info", title: "Ready to generate", message: "Generate a session to inspect the V1 decision output and then capture feedback." })}
        </div>
        <button class="primary-button" data-action="generate-session">Generate today's session</button>
      </article>

      <article class="card">
        <h3>Session details</h3>
        ${hasValidSession ? `
          <div class="session-summary-grid">
            <p><strong>Session role:</strong> ${formatKeyLabel(currentSession.sessionRole)}</p>
            <p><strong>Main objective:</strong> ${formatKeyLabel(currentSession.mainObjective)}</p>
            <p><strong>Duration:</strong> ${currentSession.expectedDurationMin} min</p>
            <p><strong>Expected load:</strong> ${formatKeyLabel(currentSession.expectedLoad)}</p>
          </div>
          <div>
            <strong>Selected blocks and phases:</strong>
            ${renderPhaseList(currentSession)}
          </div>
          <div>
            <strong>Decision explanation:</strong>
            ${renderExplanation(currentSession)}
          </div>
          <div>
            <strong>Warnings:</strong>
            ${renderWarnings(currentSession, generationStatus)}
          </div>
        ` : renderEmptyState({
          title: generationStatus?.type === "error" ? "No safe session to show" : "No session generated yet",
          message: generationStatus?.type === "error"
            ? (generationStatus.message || "The UI rejected the last engine output because it was missing a usable main block.")
            : "Generate today's session to view the V1 decision output.",
          hint: generationStatus?.issues?.includes("missing_main_block")
            ? "A main block is required before the session can be used for feedback or weekly planning metrics."
            : "The session screen stays read-only until a valid session exists."
        })}
      </article>
    </section>
  `;
}
