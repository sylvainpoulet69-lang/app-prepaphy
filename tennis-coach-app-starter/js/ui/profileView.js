function formatAthleteIdentity(athlete) {
  if (!athlete) return "No active athlete selected.";
  return `${athlete.firstName} ${athlete.lastName} · ${athlete.profileType} · ${athlete.level}`;
}

function renderAvailability(athlete) {
  if (!athlete) return "-";
  return `${athlete.weeklyAvailabilityMin} to ${athlete.weeklyAvailabilityMax} sessions / week`;
}

function renderPriorityList(athlete, week, physicalProfile) {
  const items = [
    week?.priority1 || physicalProfile?.priorityQuality1,
    week?.priority2 || physicalProfile?.priorityQuality2,
    week?.supportPriority || athlete?.objectiveSecondary
  ].filter(Boolean);

  return items.length
    ? `<ul class="simple-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<p class="muted">No priorities available.</p>`;
}

export function renderProfileView({ athlete, athleteContext, week }) {
  const development = athleteContext.developmentProfile;
  const physical = athleteContext.physicalProfile;

  return `
    <section class="view-grid two-columns">
      <article class="card">
        <h3>Identity</h3>
        <p><strong>Athlete:</strong> ${formatAthleteIdentity(athlete)}</p>
        <p><strong>Primary objective:</strong> ${athlete?.objectivePrimary || "-"}</p>
        <p><strong>Training age:</strong> ${athlete?.trainingAgeYears ?? "-"} years</p>
        <p><strong>Notes:</strong> ${athlete?.notes || "-"}</p>
      </article>

      <article class="card">
        <h3>Development summary</h3>
        <p><strong>Maturity stage:</strong> ${development?.maturityStage || "-"}</p>
        <p><strong>Growth phase:</strong> ${development?.growthPhase || "-"}</p>
        <p><strong>Coordination sensitivity:</strong> ${development?.coordinationSensitivity || "-"}</p>
        <p><strong>Impact tolerance:</strong> ${development?.impactTolerance || "-"}</p>
      </article>

      <article class="card">
        <h3>Physical profile summary</h3>
        <p><strong>Priority quality 1:</strong> ${physical?.priorityQuality1 || "-"}</p>
        <p><strong>Priority quality 2:</strong> ${physical?.priorityQuality2 || "-"}</p>
        <p><strong>Limiting factor:</strong> ${physical?.limitingFactor || "-"}</p>
        <p><strong>Load tolerance:</strong> ${physical?.loadTolerance || "-"}</p>
        <p><strong>Risk flags:</strong> ${(physical?.injuryRiskFlags || []).join(", ") || "none"}</p>
      </article>

      <article class="card">
        <h3>Weekly availability and priorities</h3>
        <p><strong>Availability:</strong> ${renderAvailability(athlete)}</p>
        <p><strong>Week type:</strong> ${week?.weekType || "-"}</p>
        <p><strong>Microcycle:</strong> ${week?.microcycleType || "-"}</p>
        <div>
          <strong>Key priorities:</strong>
          ${renderPriorityList(athlete, week, physical)}
        </div>
      </article>
    </section>
  `;
}
