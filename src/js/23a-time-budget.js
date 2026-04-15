// ============================================================
// TIME BUDGET — Precise estimation + auto-adjust
// ============================================================

// ---- Tempo parsing ----

// Parse a tempo string into seconds per phase.
// Handles dashed ("3-1-1-0") and compact ("20X0") formats.
// "X" = 1s (explosive). Returns null if invalid.
function parseTempo(str) {
  if (!str || typeof str !== "string") return null;
  let parts;
  if (str.includes("-")) {
    parts = str.split("-");
  } else if (str.length === 4) {
    parts = str.split("");
  } else {
    return null;
  }
  if (parts.length !== 4) return null;
  const nums = parts.map(p => {
    const u = p.toUpperCase();
    if (u === "X") return 1;
    const n = parseInt(u, 10);
    return isNaN(n) ? null : n;
  });
  if (nums.some(n => n === null)) return null;
  return { ecc: nums[0], pause: nums[1], con: nums[2], top: nums[3], total: nums[0] + nums[1] + nums[2] + nums[3] };
}

// Seconds per rep from tempo string, or 0 if none/invalid.
function tempoToRepDuration(str) {
  const t = parseTempo(str);
  return t ? t.total : 0;
}

// ---- Default rep durations (when no tempo) ----

const _DEFAULT_REP_SEC = {
  Squat: 4, Hinge: 4,
  Push: 3, Pull: 3,
  Shoulders: 3, Arms: 3, Core: 3,
  Conditioning: 3, Carry: 3, Warmup: 2
};

function defaultRepDuration(ex) {
  const lib = LIB_BY_ID[ex.exId];
  const cat = lib ? lib.cat : "Push";
  return _DEFAULT_REP_SEC[cat] || 3;
}

// ---- Distance duration ----

// Estimated seconds for one set of a distance-based exercise.
function estimateDistanceDuration(ex) {
  const meters = ex.reps || 0;
  const id = ex.exId;
  if (id === "rower") return meters * 0.25;       // ~500m in ~2:05
  if (id === "treadmill") return meters * 0.3;     // ~400m in ~2:00
  if (id === "sledpush") return meters * 0.6;
  // Carries (farmers, safwalk, yoke): ~12s per 25m
  return meters * 0.5;
}

// ---- Per-exercise estimation ----

const SETUP_SEC = 15; // transition/setup between exercises

function estimateExerciseSec(ex) {
  const numSets = ex.sets || 3;
  const rest = (ex.rest != null && ex.rest >= 0) ? ex.rest : 90;

  let workPerSet;
  if (ex.isTime) {
    workPerSet = (ex.reps || 0) * (ex.perSide ? 2 : 1);
  } else if (ex.isDistance) {
    workPerSet = estimateDistanceDuration(ex);
  } else {
    const repDur = tempoToRepDuration(ex.tempo) || defaultRepDuration(ex);
    const effectiveReps = ex.perSide ? (ex.reps || 0) * 2 : (ex.reps || 0);
    workPerSet = effectiveReps * repDur;
  }

  return SETUP_SEC + (numSets * workPerSet) + (Math.max(0, numSets - 1) * rest);
}

// Warmup exercises: no heavy rest, simpler cadence.
function estimateWarmupExSec(ex) {
  if (ex.isTime) {
    const dur = (ex.reps || 0) * (ex.perSide ? 2 : 1);
    return dur * (ex.sets || 1) + 10;
  }
  if (ex.isDistance) {
    return estimateDistanceDuration(ex) * (ex.sets || 1) + 10;
  }
  const reps = ex.perSide ? (ex.reps || 0) * 2 : (ex.reps || 0);
  return (ex.sets || 1) * reps * 2 + 10;
}

// Cooldown: uses COOLDOWN_EXERCISES from 10-render-workout.js.
function estimateCooldownSec() {
  if (typeof COOLDOWN_EXERCISES === "undefined") return 360; // ~6 min fallback
  let total = 0;
  COOLDOWN_EXERCISES.forEach(ex => {
    if (ex.isTime) {
      total += (ex.reps || 0) * (ex.perSide ? 2 : 1);
    } else {
      total += ((ex.reps || 8) * 2) * (ex.perSide ? 2 : 1);
    }
  });
  return total + 30; // transition buffer
}

// ---- Block / session estimation ----

function estimateBlockSec(block) {
  const isWarmup = block.type === "warmup";
  let total = 0;
  block.exercises.forEach(ex => {
    total += (isWarmup || ex.isWarmup) ? estimateWarmupExSec(ex) : estimateExerciseSec(ex);
  });
  return total;
}

function estimateSessionSeconds(day, options) {
  if (!day) return 0;
  const opts = options || {};
  const includeCooldown = opts.includeCooldown !== false;
  let total = 0;
  day.blocks.forEach(block => { total += estimateBlockSec(block); });
  if (includeCooldown) total += estimateCooldownSec();
  return total;
}

// Drop-in replacement for the old estimateSessionMinutes.
function estimateSessionMinutes(day, options) {
  return Math.round(estimateSessionSeconds(day, options) / 60);
}

// ---- Session breakdown for UI ----

function getSessionBreakdown(day) {
  if (!day) return { totalSec: 0, totalMin: 0, warmupSec: 0, workingSec: 0, cooldownSec: 0, blocks: [] };
  let warmupSec = 0, workingSec = 0;
  const blocks = day.blocks.map(block => {
    const isWarmup = block.type === "warmup";
    const exercises = block.exercises.map(ex => {
      const sec = (isWarmup || ex.isWarmup) ? estimateWarmupExSec(ex) : estimateExerciseSec(ex);
      const rest = (ex.rest != null && ex.rest >= 0) ? ex.rest : 90;
      const numSets = ex.sets || 3;
      const restTotal = (isWarmup || ex.isWarmup) ? 0 : Math.max(0, numSets - 1) * rest;
      return { name: ex.name, exId: ex.exId, totalSec: sec, restSec: restTotal, workSec: sec - restTotal, sets: numSets };
    });
    const blockTotal = exercises.reduce((s, e) => s + e.totalSec, 0);
    if (isWarmup) warmupSec += blockTotal; else workingSec += blockTotal;
    return { blockId: block.id, name: block.name, letter: block.letter, isWarmup, totalSec: blockTotal, exercises };
  });
  const cooldownSec = estimateCooldownSec();
  const totalSec = warmupSec + workingSec + cooldownSec;
  return { totalSec, totalMin: Math.round(totalSec / 60), warmupSec, workingSec, cooldownSec, blocks };
}

// ---- Auto-adjust algorithm ----

// Identify which block index is the "primary" block (first non-warmup).
function _primaryBlockIdx(day) {
  return day.blocks.findIndex(b => b.type !== "warmup");
}

function generateAdjustmentCandidates(day) {
  const candidates = [];
  const primaryIdx = _primaryBlockIdx(day);

  day.blocks.forEach((block, bi) => {
    if (block.type === "warmup") return;
    const isPrimary = bi === primaryIdx;
    const isFinisher = bi === day.blocks.length - 1 || (block.name && /finisher|conditioning/i.test(block.name));

    block.exercises.forEach((ex, ei) => {
      const numSets = ex.sets || 3;
      const rest = (ex.rest != null && ex.rest >= 0) ? ex.rest : 90;
      const isAccessory = !isPrimary;

      // Tier 1: Reduce rest on accessories (rest > 60 → 45)
      if (isAccessory && rest > 60) {
        const newRest = 45;
        const saved = (Math.max(0, numSets - 1)) * (rest - newRest);
        candidates.push({
          tier: 1, savedSec: saved, type: "rest",
          description: `Rest ${rest}s \u2192 ${newRest}s on ${ex.name}`,
          apply(d) { d.blocks[bi].exercises[ei].rest = newRest; }
        });
      }

      // Tier 2: Reduce rest on compounds in non-primary blocks (rest > 90 → 60)
      if (isAccessory && rest > 90) {
        const newRest = 60;
        const saved = (Math.max(0, numSets - 1)) * (rest - newRest);
        candidates.push({
          tier: 2, savedSec: saved, type: "rest",
          description: `Rest ${rest}s \u2192 ${newRest}s on ${ex.name}`,
          apply(d) { d.blocks[bi].exercises[ei].rest = newRest; }
        });
      }

      // Tier 2b: Reduce rest on primary block exercises (rest > 120 → 90)
      if (isPrimary && rest > 120) {
        const newRest = 90;
        const saved = (Math.max(0, numSets - 1)) * (rest - newRest);
        candidates.push({
          tier: 2, savedSec: saved, type: "rest",
          description: `Rest ${rest}s \u2192 ${newRest}s on ${ex.name}`,
          apply(d) { d.blocks[bi].exercises[ei].rest = newRest; }
        });
      }

      // Tier 3: Drop 1 set from finisher exercises with 4+ sets
      if (isFinisher && numSets >= 4) {
        const repDur = tempoToRepDuration(ex.tempo) || defaultRepDuration(ex);
        let workPerSet;
        if (ex.isTime) workPerSet = (ex.reps || 0) * (ex.perSide ? 2 : 1);
        else if (ex.isDistance) workPerSet = estimateDistanceDuration(ex);
        else workPerSet = (ex.perSide ? (ex.reps || 0) * 2 : (ex.reps || 0)) * repDur;
        const saved = workPerSet + rest;
        candidates.push({
          tier: 3, savedSec: saved, type: "sets",
          description: `Drop 1 set from ${ex.name} (${numSets} \u2192 ${numSets - 1})`,
          apply(d) { d.blocks[bi].exercises[ei].sets = Math.max(1, (d.blocks[bi].exercises[ei].sets || 3) - 1); }
        });
      }

      // Tier 4: Drop 1 set from accessory exercises with 4+ sets
      if (isAccessory && !isFinisher && numSets >= 4) {
        const repDur = tempoToRepDuration(ex.tempo) || defaultRepDuration(ex);
        let workPerSet;
        if (ex.isTime) workPerSet = (ex.reps || 0) * (ex.perSide ? 2 : 1);
        else if (ex.isDistance) workPerSet = estimateDistanceDuration(ex);
        else workPerSet = (ex.perSide ? (ex.reps || 0) * 2 : (ex.reps || 0)) * repDur;
        const saved = workPerSet + rest;
        candidates.push({
          tier: 4, savedSec: saved, type: "sets",
          description: `Drop 1 set from ${ex.name} (${numSets} \u2192 ${numSets - 1})`,
          apply(d) { d.blocks[bi].exercises[ei].sets = Math.max(1, (d.blocks[bi].exercises[ei].sets || 3) - 1); }
        });
      }
    });

    // Tier 5: Remove last exercise from finisher block
    if (isFinisher && block.exercises.length > 1) {
      const lastEx = block.exercises[block.exercises.length - 1];
      const saved = (block.type === "warmup" || lastEx.isWarmup) ? estimateWarmupExSec(lastEx) : estimateExerciseSec(lastEx);
      candidates.push({
        tier: 5, savedSec: saved, type: "exercise",
        description: `Remove ${lastEx.name} from ${block.name}`,
        apply(d) { d.blocks[bi].exercises.pop(); }
      });
    }

    // Tier 6: Remove entire non-primary block (last working block)
    if (!isPrimary && bi === day.blocks.length - 1) {
      const saved = estimateBlockSec(block);
      candidates.push({
        tier: 6, savedSec: saved, type: "block",
        description: `Remove block ${block.letter} (${block.name})`,
        apply(d) { d.blocks.splice(bi, 1); }
      });
    }
  });

  // Sort: tier ascending, then time saved descending within tier
  candidates.sort((a, b) => a.tier - b.tier || b.savedSec - a.savedSec);
  return candidates;
}

function computeTimeBudget(day, targetMinutes) {
  const targetSec = targetMinutes * 60;
  const adjustedDay = deepClone(day);
  const adjustments = [];

  const candidates = generateAdjustmentCandidates(adjustedDay);
  let currentSec = estimateSessionSeconds(adjustedDay);

  for (const candidate of candidates) {
    if (currentSec <= targetSec) break;
    const beforeSec = estimateSessionSeconds(adjustedDay);
    candidate.apply(adjustedDay);
    const afterSec = estimateSessionSeconds(adjustedDay);
    const actualSaved = beforeSec - afterSec;
    if (actualSaved > 0) {
      adjustments.push({
        type: candidate.type,
        description: candidate.description,
        savedSec: actualSaved,
        tier: candidate.tier
      });
      currentSec = afterSec;
    }
  }

  return {
    currentMin: Math.round(estimateSessionSeconds(day) / 60),
    targetMin: targetMinutes,
    adjustedMin: Math.round(currentSec / 60),
    deltaMin: Math.round((currentSec - targetSec) / 60),
    achievable: currentSec <= targetSec,
    adjustments,
    adjustedDay
  };
}
