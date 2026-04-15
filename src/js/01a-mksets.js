// ============================================================
// mkSets — Exercise Set Builder
// ============================================================
function mkSets(exRef, overrides = {}) {
  return Object.assign({
    exId: exRef.id,
    name: exRef.name,
    muscles: [...exRef.muscles],
    sets: exRef.defaultSets,
    reps: exRef.defaultReps,
    rest: exRef.defaultRest,
    defaultWeight: exRef.defaultWeight ?? 0,
    bodyweight: exRef.bodyweight || false,
    perSide: exRef.perSide || false,
    isTime: exRef.isTime || false,
    isDistance: exRef.isDistance || false,
    noRpe: exRef.noRpe || false,
    tempo: "",
    notes: ""
  }, overrides);
}
