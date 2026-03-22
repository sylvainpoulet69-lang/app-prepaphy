export function getCandidateBlocks(goal, blockLibrary) {
  const byObjective = {
    acceleration: {
      main: ["speed_acceleration_short"],
      secondary: ["coordination_locomotor", "prevention_ankle_knee"],
      transfer: ["tennis_movement_pattern"],
      support: ["core_stability", "prevention_ankle_knee"]
    },
    max_speed: {
      main: ["speed_max_velocity"],
      secondary: ["coordination_locomotor"],
      transfer: ["tennis_movement_pattern"],
      support: ["core_stability", "prevention_ankle_knee"]
    },
    repeated_sprint: {
      main: ["speed_rst"],
      secondary: ["prevention_ankle_knee"],
      transfer: ["tennis_movement_pattern"],
      support: ["core_stability"]
    },
    aerobic_power: {
      main: ["aerobic_hiit_short", "aerobic_intervals_medium"],
      secondary: ["core_stability"],
      transfer: [],
      support: ["prevention_ankle_knee"]
    },
    power: {
      main: ["strength_dynamic_power", "plyo_reactive_light"],
      secondary: ["core_stability", "prevention_ankle_knee"],
      transfer: ["tennis_movement_pattern"],
      support: ["coordination_locomotor"]
    },
    force_general: {
      main: ["strength_general_unilateral"],
      secondary: ["core_stability", "prevention_ankle_knee"],
      transfer: ["tennis_movement_pattern"],
      support: ["coordination_locomotor"]
    },
    coordination: {
      main: ["coordination_locomotor"],
      secondary: ["prevention_ankle_knee"],
      transfer: ["tennis_movement_pattern"],
      support: ["core_stability"]
    },
    tennis_movement: {
      main: ["tennis_movement_pattern"],
      secondary: ["coordination_locomotor", "prevention_ankle_knee"],
      transfer: ["tennis_constrained_play_light"],
      support: ["core_stability"]
    },
    support_recovery: {
      main: ["prevention_ankle_knee", "core_stability"],
      secondary: ["coordination_locomotor"],
      transfer: [],
      support: []
    }
  };

  const mapping = byObjective[goal.mainObjective] || byObjective.support_recovery;
  const findBlocks = (ids) => blockLibrary.filter((b) => ids.includes(b.id));

  return {
    mainCandidates: findBlocks(mapping.main),
    secondaryCandidates: findBlocks(mapping.secondary),
    transferCandidates: findBlocks(mapping.transfer),
    supportCandidates: findBlocks(mapping.support)
  };
}
