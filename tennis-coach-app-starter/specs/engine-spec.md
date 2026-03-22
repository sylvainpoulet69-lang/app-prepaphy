# Engine Spec

## Flux global

1. loadAthleteContext
2. selectEventDriver
3. determineWeekType
4. selectWeeklyPriorities
5. selectMicrocycleType
6. calculateWeeklyLoadBudget
7. distributeWeeklyExposure
8. selectTodayGoal
9. getCandidateBlocks
10. hardFilter
11. scoreAndSelect
12. canAddSecondary
13. scoreAndSelectSecondary
14. getTransferCandidates
15. scoreAndSelectTransfer
16. selectFinishBlock
17. assembleSession
18. scaleToDuration
19. estimateLoad
20. explainDecision
21. saveFeedbackAndRebalanceWeek

## Hiérarchie de décision du jour

1. sécurité / recovery
2. activation pré-compétitive si besoin
3. priorité 1 si insuffisamment couverte
4. priorité 2 si insuffisamment couverte
5. support / transfert / robustesse

## Couverture des expositions

L'application doit suivre ce qui devait être couvert vs ce qui a réellement été couvert.

Exemple :
- acceleration target = 2
- acceleration done = 1

=> acceleration peut encore être due.

## Hard filter

Un bloc doit être rejeté s'il y a :
- contre-indication blessure / douleur
- fraîcheur insuffisante
- incompatibilité avec le rôle du jour
- événement trop proche
- niveau ou âge incompatibles
- durée disponible trop courte
- conflit avec l'historique récent
- dépassement injustifié du budget de charge

## Scoring principal

Critères :
- adéquation objectif
- cohérence rôle
- compatibilité profil
- compatibilité historique récent
- compatibilité état du jour
- compatibilité durée
- compatibilité calendrier
- compatibilité budget de charge

Poids recommandés :
- objectif x3
- état du jour x3
- profil x3
- rôle x2
- historique x2
- calendrier x2
- durée x1
- charge x1

## Ajout secondaire

Autorisé si :
- temps suffisant
- charge maîtrisée
- compatibilité avec le principal
- intérêt réel

## Transfert tennis

Le transfert tennis n'est pas automatique.
Il est ajouté si :
- le temps le permet
- la qualité du bloc principal est préservée
- le niveau de fraîcheur le permet
- le transfert apporte une vraie valeur tennis

## Ordre de séance

1. ouverture / échauffement
2. activation / coordination
3. bloc principal
4. bloc secondaire ou transfert
5. prévention / retour

Ordre général :
NERVOUS -> EXPLOSIF -> MÉTABOLIQUE -> TRANSFERT -> RÉCUP / PRÉVENTION
