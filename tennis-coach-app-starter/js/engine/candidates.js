function uniqueById(blocks) {
  const seen = new Set();
  return blocks.filter((block) => {
    if (!block || seen.has(block.id)) return false;
    seen.add(block.id);
    return true;
  });
}

function getRoleCapability(block, capability) {
  return Boolean(block?.sessionRole?.[capability]);
}

function isMainRoleEligible(block, goal) {
  if (getRoleCapability(block, "canBePrimary")) {
    return true;
  }

  return goal.sessionRole === "recovery" && block.primaryObjective === goal.mainObjective;
}

function isBlockCompatiblePair(left, right) {
  if (!left || !right) return false;

  const leftAvoid = left.compatibility?.avoidWith || [];
  const rightAvoid = right.compatibility?.avoidWith || [];

  return !leftAvoid.includes(right.id) && !rightAvoid.includes(left.id);
}

function isSecondaryRelevant(block, goal, mainCandidates) {
  if (!getRoleCapability(block, "canBeSecondary")) {
    return false;
  }

  if (block.primaryObjective === goal.mainObjective) {
    return true;
  }

  if ((block.secondaryObjectives || []).includes(goal.mainObjective)) {
    return true;
  }

  return mainCandidates.some(
    (mainBlock) =>
      isBlockCompatiblePair(block, mainBlock) &&
      (
        (mainBlock.compatibility?.goodWith || []).includes(block.id) ||
        (block.compatibility?.goodWith || []).includes(mainBlock.id)
      )
  );
}

function isTransferRelevant(block, mainCandidates) {
  if (!getRoleCapability(block, "canBeTransfer")) {
    return false;
  }

  if (!mainCandidates.length) {
    return true;
  }

  return mainCandidates.some((mainBlock) => isBlockCompatiblePair(block, mainBlock));
}

function isLowCostSupportBlock(block) {
  const freshnessCost = block.loadProfile?.freshnessCost;
  const weeklyCost = block.loadProfile?.weeklyCost;
  const internalLoad = block.loadProfile?.estimatedInternalLoad;

  return getRoleCapability(block, "canBeSecondary") && [freshnessCost, weeklyCost, internalLoad].every(
    (value) => value === "low" || value === undefined
  );
}

export function getCandidateBlocks(goal, blockLibrary) {
  const mainCandidates = uniqueById(
    blockLibrary.filter(
      (block) => block.primaryObjective === goal.mainObjective && isMainRoleEligible(block, goal)
    )
  );

  const mainCandidateIds = new Set(mainCandidates.map((block) => block.id));

  const secondaryCandidates = uniqueById(
    blockLibrary.filter(
      (block) => !mainCandidateIds.has(block.id) && isSecondaryRelevant(block, goal, mainCandidates)
    )
  );

  const transferCandidates = goal.sessionRole === "recovery"
    ? []
    : uniqueById(
      blockLibrary.filter(
        (block) => !mainCandidateIds.has(block.id) && isTransferRelevant(block, mainCandidates)
      )
    );

  const supportCandidates = uniqueById(
    blockLibrary.filter(
      (block) => !mainCandidateIds.has(block.id) && isLowCostSupportBlock(block)
    )
  );

  return {
    mainCandidates,
    secondaryCandidates,
    transferCandidates,
    supportCandidates
  };
}
