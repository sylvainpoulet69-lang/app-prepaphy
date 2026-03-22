import { formatKeyLabel, renderEmptyState, renderTagList } from "./common.js";

function formatAthleteIdentity(athlete) {
  if (!athlete) return "No active athlete selected.";
  return `${athlete.firstName} ${athlete.lastName} · ${formatKeyLabel(athlete.profileType)} · ${formatKeyLabel(athlete.level)}`;
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
    ? `<ul class="simple-list">${items.map((item) => `<li>${formatKeyLabel(item)}</li>`).join("")}</ul>`
    : renderEmptyState({
      title: "No priorities available",
      message: "The active athlete does not yet expose week or profile priorities.",
      hint: "V1 reads priorities from the week first, then falls back to the physical profile."
    });
}

export function renderProfileView({ athlete, athleteContext, week }) {
  if (!athlete) {
    return `
      <section class="card">
        <h3>Identity</h3>
        ${renderEmptyState({
          title: "No active athlete",
          message: "The profile screen needs an active athlete to display context.",
          actionLabel: "Load a demo athlete before reviewing profile, week, session, or feedback data."
        })}
      </section>
    `;
  }

  const development = athleteContext.developmentProfile;
  const physical = athleteContext.physicalProfile;

  return `
    <section class="view-grid two-columns">
      <article class="card">
        <h3>Identity</h3>
        <p><strong>Athlete:</strong> ${formatAthleteIdentity(athlete)}</p>
        <p><strong>Primary objective:</strong> ${formatKeyLabel(athlete?.objectivePrimary)}</p>
        <p><strong>Training age:</strong> ${athlete?.trainingAgeYears ?? "-"} years</p>
        <p><strong>Notes:</strong> ${athlete?.notes || "-"}</p>
      </article>

      <article class="card">
        <h3>Development summary</h3>
        ${development ? `
          <p><strong>Maturity stage:</strong> ${formatKeyLabel(development.maturityStage)}</p>
          <p><strong>Growth phase:</strong> ${formatKeyLabel(development.growthPhase)}</p>
          <p><strong>Coordination sensitivity:</strong> ${formatKeyLabel(development.coordinationSensitivity)}</p>
          <p><strong>Impact tolerance:</strong> ${formatKeyLabel(development.impactTolerance)}</p>
        ` : renderEmptyState({
          title: "No development profile",
          message: "Development markers are missing for the active athlete.",
          hint: "Youth-specific maturity and growth guidance will stay limited until this context exists."
        })}
      </article>

      <article class="card">
        <h3>Physical profile summary</h3>
        ${physical ? `
          <p><strong>Priority quality 1:</strong> ${formatKeyLabel(physical.priorityQuality1)}</p>
          <p><strong>Priority quality 2:</strong> ${formatKeyLabel(physical.priorityQuality2)}</p>
          <p><strong>Limiting factor:</strong> ${formatKeyLabel(physical.limitingFactor)}</p>
          <p><strong>Load tolerance:</strong> ${formatKeyLabel(physical.loadTolerance)}</p>
          <div>
            <strong>Risk flags:</strong>
            ${renderTagList((physical.injuryRiskFlags || []).map(formatKeyLabel), "compact-tags")}
          </div>
        ` : renderEmptyState({
          title: "No physical profile",
          message: "The engine has limited profiling inputs for this athlete.",
          hint: "Weekly priorities can still come from the active week when available."
        })}
      </article>

      <article class="card">
        <h3>Weekly availability and priorities</h3>
        <p><strong>Availability:</strong> ${renderAvailability(athlete)}</p>
        <p><strong>Week type:</strong> ${formatKeyLabel(week?.weekType)}</p>
        <p><strong>Microcycle:</strong> ${formatKeyLabel(week?.microcycleType)}</p>
        <div>
          <strong>Key priorities:</strong>
          ${renderPriorityList(athlete, week, physical)}
        </div>
      </article>
    </section>
  `;
}
