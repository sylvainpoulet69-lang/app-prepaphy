function renderPhaseList(session) {
  if (!session?.phases?.length) {
    return `<p class="muted">No generated phases yet.</p>`;
  }

  return `
    <ul class="phase-list">
      ${session.phases
        .map(
          (phase) => `
            <li>
              <strong>${phase.label}:</strong>
              ${phase.block ? phase.block.name : (phase.notes?.[0] || "Coach-managed warm-up / transition")}
              ${phase.targetDurationMin ? `<span class="phase-duration">${phase.targetDurationMin} min</span>` : ""}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderWarnings(session) {
  if (!session?.warnings?.length) {
    return `<p class="muted">No warning flags from the current engine output.</p>`;
  }

  return `<ul class="simple-list warning-list">${session.warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>`;
}

export function renderSessionView({ currentSession }) {
  return `
    <section class="view-grid">
      <article class="card action-card">
        <div>
          <h3>Generate today's session</h3>
          <p class="muted">Use the current athlete, readiness, calendar, and week data already present in the demo.</p>
        </div>
        <button class="primary-button" data-action="generate-session">Generate today's session</button>
      </article>

      <article class="card">
        <h3>Session details</h3>
        ${currentSession ? `
          <p><strong>Session role:</strong> ${currentSession.sessionRole}</p>
          <p><strong>Main objective:</strong> ${currentSession.mainObjective}</p>
          <p><strong>Duration:</strong> ${currentSession.expectedDurationMin} min</p>
          <p><strong>Expected load:</strong> ${currentSession.expectedLoad}</p>
          <div>
            <strong>Selected blocks / phases:</strong>
            ${renderPhaseList(currentSession)}
          </div>
          <p><strong>Explanation:</strong> ${currentSession.explanation}</p>
          <div>
            <strong>Warnings:</strong>
            ${renderWarnings(currentSession)}
          </div>
        ` : `<p>No session generated yet. Click the button above to build today's session.</p>`}
      </article>
    </section>
  `;
}
