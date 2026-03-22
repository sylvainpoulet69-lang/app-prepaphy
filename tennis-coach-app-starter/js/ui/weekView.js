function formatLoad(load) {
  return Number.isFinite(load) && load > 0 ? `${load}` : "-";
}

export function renderWeekView({ week }) {
  if (!week) {
    return `<section class="card"><h3>Week overview</h3><p>No active week found.</p></section>`;
  }

  return `
    <section class="view-grid two-columns">
      <article class="card">
        <h3>Current week type</h3>
        <p><strong>Week type:</strong> ${week.weekType}</p>
        <p><strong>Microcycle:</strong> ${week.microcycleType}</p>
        <p><strong>Week range:</strong> ${week.startDate} → ${week.endDate}</p>
      </article>

      <article class="card">
        <h3>Weekly priorities</h3>
        <ul class="simple-list">
          <li><strong>Priority 1:</strong> ${week.priority1 || "-"}</li>
          <li><strong>Priority 2:</strong> ${week.priority2 || "-"}</li>
          <li><strong>Support:</strong> ${week.supportPriority || "-"}</li>
        </ul>
      </article>

      <article class="card">
        <h3>Session count target vs actual</h3>
        <p><strong>Target sessions:</strong> ${week.targetSessionCount ?? "-"}</p>
        <p><strong>Planned sessions:</strong> ${week.plannedSessionCount ?? 0}</p>
        <p><strong>Completed sessions:</strong> ${week.actualSessionCount ?? 0}</p>
      </article>

      <article class="card">
        <h3>Planned vs completed load</h3>
        <p><strong>Planned load:</strong> ${formatLoad(week.plannedLoad)}</p>
        <p><strong>Completed load:</strong> ${formatLoad(week.completedLoad)}</p>
        <p class="muted">Load is shown as internal load units when available.</p>
      </article>
    </section>
  `;
}
