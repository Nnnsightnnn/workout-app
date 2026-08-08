// ============================================================
// mkSets — Exercise Set Builder
// ============================================================
function mkSets(exRef, overrides = {}) {
  // exRef is meant to be a LIBRARY entry (has `id`, `defaultSets`, ...). Callers
  // occasionally hand us an existing prescription instead (has `exId`, `sets`,
  // no `id`) to clone it. Reading defaultSets/defaultReps off one of those
  // yields undefined, which renders as "3 × ?" with no reps — so resolve it
  // back to its library entry and treat the prescription as the overrides.
  if (exRef && exRef.id === undefined && exRef.exId) {
    const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[exRef.exId] : null;
    if (lib) {
      overrides = Object.assign({}, exRef, overrides);
      exRef = lib;
    }
  }
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
