import { formatKeyLabel, renderEmptyState, renderNotice } from "./common.js";

function renderRebalanceSummary(result) {
  if (!result) {
    return renderEmptyState({
      title: "No feedback submitted yet",
      message: "Submit session feedback to update the week and show the rebalance summary.",
      hint: "V1 saves feedback in memory only for the current browser session."
    });
  }

  return `
    <div class="result-panel">
      <p><strong>Feedback saved:</strong> yes</p>
      <p><strong>Load comparison:</strong> ${formatKeyLabel(result.comparison.status)}</p>
      <p><strong>Expected internal load:</strong> ${result.comparison.expectedInternalLoad}</p>
      <p><strong>Actual internal load:</strong> ${result.comparison.actualInternalLoad}</p>
      <p><strong>Week completed load:</strong> ${result.week?.completedLoad ?? "-"}</p>
      <p><strong>Week completed sessions:</strong> ${result.week?.actualSessionCount ?? "-"}</p>
      <p><strong>Rebalance rationale:</strong> ${result.week?.rebalanceSummary?.rationale || "-"}</p>
    </div>
  `;
}

export function renderFeedbackView({ currentSession, feedbackResult, feedbackStatus }) {
  const canSubmit = Boolean(currentSession?.isValid);
  const feedbackNotice = feedbackStatus?.message
    ? renderNotice({ tone: feedbackStatus.type === "error" ? "warning" : "success", title: feedbackStatus.type === "error" ? "Feedback incomplete" : "Feedback saved", message: feedbackStatus.message })
    : renderNotice({ tone: "info", title: "Feedback safety", message: "Required fields must be valid before submission. The submit button stays disabled until the form is complete." });

  return `
    <section class="view-grid two-columns">
      <article class="card">
        <h3>Session feedback</h3>
        ${canSubmit ? `
          <p><strong>Current generated session:</strong> ${formatKeyLabel(currentSession.mainObjective)} · ${currentSession.expectedDurationMin} min · ${formatKeyLabel(currentSession.expectedLoad)}</p>
          ${feedbackNotice}
          <form id="feedback-form" class="feedback-form" novalidate>
            <div id="feedback-errors" class="form-errors" aria-live="polite"></div>
            <label>
              <span>Completed?</span>
              <select name="completed" required>
                <option value="yes">Yes, session completed</option>
                <option value="no">No, session not completed</option>
              </select>
            </label>
            <label>
              <span>Actual duration (minutes)</span>
              <input type="number" name="actualDurationMin" min="1" max="240" value="${currentSession.expectedDurationMin}" required />
            </label>
            <label>
              <span>Session RPE</span>
              <input type="number" name="sessionRPE" min="1" max="10" value="5" required />
            </label>
            <label>
              <span>Pain after (0-10)</span>
              <input type="number" name="painAfterLevel" min="0" max="10" value="0" required />
            </label>
            <label>
              <span>Comments</span>
              <textarea name="comments" rows="4" placeholder="Short coaching note or athlete comment"></textarea>
            </label>
            <button class="primary-button" type="submit" data-feedback-submit disabled>Save feedback and update week</button>
          </form>
        ` : `
          ${renderEmptyState({
            title: currentSession ? "Session is not safe to submit" : "No session available for feedback",
            message: currentSession
              ? "Feedback is locked because the current session does not contain a valid main block."
              : "Generate today's session first before entering feedback.",
            hint: "The feedback screen only accepts valid generated sessions to avoid broken week metrics."
          })}
        `}
      </article>

      <article class="card">
        <h3>Rebalance summary</h3>
        ${renderRebalanceSummary(feedbackResult)}
      </article>
    </section>
  `;
}
