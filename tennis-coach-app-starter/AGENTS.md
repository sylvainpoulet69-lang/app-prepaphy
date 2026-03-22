# AGENTS.md

## But du projet

Construire une application de planification de préparation physique spécifique tennis.
L'application doit agir comme un moteur décisionnel, pas comme une liste de séances.

## Règles absolues

- Ne jamais générer de séance au hasard.
- Ne jamais inventer de prescription fixe si une fourchette scientifique ou documentée existe.
- Toujours prioriser le contexte joueur :
  - âge
  - niveau
  - historique
  - fatigue
  - douleur
  - disponibilité
  - calendrier
  - importance des événements
- Toujours expliquer les décisions du moteur.
- Toujours conserver la hiérarchie :
  sécurité > récupération > activation pré-compétitive > priorité 1 > priorité 2 > support

## Durées

- 45 minutes
- 60 minutes par défaut
- 90 minutes

## Rôles de séance

- priority_1
- priority_2
- support
- recovery
- activation

## Pipeline obligatoire

1. selectTodayGoal
2. getCandidateBlocks
3. hardFilter
4. scoreAndSelect
5. optionally add secondary
6. optionally add tennis transfer
7. assembleSession
8. scaleToDuration
9. estimateLoad
10. explainDecision

## Règles produit

- L'application doit gérer jeunes et adultes.
- L'application doit gérer les événements avec 4 niveaux d'importance.
- L'application doit pouvoir ajouter ou supprimer une séance sans reconstruire bêtement toute la semaine.
- L'application doit utiliser le feedback réel (RPE, durée réelle, douleur).
- Les blocs tennis de transfert sont autorisés seulement s'ils restent cohérents avec l'objectif principal.

## Règle science / terrain

La science sert de cadre.
Le contexte individuel décide.

## Style de code V1

- HTML / CSS / JavaScript natif
- architecture modulaire
- fonctions aussi pures que possible
- pas de framework en V1
- commentaires clairs dans les fonctions moteur
- code lisible avant d'être "intelligent"
