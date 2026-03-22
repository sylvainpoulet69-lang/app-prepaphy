export function loadAthleteContext(state, athleteId) {
  return {
    athlete: state.athletes.find((a) => a.id === athleteId),
    developmentProfile: state.developmentProfiles.find((d) => d.athleteId === athleteId),
    physicalProfile: state.physicalProfiles.find((p) => p.athleteId === athleteId),
    events: state.events.filter((e) => e.athleteId === athleteId),
    weeks: state.weeks.filter((w) => w.athleteId === athleteId),
    readiness: state.readiness.filter((r) => r.athleteId === athleteId),
    feedbacks: state.feedbacks.filter((f) => f.athleteId === athleteId)
  };
}
