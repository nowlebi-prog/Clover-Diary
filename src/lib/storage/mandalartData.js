// Fixed cells are stored as keyed objects so edits to different cells merge independently.
export function normalizeMandalart(plan = {}) {
  return {
    mainGoal: plan.mainGoal || '',
    themes: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, {
      title: plan.themes?.[i]?.title || '',
      tasks: Object.fromEntries(Array.from({ length: 8 }, (__, j) => [j, plan.themes?.[i]?.tasks?.[j] || '']))
    }]))
  };
}
