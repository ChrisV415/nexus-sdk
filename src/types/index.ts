/**
 * CharacterOS Nexus Protocol — Core Types
 *
 * These types define the universal interface between CharacterOS
 * and any robot hardware platform.
 *
 * Do not modify these types in your adapter implementation.
 * The Nexus Protocol guarantees that any CharacterOS-compatible
 * adapter speaks this exact interface.
 */

/**
 * Result returned by adapter.connect()
 */
export interface AdapterConnectResult {
  ok: boolean;
  vendor: string;
  message?: string;
  dof?: number;
}

/**
 * A single actuation command frame.
 *
 * Keys are CharacterOS standard actuator identifiers: actuator_01 through actuator_26.
 * Values are normalized floats in the range [0.0, 1.0].
 *
 * Actuator anatomy reference:
 *   actuator_01  jaw_open            actuator_14  nose_wrinkle
 *   actuator_02  lip_corner_left     actuator_15  lip_upper_right
 *   actuator_03  lip_corner_right    actuator_16  dimpler_left
 *   actuator_04  lip_upper_raise     actuator_17  dimpler_right
 *   actuator_05  lip_lower_depress   actuator_18  chin_raise
 *   actuator_06  cheek_raise_left    actuator_19  neck_pan
 *   actuator_07  cheek_raise_right   actuator_20  neck_tilt
 *   actuator_08  brow_raise_left     actuator_21  neck_nod
 *   actuator_09  brow_raise_right    actuator_22  eye_gaze_h_left
 *   actuator_10  brow_lower_left     actuator_23  eye_gaze_v_left
 *   actuator_11  brow_lower_right    actuator_24  eye_gaze_h_right
 *   actuator_12  eye_wide_left       actuator_25  eye_gaze_v_right
 *   actuator_13  eye_wide_right      actuator_26  tongue_out
 */
export interface ActuationCommand {
  [key: string]: number;
}

/**
 * Result returned by adapter.sendCommand()
 */
export interface AdapterCommandResult {
  ok: boolean;
  latencyMs?: number;
  actuatorsUpdated?: number;
  mapped?: Record<string, number>;
}

/**
 * Feedback returned by adapter.getFeedback()
 */
export interface AdapterFeedback {
  timestamp: number;
  vendor: string;
  connected: boolean;
  faceState?: Record<string, number>;
}

/**
 * Expression vector passed to computeActuators().
 * Describes emotional state at a high level.
 * computeActuators() translates this into per-actuator float values.
 */
export interface ExpressionVector {
  expressionType: "warm_smile" | "gentle_smile" | "raised_brows" | "neutral";
  positiveExprBias?: number;    // 0–100, default 50
  asymmetryAllowance?: number;  // 0–100, default 0
  smileIntensity?: number;      // 0.0–1.0, default 0.8
  eyeContactLevel?: number;     // 0.0–1.0, default 0.7
}

/**
 * JEPA joint namespace reference.
 * Used by world-model-based robot platforms.
 */
export interface JEPAJointMap {
  [actuatorKey: string]: string;
}
