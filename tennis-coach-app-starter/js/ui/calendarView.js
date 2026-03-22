function renderImportance(level) {
  return `Level ${level ?? "-"}`;
}

function renderPeakTarget(value) {
  return value ? "Yes" : "No";
}

export function renderCalendarView({ events }) {
  return `
    <section class="card">
      <h3>Event calendar</h3>
      <p class="muted">Demo events linked to the active athlete.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Type</th>
              <th>Importance</th>
              <th>Peak target</th>
            </tr>
          </thead>
          <tbody>
            ${events.length
              ? events
                .map(
                  (event) => `
                    <tr>
                      <td>${event.title}</td>
                      <td>${event.startDate}${event.endDate && event.endDate !== event.startDate ? ` → ${event.endDate}` : ""}</td>
                      <td>${event.eventType}</td>
                      <td>${renderImportance(event.importanceLevel)}</td>
                      <td>${renderPeakTarget(event.peakTarget)}</td>
                    </tr>
                  `
                )
                .join("")
              : `<tr><td colspan="5">No events available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
