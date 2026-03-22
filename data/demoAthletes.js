export const demoAthletes = [
  {
    id: "ath_youth_001",
    firstName: "Joueuse",
    lastName: "Jeune",
    birthDate: "2012-05-12",
    sex: "female",
    sport: "tennis",
    level: "intermediate",
    profileType: "youth",
    trainingAgeYears: 2,
    weeklyAvailabilityMin: 3,
    weeklyAvailabilityMax: 5,
    objectivePrimary: "development",
    objectiveSecondary: "performance",
    notes: "Profil jeune, priorité vitesse / coordination",
    isActive: true
  },
  {
    id: "ath_adult_001",
    firstName: "Joueur",
    lastName: "Adulte",
    birthDate: "1997-03-20",
    sex: "male",
    sport: "tennis",
    level: "competitor",
    profileType: "adult",
    trainingAgeYears: 8,
    weeklyAvailabilityMin: 3,
    weeklyAvailabilityMax: 5,
    objectivePrimary: "performance",
    objectiveSecondary: "robustness",
    notes: "Compétiteur adulte, bonne tolérance de charge",
    isActive: false
  }
];

export const demoDevelopmentProfiles = [
  {
    athleteId: "ath_youth_001",
    maturityStage: "around_growth_spurt",
    growthPhase: "moderate",
    heightCm: 156,
    weightKg: 45,
    recentGrowthRate: "moderate",
    coordinationSensitivity: "high",
    impactTolerance: "moderate",
    comments: ""
  },
  {
    athleteId: "ath_adult_001",
    maturityStage: "post",
    growthPhase: "low",
    heightCm: 182,
    weightKg: 76,
    recentGrowthRate: "low",
    coordinationSensitivity: "moderate",
    impactTolerance: "high",
    comments: ""
  }
];

export const demoPhysicalProfiles = [
  {
    athleteId: "ath_youth_001",
    speedLevel: 2,
    accelerationLevel: 2,
    agilityLevel: 3,
    coordinationLevel: 2,
    forceLevel: 2,
    powerLevel: 2,
    aerobicLevel: 3,
    repeatedSprintLevel: 2,
    mobilityLevel: 3,
    robustnessLevel: 2,
    priorityQuality1: "acceleration",
    priorityQuality2: "force_general",
    limitingFactor: "acceleration",
    loadTolerance: "moderate",
    injuryRiskFlags: ["knee_watch"]
  },
  {
    athleteId: "ath_adult_001",
    speedLevel: 3,
    accelerationLevel: 3,
    agilityLevel: 3,
    coordinationLevel: 3,
    forceLevel: 3,
    powerLevel: 2,
    aerobicLevel: 3,
    repeatedSprintLevel: 3,
    mobilityLevel: 3,
    robustnessLevel: 3,
    priorityQuality1: "power",
    priorityQuality2: "tennis_movement",
    limitingFactor: "power",
    loadTolerance: "high",
    injuryRiskFlags: []
  }
];
