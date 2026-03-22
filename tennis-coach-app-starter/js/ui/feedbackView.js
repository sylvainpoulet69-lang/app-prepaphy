function renderRebalanceSummary(result) {
  if (!result) {
    return `<p class="muted">Submit session feedback to update the week and show the rebalance summary.</p>`;
  }

  return `
    <div class="result-panel">
      <p><strong>Feedback saved:</strong> yes</p>
      <p><strong>Load comparison:</strong> ${result.comparison.status}</p>
      <p><strong>Expected internal load:</strong> ${result.comparison.expectedInternalLoad}</p>
      <p><strong>Actual internal load:</strong> ${result.comparison.actualInternalLoad}</p>
      <p><strong>Week completed load:</strong> ${result.week?.completedLoad ?? "-"}</p>
      <p><strong>Week completed sessions:</strong> ${result.week?.actualSessionCount ?? "-"}</p>
      <p><strong>Rebalance rationale:</strong> ${result.week?.rebalanceSummary?.rationale || "-"}</p>
    </div>
  `;
}

export function renderFeedbackView({ currentSession, feedbackResult }) {
  return `
    <section class="view-grid two-columns">
      <article class="card">
        <h3>Session feedback</h3>
        ${currentSession ? `
          <p><strong>Current generated session:</strong> ${currentSession.mainObjective} · ${currentSession.expectedDurationMin} min · ${currentSession.expectedLoad}</p>
          <form id="feedback-form" class="feedback-form">
            <label>
              <span>Completed?</span>
              <select name="completed">
                <option value="yes">Yes, session completed</option>
                <option value="no">No, session not completed</option>
              </select>
            </label>
            <label>
              <span>Actual duration (minutes)</span>
              <input type="number" name="actualDurationMin" min="0" value="${currentSession.expectedDurationMin}" required />
            </label>
            <label>
              <span>Session RPE</span>
              <input type="number" name="sessionRPE" min="0" max="10" value="5" required />
            </label>
            <label>
              <span>Pain after (0-10)</span>
              <input type="number" name="painAfterLevel" min="0" max="10" value="0" required />
            </label>
            <label>
              <span>Comments</span>
              <textarea name="comments" rows="4" placeholder="Short coaching note or athlete comment"></textarea>
            </label>
            <button class="primary-button" type="submit">Save feedback and update week</button>
          </form>
        ` : `<p>Generate today's session first before entering feedback.</p>`}
      </article>

      <article class="card">
        <h3>Rebalance summary</h3>
        ${renderRebalanceSummary(feedbackResult)}
      </article>
    </section>
  `;
}
