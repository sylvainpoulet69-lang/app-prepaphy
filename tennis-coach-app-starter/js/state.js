export const state = {
  activeAthleteId: "ath_youth_001",
  activeScreen: "profile",
  athletes: [],
  developmentProfiles: [],
  physicalProfiles: [],
  events: [],
  weeks: [],
  sessions: [],
  readiness: [],
  feedbacks: [],
  blocks: [],
  currentSession: null,
  feedbackResult: null
};

export function setState(partial) {
  Object.assign(state, partial);
}
