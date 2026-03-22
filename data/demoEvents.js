export const demoEvents = [
  {
    id: "evt_001",
    athleteId: "ath_youth_001",
    title: "Tournoi régional",
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    eventType: "tournament",
    importanceLevel: 3,
    peakTarget: true,
    preparationRole: "important_event",
    recoveryDemand: "moderate",
    isConfirmed: true,
    notes: ""
  },
  {
    id: "evt_002",
    athleteId: "ath_adult_001",
    title: "Tournoi de préparation",
    startDate: "2026-04-10",
    endDate: "2026-04-11",
    eventType: "tournament",
    importanceLevel: 2,
    peakTarget: false,
    preparationRole: "secondary_event",
    recoveryDemand: "low",
    isConfirmed: true,
    notes: ""
  }
];

export const demoWeeks = [
  {
    id: "week_2026_15_youth",
    athleteId: "ath_youth_001",
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    weekType: "development_specific",
    microcycleType: "youth_development",
    eventDriverId: "evt_001",
    priority1: "acceleration",
    priority2: "force_general",
    supportPriority: "prevention",
    targetSessionCount: 3,
    actualSessionCount: 0,
    defaultSessionDurationMin: 60,
    targetLoad: "moderate",
    plannedLoad: 0,
    completedLoad: 0,
    status: "generated",
    rationale: ""
  }
];

export const demoReadiness = [
  {
    athleteId: "ath_youth_001",
    date: "2026-04-07",
    fatigueLevel: 2,
    muscleSoreness: 2,
    painLevel: 1,
    painLocation: "",
    motivationLevel: 4,
    sleepQuality: 4,
    sleepDurationHours: 8,
    stressLevel: 2,
    availabilityMinutes: 60,
    readinessScore: 4
  }
];
