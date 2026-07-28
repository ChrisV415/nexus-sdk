/**
 * JEPA Joint Map — CharacterOS to Joint Embedding Predictive Architecture
 *
 * Maps CharacterOS standard actuator identifiers (actuator_01..26)
 * to JEPA dot-notation joint namespace used by world-model-based
 * robot platforms (e.g. AMI Labs, future physical AI systems).
 *
 * Reference only. Use this if you are building an adapter for a
 * JEPA-based robot or world-model robot platform.
 *
 * JEPA's 6-module architecture maps to CharacterOS as follows:
 *   configurator   ← CharacterOS character config (brand, cultural profile, safety rules)
 *   perception     ← detectedEmotion + physicalContext from hardware sensors
 *   world model    ← predicts next expression state given current world state
 *   cost module    ← NBC Protocol (is this action on-brand and safe?)
 *   actor          ← this adapter (CharacterOS → JEPA actor bridge)
 *   short-term mem ← audit log reference (auditLogId passed through command)
 *
 * Patent reference: CharacterOS Provisional Patent, Claim 4(vi) and Claim 11
 */

export const JEPA_JOINT_MAP: Record<string, string> = {
  actuator_01: "face.jaw.open",
  actuator_02: "face.lip_corner.left",
  actuator_03: "face.lip_corner.right",
  actuator_04: "face.lip_upper.raise",
  actuator_05: "face.lip_lower.depress",
  actuator_06: "face.cheek.raise_left",
  actuator_07: "face.cheek.raise_right",
  actuator_08: "face.brow.raise_left",
  actuator_09: "face.brow.raise_right",
  actuator_10: "face.brow.lower_left",
  actuator_11: "face.brow.lower_right",
  actuator_12: "face.eye.wide_left",
  actuator_13: "face.eye.wide_right",
  actuator_14: "face.nose.wrinkle",
  actuator_15: "face.lip_upper.right",
  actuator_16: "face.dimpler.left",
  actuator_17: "face.dimpler.right",
  actuator_18: "face.chin.raise",
  actuator_19: "neck.pan",
  actuator_20: "neck.tilt",
  actuator_21: "neck.nod",
  actuator_22: "eye.gaze.h_left",
  actuator_23: "eye.gaze.v_left",
  actuator_24: "eye.gaze.h_right",
  actuator_25: "eye.gaze.v_right",
  actuator_26: "face.tongue.out",
};

/**
 * Translate a CharacterOS ActuationCommand to JEPA dot-notation format.
 *
 * @param actuation - Standard CharacterOS ActuationCommand
 * @returns JEPA-formatted command object with dot-notation keys
 *
 * @example
 * const jepaCmd = translateToJEPA({
 *   actuator_02: 0.82,
 *   actuator_03: 0.82,
 *   actuator_06: 0.72,
 * });
 * // { "face.lip_corner.left": 0.82, "face.lip_corner.right": 0.82, "face.cheek.raise_left": 0.72 }
 */
export function translateToJEPA(
  actuation: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(actuation)) {
    const jepaKey = JEPA_JOINT_MAP[key];
    if (jepaKey !== undefined) {
      result[jepaKey] = value;
    }
  }
  return result;
}

/**
 * Reverse lookup: JEPA dot-notation key → CharacterOS actuator key
 */
export const JEPA_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(JEPA_JOINT_MAP).map(([cos, jepa]) => [jepa, cos])
);
