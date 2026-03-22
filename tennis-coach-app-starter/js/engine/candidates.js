function uniqueById(blocks) {
  const seen = new Set();
  return blocks.filter((block) => {
    if (!block || seen.has(block.id)) return false;
    seen.add(block.id);
    return true;
  });
}

function filterByObjective(blockLibrary, objective) {
  return blockLibrary.filter((block) => block.primaryObjective === objective);
}

function getRoleCompatibleMainCandidates(goal, blockLibrary) {
  const exactObjectiveMatches = filterByObjective(blockLibrary, goal.mainObjective).filter(
    (block) => block.sessionRole.canBePrimary
  );

  if (exactObjectiveMatches.length > 0) {
    return exactObjectiveMatches;
  }

  // Recovery is special in V1 because support blocks are intentionally low-cost,
  // even when they are not marked as primary blocks in the library.
  if (goal.sessionRole === "recovery") {
    return filterByObjective(blockLibrary, "support_recovery");
  }

  return [];
}

function getSecondaryCandidates(goal, blockLibrary, mainCandidates) {
  const supportBlocks = filterByObjective(blockLibrary, "support_recovery").filter(
    (block) => block.sessionRole.canBeSecondary
  );
  const coordinationBlocks = filterByObjective(blockLibrary, "coordination").filter(
    (block) => block.sessionRole.canBeSecondary
  );
  const sameObjectiveSecondary = filterByObjective(blockLibrary, goal.mainObjective).filter(
    (block) => block.sessionRole.canBeSecondary
  );

  const mainCandidateIds = new Set(mainCandidates.map((block) => block.id));

  return uniqueById([...coordinationBlocks, ...sameObjectiveSecondary, ...supportBlocks]).filter(
    (block) => !mainCandidateIds.has(block.id)
  );
}

function getTransferCandidates(goal, blockLibrary) {
  if (goal.sessionRole === "recovery") {
    return [];
  }

  const transferBlocks = blockLibrary.filter((block) => block.sessionRole.canBeTransfer);

  if (goal.sessionRole === "activation") {
    return transferBlocks.filter((block) => block.family === "tennis_transfer");
  }

  return transferBlocks;
}

export function getCandidateBlocks(goal, blockLibrary) {
  const mainCandidates = getRoleCompatibleMainCandidates(goal, blockLibrary);
  const secondaryCandidates = getSecondaryCandidates(goal, blockLibrary, mainCandidates);
  const transferCandidates = getTransferCandidates(goal, blockLibrary);
  const supportCandidates = filterByObjective(blockLibrary, "support_recovery").filter(
    (block) => block.sessionRole.canBeSecondary
  );

  return {
    mainCandidates,
    secondaryCandidates,
    transferCandidates,
    supportCandidates
  };
}
