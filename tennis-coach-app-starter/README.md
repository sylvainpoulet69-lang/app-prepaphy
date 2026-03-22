# Tennis Coach App

Application web de planification de préparation physique spécifique tennis.

## Vision

Cette application doit fonctionner comme un **cerveau de préparateur physique**.
Elle ne doit jamais choisir une séance fixe au hasard.
Elle doit toujours raisonner ainsi :

1. lire le profil du joueur
2. lire le calendrier compétitif
3. lire l'historique récent
4. lire l'état du jour
5. choisir le type de semaine
6. choisir l'objectif du jour
7. choisir les blocs candidats
8. filtrer les blocs incompatibles
9. scorer les blocs restants
10. assembler la séance
11. adapter à 45 / 60 / 90 minutes
12. estimer la charge
13. expliquer la décision
14. apprendre du feedback post-séance

## Règles non négociables

- L'application est centrée sur le joueur, pas sur des séances figées.
- La science donne un cadre, mais ne remplace jamais le contexte individuel.
- Aucune prescription arbitraire : on utilise des fourchettes documentées ou des règles dérivées explicitement.
- Le moteur ne choisit jamais une séance directement : il choisit d'abord un objectif, puis des blocs.
- Les blocs tennis de transfert sont importants mais ne doivent pas détruire l'objectif principal du jour.
- Toute décision doit être explicable.

## Profils supportés

- jeunes
- adultes
- femmes
- hommes
- loisirs
- compétiteurs
- profils avec historique de blessure ou zones sensibles

## Durées supportées

- 45 minutes
- 60 minutes (par défaut)
- 90 minutes

## Rôles de séance

- priority_1
- priority_2
- support
- recovery
- activation

## Pipeline moteur V1

1. selectTodayGoal
2. getCandidateBlocks
3. hardFilter
4. scoreAndSelect
5. canAddSecondary
6. scoreAndSelectSecondary
7. getTransferCandidates
8. scoreAndSelectTransfer
9. assembleSession
10. scaleToDuration
11. estimateLoad
12. explainDecision

## Écrans V1

- Profil
- Calendrier
- Semaine
- Séance du jour
- Feedback

## Philosophie

- profil + historique + fatigue + calendrier > modèle générique
- nombre de séances ≠ charge
- charge réelle = coût des contraintes + durée + densité + RPE
- physique -> transfert -> tennis
