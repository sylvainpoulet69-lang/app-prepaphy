export function selectTodayGoal(context) {
  return {
    sessionRole: "priority_1",
    mainObjective: "acceleration",
    secondaryIntent: "tennis_transfer_light",
    targetLoad: "moderate",
    freshnessRequirement: "high",
    decisionFlags: ["demo_mode"],
    rationale: "Demo goal selected from starter project."
  };
}
