import type { ExpressionVector, ActuationCommand } from "../types/index.js";

/**
 * computeActuators — The Nexus Protocol expression computation function.
 *
 * Translates a high-level ExpressionVector into a normalized ActuationCommand
 * (actuator_01 through actuator_26, all values 0.0–1.0).
 *
 * This function is the bridge between CharacterOS character configuration
 * and hardware adapter input. It runs on every expression frame before
 * the ActuationCommand is sent to your adapter.
 *
 * Modifiers applied in order:
 *   1. Base actuator values looked up from expression preset
 *   2. positiveExprBias scales smile actuators (0–100 → 0.5–1.5×)
 *   3. smileIntensity applies cultural calibration to smile actuators
 *   4. eyeContactLevel pulls gaze actuators toward center (direct contact)
 *   5. asymmetryAllowance introduces biological left/right offset (max ±4%)
 *   6. All values clamped to [0.0, 1.0] and rounded to 3 decimal places
 *
 * @example
 * import { computeActuators } from "@characteros/nexus-sdk";
 *
 * const command = computeActuators({
 *   expressionType: "warm_smile",
 *   positiveExprBias: 65,
 *   smileIntensity: 0.9,
 *   eyeContactLevel: 0.7,
 *   asymmetryAllowance: 10,
 * });
 *
 * // command is now an ActuationCommand ready to send to any adapter:
 * await adapter.sendCommand(command);
 */

// ── Base actuator values per expression preset ─────────────────────────────
// All values are 0.0–1.0 normalized floats.
// These represent the resting position for each expression archetype
// before cultural calibration and character modifiers are applied.

const ACTUATOR_BASES: Record<string, Record<string, number>> = {
  warm_smile: {
    actuator_01: 0.15,  // jaw_open — slight
    actuator_02: 0.82,  // lip_corner_left — raised
    actuator_03: 0.82,  // lip_corner_right — raised
    actuator_04: 0.55,  // lip_upper_raise
    actuator_05: 0.10,  // lip_lower_depress — minimal
    actuator_06: 0.72,  // cheek_raise_left — Duchenne marker
    actuator_07: 0.72,  // cheek_raise_right — Duchenne marker
    actuator_08: 0.30,  // brow_raise_left — slight lift
    actuator_09: 0.30,  // brow_raise_right
    actuator_10: 0.05,  // brow_lower_left — relaxed
    actuator_11: 0.05,  // brow_lower_right
    actuator_12: 0.58,  // eye_wide_left — open, engaged
    actuator_13: 0.58,  // eye_wide_right
    actuator_14: 0.05,  // nose_wrinkle — minimal
    actuator_15: 0.48,  // lip_upper_right
    actuator_16: 0.68,  // dimpler_left
    actuator_17: 0.68,  // dimpler_right
    actuator_18: 0.15,  // chin_raise — relaxed
    actuator_19: 0.50,  // neck_pan — centered
    actuator_20: 0.50,  // neck_tilt — centered
    actuator_21: 0.55,  // neck_nod — slight forward lean
    actuator_22: 0.50,  // eye_gaze_h_left — forward
    actuator_23: 0.48,  // eye_gaze_v_left — slight down
    actuator_24: 0.50,  // eye_gaze_h_right
    actuator_25: 0.48,  // eye_gaze_v_right
    actuator_26: 0.00,  // tongue_out — retracted
  },

  gentle_smile: {
    actuator_01: 0.10,
    actuator_02: 0.60,
    actuator_03: 0.60,
    actuator_04: 0.40,
    actuator_05: 0.10,
    actuator_06: 0.52,
    actuator_07: 0.52,
    actuator_08: 0.25,
    actuator_09: 0.25,
    actuator_10: 0.10,
    actuator_11: 0.10,
    actuator_12: 0.45,
    actuator_13: 0.45,
    actuator_14: 0.05,
    actuator_15: 0.35,
    actuator_16: 0.45,
    actuator_17: 0.45,
    actuator_18: 0.15,
    actuator_19: 0.50,
    actuator_20: 0.50,
    actuator_21: 0.52,
    actuator_22: 0.50,
    actuator_23: 0.49,
    actuator_24: 0.50,
    actuator_25: 0.49,
    actuator_26: 0.00,
  },

  raised_brows: {
    actuator_01: 0.22,
    actuator_02: 0.50,
    actuator_03: 0.50,
    actuator_04: 0.30,
    actuator_05: 0.15,
    actuator_06: 0.35,
    actuator_07: 0.35,
    actuator_08: 0.88,  // brow_raise — prominent
    actuator_09: 0.88,
    actuator_10: 0.05,
    actuator_11: 0.05,
    actuator_12: 0.78,  // eye_wide — alert
    actuator_13: 0.78,
    actuator_14: 0.05,
    actuator_15: 0.30,
    actuator_16: 0.22,
    actuator_17: 0.22,
    actuator_18: 0.15,
    actuator_19: 0.50,
    actuator_20: 0.50,
    actuator_21: 0.45,
    actuator_22: 0.50,
    actuator_23: 0.52,
    actuator_24: 0.50,
    actuator_25: 0.52,
    actuator_26: 0.00,
  },

  neutral: {
    actuator_01: 0.10,
    actuator_02: 0.40,
    actuator_03: 0.40,
    actuator_04: 0.25,
    actuator_05: 0.20,
    actuator_06: 0.25,
    actuator_07: 0.25,
    actuator_08: 0.28,
    actuator_09: 0.28,
    actuator_10: 0.20,
    actuator_11: 0.20,
    actuator_12: 0.40,
    actuator_13: 0.40,
    actuator_14: 0.05,
    actuator_15: 0.25,
    actuator_16: 0.25,
    actuator_17: 0.25,
    actuator_18: 0.18,
    actuator_19: 0.50,
    actuator_20: 0.50,
    actuator_21: 0.50,
    actuator_22: 0.50,
    actuator_23: 0.50,
    actuator_24: 0.50,
    actuator_25: 0.50,
    actuator_26: 0.00,
  },
};

// Actuators affected by smile intensity and positive expression bias
const SMILE_ACTUATORS = new Set([
  "actuator_02", // lip_corner_left
  "actuator_03", // lip_corner_right
  "actuator_04", // lip_upper_raise
  "actuator_06", // cheek_raise_left
  "actuator_07", // cheek_raise_right
  "actuator_15", // lip_upper_right
  "actuator_16", // dimpler_left
  "actuator_17", // dimpler_right
]);

// Left/right paired actuators for asymmetry injection
// [left_key, right_key, direction]
const PAIRED_ACTUATORS: [string, string, number][] = [
  ["actuator_02", "actuator_03", 1],   // lip corners
  ["actuator_06", "actuator_07", 1],   // cheek raise
  ["actuator_08", "actuator_09", 1],   // brow raise
  ["actuator_10", "actuator_11", 1],   // brow lower
  ["actuator_12", "actuator_13", 1],   // eye wide
  ["actuator_16", "actuator_17", 1],   // dimpler
  ["actuator_22", "actuator_24", -1],  // eye gaze horizontal
  ["actuator_23", "actuator_25", -1],  // eye gaze vertical
];

const GAZE_ACTUATORS = new Set([
  "actuator_22",
  "actuator_23",
  "actuator_24",
  "actuator_25",
]);

/**
 * Compute deterministic actuator commands from an expression vector.
 *
 * @param vector - High-level expression specification
 * @returns Normalized ActuationCommand (all values 0.0–1.0)
 */
export function computeActuators(vector: ExpressionVector): ActuationCommand {
  const {
    expressionType,
    positiveExprBias = 50,
    asymmetryAllowance = 0,
    smileIntensity = 0.8,
    eyeContactLevel = 0.7,
  } = vector;

  // Start from base preset (fall back to neutral if unknown expressionType)
  const base = { ...(ACTUATOR_BASES[expressionType] ?? ACTUATOR_BASES.neutral) };
  const neutralBase = ACTUATOR_BASES.neutral;

  // Step 1: positive expression bias (0–100 → scale factor 0.5–1.5)
  const biasScale = 0.5 + positiveExprBias / 100;

  // Step 2: asymmetry allowance (0–100 → max ±4% offset on paired actuators)
  const asymmetryMax = (asymmetryAllowance / 100) * 0.04;

  const result: Record<string, number> = {};

  // Apply bias and smile intensity to smile actuators
  for (const [key, rawVal] of Object.entries(base)) {
    let val = rawVal;

    if (SMILE_ACTUATORS.has(key)) {
      const neutral = neutralBase[key] ?? 0.3;
      const diff = val - neutral;
      val = neutral + diff * biasScale * smileIntensity;
    }

    result[key] = val;
  }

  // Apply asymmetry to paired actuators
  for (const [lKey, rKey, dir] of PAIRED_ACTUATORS) {
    if (result[lKey] !== undefined && result[rKey] !== undefined) {
      result[lKey] += asymmetryMax * dir;
      result[rKey] -= asymmetryMax * dir;
    }
  }

  // Apply eye contact level — pulls gaze toward center (0.5 = forward)
  for (const gk of GAZE_ACTUATORS) {
    if (result[gk] !== undefined) {
      result[gk] = result[gk] + (0.5 - result[gk]) * eyeContactLevel * 0.5;
    }
  }

  // Clamp all values to [0.0, 1.0] and round to 3 decimal places
  for (const k of Object.keys(result)) {
    result[k] = Math.round(Math.min(1, Math.max(0, result[k])) * 1000) / 1000;
  }

  return result;
}

/**
 * Get the base actuator values for an expression preset without any modifiers.
 * Useful for building custom adapters that need the raw preset values.
 */
export function getExpressionBase(
  expressionType: string
): Record<string, number> {
  return { ...(ACTUATOR_BASES[expressionType] ?? ACTUATOR_BASES.neutral) };
}

/**
 * List of all supported built-in expression presets.
 */
export const EXPRESSION_PRESETS = [
  "warm_smile",
  "gentle_smile",
  "raised_brows",
  "neutral",
] as const;

export type ExpressionPreset = (typeof EXPRESSION_PRESETS)[number];
