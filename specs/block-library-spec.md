# Block Library Spec

## Format standard d'un bloc

Chaque bloc doit contenir :

- id
- name
- family
- subType
- sportContext
- primaryObjective
- secondaryObjectives
- energySystem
- dominantStress
- scientificPrescription
- sessionRole
- constraints
- compatibility
- adaptationRules
- loadProfile
- evidence

## Familles de blocs V1

### Vitesse
- speed_acceleration_short
- speed_max_velocity
- speed_rst

### Aérobie
- aerobic_hiit_short
- aerobic_intervals_medium

### Force
- strength_dynamic_power
- strength_general_unilateral
- core_stability
- plyo_reactive_light

### Coordination / appuis / tennis
- coordination_locomotor
- tennis_movement_pattern
- tennis_constrained_play_light

### Prévention
- prevention_ankle_knee

## Principes

- Pas de chiffres arbitraires si une fourchette documentée existe.
- Les blocs tennis de transfert doivent toujours rester compatibles avec le bloc principal.
- Les blocs support / prévention doivent être faciles à insérer sans perturber la logique de séance.
- Les blocs RST et HIIT lourds ont un coût de récupération plus élevé.
