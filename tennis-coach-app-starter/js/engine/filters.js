export function hardFilter(candidates, context, goal) {
  const allowed = [];
  const rejected = [];

  for (const block of candidates) {
    // demo starter rules only
    if (goal.sessionRole === "recovery" && block.sessionRole.canBePrimary && block.family !== "prevention" && block.id !== "core_stability") {
      rejected.push({ blockId: block.id, reason: "role_incompatible" });
      continue;
    }
    allowed.push(block);
  }

  return { allowed, rejected };
}
