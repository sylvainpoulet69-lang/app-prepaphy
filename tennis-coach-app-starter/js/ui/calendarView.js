import { formatKeyLabel, renderEmptyState } from "./common.js";

function renderImportance(level) {
  return level ? `Level ${level}` : "-";
}

function renderPeakTarget(value) {
  return value ? "Yes" : "No";
}

export function renderCalendarView({ athlete, events }) {
  return `
    <section class="card">
      <h3>Event calendar</h3>
      <p class="muted">Demo events linked to the active athlete.</p>
      ${!athlete
        ? renderEmptyState({
          title: "No active athlete",
          message: "Select or load an athlete before checking the competition calendar."
        })
        : events.length
          ? `
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
                  ${events
                    .map(
                      (event) => `
                        <tr>
                          <td>${event.title}</td>
                          <td>${event.startDate}${event.endDate && event.endDate !== event.startDate ? ` → ${event.endDate}` : ""}</td>
                          <td>${formatKeyLabel(event.eventType)}</td>
                          <td>${renderImportance(event.importanceLevel)}</td>
                          <td>${renderPeakTarget(event.peakTarget)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
          : renderEmptyState({
            title: "No events scheduled",
            message: "This athlete has no demo events in the current V1 dataset.",
            hint: "The engine will still use weekly priorities, but pre-competition activation decisions will stay limited."
          })}
    </section>
  `;
}
