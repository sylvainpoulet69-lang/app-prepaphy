export const state = {
  activeAthleteId: "ath_youth_001",
  athletes: [],
  developmentProfiles: [],
  physicalProfiles: [],
  events: [],
  weeks: [],
  sessions: [],
  readiness: [],
  feedbacks: [],
  blocks: []
};

export function setState(partial) {
  Object.assign(state, partial);
}
