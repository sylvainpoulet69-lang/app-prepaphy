export const trainingBlocks = [
  {
    id: "speed_acceleration_short",
    name: "Accélération courte",
    family: "speed",
    subType: "acceleration",
    sportContext: "tennis_intermitent",
    primaryObjective: "acceleration",
    secondaryObjectives: ["first_step", "horizontal_force"],
    energySystem: "alactic_atp_pcr",
    dominantStress: { metabolic: "low", neural: "high", mechanical: "moderate", cognitive: "low" },
    scientificPrescription: {
      effortType: "maximal_sprint",
      intensity: "max",
      durationRange: "short",
      distanceRange: "10-40m",
      repRange: "3-8",
      setRange: "2-6",
      recoveryRep: "45s-3min passive",
      recoverySet: "5-7min",
      stopCriteria: ["performance_drop", "technical_degradation"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: false, canBeTransfer: false, recommendedPosition: ["start"] },
    constraints: {
      minimumLevel: "beginner",
      minimumFreshness: "high",
      ageRestrictions: "volume_reduce_if_young",
      injuryContraindications: ["acute_hamstring_issue", "acute_knee_pain"],
      eventRestrictions: [],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["coordination_locomotor", "plyo_reactive_light", "tennis_movement_pattern"],
      cautionWith: ["strength_dynamic_power"],
      avoidWith: ["aerobic_hiit_short", "speed_rst"]
    },
    adaptationRules: {
      beginner: "lower reps and distance",
      intermediate: "mid range prescription",
      advanced: "upper range if freshness is good",
      highFatigue: "reduce strongly or remove block",
      competitionProximity: "keep low volume high quality if useful"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "high" },
    evidence: { evidenceType: "direct_prescription", confidenceLevel: "strong", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "speed_max_velocity",
    name: "Vitesse maximale",
    family: "speed",
    subType: "max_velocity",
    sportContext: "tennis_general_speed_ceiling",
    primaryObjective: "max_speed",
    secondaryObjectives: ["stride_frequency", "neuromuscular_efficiency"],
    energySystem: "alactic_atp_pcr",
    dominantStress: { metabolic: "low", neural: "very_high", mechanical: "moderate", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "maximal_sprint",
      intensity: "max",
      durationRange: "short",
      distanceRange: "30-60m",
      repRange: "3-6",
      setRange: "2-6",
      recoveryRep: "2.5-3min passive",
      recoverySet: "6-8min",
      stopCriteria: ["performance_drop", "technical_degradation"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: false, canBeTransfer: false, recommendedPosition: ["start"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "high",
      ageRestrictions: "reduced_exposure_if_young",
      injuryContraindications: ["acute_hamstring_issue"],
      eventRestrictions: ["avoid_if_fatigue_close_to_event"],
      durationCompatibility: [60, 90]
    },
    compatibility: {
      goodWith: ["coordination_locomotor", "plyo_reactive_light"],
      cautionWith: ["speed_acceleration_short"],
      avoidWith: ["aerobic_hiit_short", "speed_rst"]
    },
    adaptationRules: {
      beginner: "usually not priority",
      intermediate: "lower-mid volume",
      advanced: "full prescription possible",
      highFatigue: "remove block",
      competitionProximity: "very low volume only"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "very_high" },
    evidence: { evidenceType: "direct_prescription", confidenceLevel: "strong", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "speed_rst",
    name: "RST",
    family: "speed",
    subType: "repeated_sprint",
    sportContext: "tennis_specific",
    primaryObjective: "repeated_sprint",
    secondaryObjectives: ["speed_endurance", "recovery_between_efforts"],
    energySystem: "mixed",
    dominantStress: { metabolic: "high", neural: "high", mechanical: "moderate", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "repeated_sprint",
      intensity: "max",
      durationRange: "2-6s",
      distanceRange: "10-30m",
      repRange: "4-10",
      setRange: "2-5",
      recoveryRep: "20-40s",
      recoverySet: "2-4min",
      stopCriteria: ["large_performance_drop", "technical_degradation"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: false, canBeTransfer: false, recommendedPosition: ["middle", "start"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "moderate",
      ageRestrictions: "careful_if_young",
      injuryContraindications: ["acute_hamstring_issue", "acute_knee_pain"],
      eventRestrictions: ["avoid_close_to_major_event"],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["prevention_ankle_knee"],
      cautionWith: ["tennis_movement_pattern"],
      avoidWith: ["speed_max_velocity", "aerobic_hiit_short", "plyo_reactive_light"]
    },
    adaptationRules: {
      beginner: "lower reps and sets",
      intermediate: "standard prescription",
      advanced: "upper range allowed",
      highFatigue: "reduce strongly or remove block",
      competitionProximity: "avoid heavy formats"
    },
    loadProfile: { estimatedInternalLoad: "high", weeklyCost: "high", freshnessCost: "high" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "aerobic_hiit_short",
    name: "HIIT court",
    family: "aerobic",
    subType: "hiit_short",
    sportContext: "tennis_conditioning_support",
    primaryObjective: "aerobic_power",
    secondaryObjectives: ["recovery_between_high_intensity_efforts"],
    energySystem: "oxidative_high",
    dominantStress: { metabolic: "high", neural: "moderate", mechanical: "moderate", cognitive: "low" },
    scientificPrescription: {
      effortType: "intervals",
      intensity: "90-105% VMA/PMA",
      durationRange: "15-20s work",
      distanceRange: "",
      repRange: "15-30",
      setRange: "1-3",
      recoveryRep: "15-20s",
      recoverySet: "2-4min",
      stopCriteria: ["unable_to_hold_target_intensity"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: false, canBeTransfer: false, recommendedPosition: ["middle"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "moderate",
      ageRestrictions: "careful_if_young",
      injuryContraindications: ["acute_lower_limb_pain"],
      eventRestrictions: ["avoid_close_to_major_event"],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["core_stability", "prevention_ankle_knee"],
      cautionWith: ["tennis_constrained_play_light"],
      avoidWith: ["speed_max_velocity", "speed_acceleration_short", "plyo_reactive_light"]
    },
    adaptationRules: {
      beginner: "reduced volume and conservative intensity",
      intermediate: "standard prescription",
      advanced: "higher work time possible",
      highFatigue: "reduce volume first",
      competitionProximity: "volume down or remove"
    },
    loadProfile: { estimatedInternalLoad: "high", weeklyCost: "high", freshnessCost: "moderate" },
    evidence: { evidenceType: "direct_prescription", confidenceLevel: "strong", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "aerobic_intervals_medium",
    name: "Intervalles moyens VMA-PMA",
    family: "aerobic",
    subType: "vo2max_medium_intervals",
    sportContext: "tennis_conditioning_support",
    primaryObjective: "aerobic_power",
    secondaryObjectives: ["vo2max"],
    energySystem: "oxidative_high",
    dominantStress: { metabolic: "high", neural: "moderate", mechanical: "moderate", cognitive: "low" },
    scientificPrescription: {
      effortType: "intervals",
      intensity: "90-105% VMA/PMA",
      durationRange: "1-4min",
      distanceRange: "",
      repRange: "context_dependent",
      setRange: "context_dependent",
      recoveryRep: "active_or_passive_depends_on_goal",
      recoverySet: "context_dependent",
      stopCriteria: ["unable_to_hold_target_intensity"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: false, canBeTransfer: false, recommendedPosition: ["middle"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "moderate",
      ageRestrictions: "careful_if_young",
      injuryContraindications: ["acute_lower_limb_pain"],
      eventRestrictions: ["avoid_close_to_major_event"],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["core_stability", "prevention_ankle_knee"],
      cautionWith: ["coordination_locomotor"],
      avoidWith: ["speed_max_velocity", "speed_rst"]
    },
    adaptationRules: {
      beginner: "reduced volume and conservative intensity",
      intermediate: "standard prescription",
      advanced: "higher total work time possible",
      highFatigue: "reduce volume first",
      competitionProximity: "volume down or remove"
    },
    loadProfile: { estimatedInternalLoad: "high", weeklyCost: "high", freshnessCost: "moderate" },
    evidence: { evidenceType: "direct_prescription", confidenceLevel: "strong", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "strength_dynamic_power",
    name: "Force dynamique / puissance",
    family: "strength",
    subType: "dynamic_power",
    sportContext: "tennis_transfer",
    primaryObjective: "power",
    secondaryObjectives: ["fast_force_production"],
    energySystem: "neuromuscular",
    dominantStress: { metabolic: "moderate", neural: "high", mechanical: "moderate", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "explosive_resistance",
      intensity: "30-70% 1RM",
      durationRange: "",
      distanceRange: "",
      repRange: "3-6",
      setRange: "3-5",
      recoveryRep: "",
      recoverySet: "2-4min",
      stopCriteria: ["velocity_loss", "technical_degradation"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: true, canBeTransfer: false, recommendedPosition: ["start", "middle"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "high",
      ageRestrictions: "bodyweight_or_light_load_if_young",
      injuryContraindications: ["acute_back_pain", "acute_knee_pain"],
      eventRestrictions: ["limit_close_to_major_event"],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["plyo_reactive_light", "tennis_movement_pattern", "core_stability"],
      cautionWith: ["speed_acceleration_short"],
      avoidWith: ["aerobic_hiit_short", "speed_rst"]
    },
    adaptationRules: {
      beginner: "technical and light versions",
      intermediate: "standard prescription",
      advanced: "full prescription possible",
      highFatigue: "reduce load or remove",
      competitionProximity: "lower volume"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "high" },
    evidence: { evidenceType: "theory_plus_practice_framework", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "strength_general_unilateral",
    name: "Force générale unilatérale",
    family: "strength",
    subType: "general_unilateral",
    sportContext: "tennis_transfer",
    primaryObjective: "force_general",
    secondaryObjectives: ["stability", "imbalance_reduction"],
    energySystem: "neuromuscular",
    dominantStress: { metabolic: "moderate", neural: "moderate", mechanical: "moderate", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "unilateral_strength",
      intensity: "moderate",
      durationRange: "",
      distanceRange: "",
      repRange: "6-12",
      setRange: "2-4",
      recoveryRep: "",
      recoverySet: "1-2min",
      stopCriteria: ["technical_degradation", "stability_loss"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: true, canBeTransfer: false, recommendedPosition: ["middle", "end"] },
    constraints: {
      minimumLevel: "beginner",
      minimumFreshness: "moderate",
      ageRestrictions: "bodyweight_if_young_beginner",
      injuryContraindications: ["acute_knee_pain"],
      eventRestrictions: [],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["core_stability", "prevention_ankle_knee", "tennis_movement_pattern"],
      cautionWith: ["plyo_reactive_light"],
      avoidWith: []
    },
    adaptationRules: {
      beginner: "bodyweight and simple patterns",
      intermediate: "moderate load",
      advanced: "higher challenge allowed",
      highFatigue: "reduce volume",
      competitionProximity: "keep only if low cost"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "moderate" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "core_stability",
    name: "Gainage / stabilité tronc",
    family: "strength",
    subType: "core",
    sportContext: "general_support",
    primaryObjective: "support_recovery",
    secondaryObjectives: ["stability", "force_transfer"],
    energySystem: "low_metabolic",
    dominantStress: { metabolic: "low", neural: "low", mechanical: "low", cognitive: "low" },
    scientificPrescription: {
      effortType: "isometric_or_controlled_dynamic",
      intensity: "low-moderate",
      durationRange: "20-60s",
      distanceRange: "",
      repRange: "2-5",
      setRange: "2-4",
      recoveryRep: "",
      recoverySet: "short",
      stopCriteria: ["loss_of_alignment"]
    },
    sessionRole: { canBePrimary: false, canBeSecondary: true, canBeTransfer: false, recommendedPosition: ["end", "middle"] },
    constraints: {
      minimumLevel: "beginner",
      minimumFreshness: "low",
      ageRestrictions: "",
      injuryContraindications: [],
      eventRestrictions: [],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["speed_acceleration_short", "aerobic_hiit_short", "strength_dynamic_power", "tennis_movement_pattern"],
      cautionWith: [],
      avoidWith: []
    },
    adaptationRules: {
      beginner: "static basic positions",
      intermediate: "mixed positions",
      advanced: "dynamic or anti-rotation versions",
      highFatigue: "keep if technical quality is preserved",
      competitionProximity: "low-cost version only"
    },
    loadProfile: { estimatedInternalLoad: "low", weeklyCost: "low", freshnessCost: "low" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "plyo_reactive_light",
    name: "Plyométrie réactive légère",
    family: "plyo",
    subType: "reactive_light",
    sportContext: "tennis_transfer",
    primaryObjective: "power",
    secondaryObjectives: ["reactivity", "ground_contact_quality"],
    energySystem: "neuromuscular",
    dominantStress: { metabolic: "low", neural: "high", mechanical: "moderate", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "plyometric",
      intensity: "high",
      durationRange: "",
      distanceRange: "",
      repRange: "3-10",
      setRange: "2-5",
      recoveryRep: "",
      recoverySet: "1-3min",
      stopCriteria: ["loss_of_reactivity", "technical_degradation"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: true, canBeTransfer: false, recommendedPosition: ["start", "middle"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "high",
      ageRestrictions: "low_volume_if_young",
      injuryContraindications: ["acute_knee_pain", "acute_ankle_pain"],
      eventRestrictions: ["limit_if_major_event_close"],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["speed_acceleration_short", "coordination_locomotor", "tennis_movement_pattern"],
      cautionWith: ["strength_dynamic_power"],
      avoidWith: ["aerobic_hiit_short", "speed_rst"]
    },
    adaptationRules: {
      beginner: "very low intensity versions",
      intermediate: "standard low-moderate volume",
      advanced: "more reactive content allowed",
      highFatigue: "remove block",
      competitionProximity: "light contacts only if relevant"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "high" },
    evidence: { evidenceType: "theory_plus_practice_framework", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "coordination_locomotor",
    name: "Coordination locomotrice",
    family: "coordination",
    subType: "locomotor",
    sportContext: "movement_quality",
    primaryObjective: "coordination",
    secondaryObjectives: ["technique", "rhythm"],
    energySystem: "low_metabolic",
    dominantStress: { metabolic: "low", neural: "moderate", mechanical: "low", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "coordination_drills",
      intensity: "low-moderate",
      durationRange: "short",
      distanceRange: "",
      repRange: "quality_based",
      setRange: "quality_based",
      recoveryRep: "as needed",
      recoverySet: "as needed",
      stopCriteria: ["technical_degradation"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: true, canBeTransfer: false, recommendedPosition: ["start", "middle"] },
    constraints: {
      minimumLevel: "beginner",
      minimumFreshness: "moderate",
      ageRestrictions: "",
      injuryContraindications: [],
      eventRestrictions: [],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["speed_acceleration_short", "speed_max_velocity", "tennis_movement_pattern", "prevention_ankle_knee"],
      cautionWith: ["aerobic_hiit_short"],
      avoidWith: []
    },
    adaptationRules: {
      beginner: "simple patterns and low complexity",
      intermediate: "more rhythm and control demands",
      advanced: "higher complexity and reactive options",
      highFatigue: "keep only simple quality",
      competitionProximity: "good light option"
    },
    loadProfile: { estimatedInternalLoad: "low", weeklyCost: "low", freshnessCost: "moderate" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "tennis_movement_pattern",
    name: "Déplacements tennis",
    family: "tennis_transfer",
    subType: "movement_pattern",
    sportContext: "tennis_specific",
    primaryObjective: "tennis_movement",
    secondaryObjectives: ["footwork", "replacement", "appuis"],
    energySystem: "mixed_low_to_moderate",
    dominantStress: { metabolic: "moderate", neural: "moderate", mechanical: "moderate", cognitive: "moderate" },
    scientificPrescription: {
      effortType: "tennis_movement_drill",
      intensity: "moderate-high",
      durationRange: "5-20s",
      distanceRange: "",
      repRange: "6-20",
      setRange: "2-5",
      recoveryRep: "20-60s",
      recoverySet: "1-3min",
      stopCriteria: ["movement_quality_drop"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: true, canBeTransfer: true, recommendedPosition: ["middle", "end"] },
    constraints: {
      minimumLevel: "beginner",
      minimumFreshness: "moderate",
      ageRestrictions: "",
      injuryContraindications: ["acute_knee_pain", "acute_ankle_pain"],
      eventRestrictions: [],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["speed_acceleration_short", "strength_dynamic_power", "coordination_locomotor", "prevention_ankle_knee"],
      cautionWith: ["aerobic_hiit_short", "speed_rst"],
      avoidWith: []
    },
    adaptationRules: {
      beginner: "simple no-ball or low-complexity patterns",
      intermediate: "direction changes and moderate speed",
      advanced: "more open and specific patterns",
      highFatigue: "simplify pattern and reduce volume",
      competitionProximity: "keep high quality low volume"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "moderate" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "tennis_constrained_play_light",
    name: "Jeu spécifique sous contrainte léger",
    family: "tennis_transfer",
    subType: "constrained_play_light",
    sportContext: "tennis_specific",
    primaryObjective: "tennis_under_constraint",
    secondaryObjectives: ["technical_quality_under_controlled_fatigue"],
    energySystem: "mixed",
    dominantStress: { metabolic: "moderate", neural: "moderate", mechanical: "moderate", cognitive: "high" },
    scientificPrescription: {
      effortType: "constrained_play",
      intensity: "moderate",
      durationRange: "30s-2min",
      distanceRange: "",
      repRange: "4-10",
      setRange: "2-4",
      recoveryRep: "30s-2min",
      recoverySet: "1-3min",
      stopCriteria: ["technical_or_tactical_quality_drop"]
    },
    sessionRole: { canBePrimary: true, canBeSecondary: true, canBeTransfer: true, recommendedPosition: ["end", "middle"] },
    constraints: {
      minimumLevel: "intermediate",
      minimumFreshness: "moderate",
      ageRestrictions: "simplify_if_young",
      injuryContraindications: [],
      eventRestrictions: ["keep_light_close_to_major_event"],
      durationCompatibility: [60, 90]
    },
    compatibility: {
      goodWith: ["tennis_movement_pattern", "coordination_locomotor", "core_stability"],
      cautionWith: ["aerobic_hiit_short", "speed_rst"],
      avoidWith: []
    },
    adaptationRules: {
      beginner: "usually use simplified patterns",
      intermediate: "standard light constrained play",
      advanced: "higher tactical complexity allowed",
      highFatigue: "reduce complexity and volume",
      competitionProximity: "light confidence-building only"
    },
    loadProfile: { estimatedInternalLoad: "moderate", weeklyCost: "moderate", freshnessCost: "moderate" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  },
  {
    id: "prevention_ankle_knee",
    name: "Prévention cheville/genou",
    family: "prevention",
    subType: "ankle_knee",
    sportContext: "support",
    primaryObjective: "support_recovery",
    secondaryObjectives: ["robustness", "joint_control"],
    energySystem: "low_metabolic",
    dominantStress: { metabolic: "low", neural: "low", mechanical: "low", cognitive: "low" },
    scientificPrescription: {
      effortType: "targeted_prevention",
      intensity: "low",
      durationRange: "5-15min",
      distanceRange: "",
      repRange: "2-5 exercises",
      setRange: "2-4",
      recoveryRep: "",
      recoverySet: "short",
      stopCriteria: ["loss_of_quality"]
    },
    sessionRole: { canBePrimary: false, canBeSecondary: true, canBeTransfer: false, recommendedPosition: ["end", "start"] },
    constraints: {
      minimumLevel: "beginner",
      minimumFreshness: "low",
      ageRestrictions: "",
      injuryContraindications: [],
      eventRestrictions: [],
      durationCompatibility: [45, 60, 90]
    },
    compatibility: {
      goodWith: ["speed_acceleration_short", "aerobic_hiit_short", "strength_general_unilateral", "tennis_movement_pattern"],
      cautionWith: [],
      avoidWith: []
    },
    adaptationRules: {
      beginner: "simple stability drills",
      intermediate: "mixed prevention menu",
      advanced: "more specific control / stiffness drills",
      highFatigue: "keep if quality stays good",
      competitionProximity: "low-cost option allowed"
    },
    loadProfile: { estimatedInternalLoad: "low", weeklyCost: "low", freshnessCost: "low" },
    evidence: { evidenceType: "expert_derived", confidenceLevel: "moderate", sourceRefs: ["conversation_spec"] }
  }
];
