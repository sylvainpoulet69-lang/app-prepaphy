import { formatKeyLabel, renderEmptyState, renderTagList } from "./common.js";

function formatLoad(load) {
  return Number.isFinite(load) && load > 0 ? `${Math.round(load)}` : "0";
}

function renderProgressRow(label, actualValue, targetValue, unit = "") {
  const safeActual = Number(actualValue) || 0;
  const safeTarget = Number(targetValue) || 0;
  const ratio = safeTarget > 0 ? Math.min((safeActual / safeTarget) * 100, 100) : 0;

  return `
    <div class="metric-card">
      <div class="metric-row">
        <span>${label}</span>
        <strong>${safeActual}${unit} / ${safeTarget || "-"}${unit}</strong>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span class="progress-bar" style="width: ${ratio}%;"></span>
      </div>
    </div>
  `;
}

export function renderWeekView({ athlete, week }) {
  if (!athlete) {
    return `<section class="card"><h3>Week overview</h3>${renderEmptyState({ title: "No active athlete", message: "Week data depends on the active athlete context." })}</section>`;
  }

  if (!week) {
    return `<section class="card"><h3>Week overview</h3>${renderEmptyState({ title: "No active week", message: "No week covers the current working date for this athlete.", hint: "V1 uses the readiness date to resolve the current week when possible." })}</section>`;
  }

  const priorityItems = [
    `Priority 1 · ${formatKeyLabel(week.priority1)}`,
    `Priority 2 · ${formatKeyLabel(week.priority2)}`,
    `Support · ${formatKeyLabel(week.supportPriority)}`
  ].filter((item) => !item.endsWith("· -"));

  return `
    <section class="view-grid two-columns">
      <article class="card">
        <h3>Current week type</h3>
        <p><strong>Week type:</strong> ${formatKeyLabel(week.weekType)}</p>
        <p><strong>Microcycle:</strong> ${formatKeyLabel(week.microcycleType)}</p>
        <p><strong>Week range:</strong> ${week.startDate} → ${week.endDate}</p>
        <p><strong>Target load profile:</strong> ${formatKeyLabel(week.targetLoad)}</p>
      </article>

      <article class="card">
        <h3>Weekly priorities</h3>
        ${priorityItems.length
          ? renderTagList(priorityItems, "priority-tags")
          : renderEmptyState({
            title: "No weekly priorities",
            message: "This week currently has no explicit priorities.",
            hint: "The engine may fall back to the physical profile when week priorities are missing."
          })}
      </article>

      <article class="card">
        <h3>Session count target vs actual</h3>
        ${renderProgressRow("Planned sessions", week.plannedSessionCount ?? 0, week.targetSessionCount ?? 0)}
        ${renderProgressRow("Completed sessions", week.actualSessionCount ?? 0, week.targetSessionCount ?? 0)}
        <p class="muted">Planned sessions come from generated sessions stored inside the active week window.</p>
      </article>

      <article class="card">
        <h3>Planned vs completed load</h3>
        ${renderProgressRow("Planned load", week.plannedLoad ?? 0, week.completedLoad > 0 ? week.plannedLoad ?? 0 : week.plannedLoad ?? 0, " AU")}
        ${renderProgressRow("Completed load", week.completedLoad ?? 0, week.plannedLoad ?? 0, " AU")}
        <div class="metric-split">
          <p><strong>Planned load:</strong> ${formatLoad(week.plannedLoad)} AU</p>
          <p><strong>Completed load:</strong> ${formatLoad(week.completedLoad)} AU</p>
        </div>
        <p class="muted">Load is shown as simple internal load units in V1 for readability, not as a full monitoring model.</p>
      </article>
    </section>
  `;
}
