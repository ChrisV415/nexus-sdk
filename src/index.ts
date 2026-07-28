/**
 * @characteros/nexus-sdk
 *
 * The open-source Nexus Protocol adapter interface for CharacterOS.
 *
 * Build a hardware adapter for any robot platform and connect it
 * to CharacterOS character middleware — Safety Harness, cultural
 * calibration, NBC Protocol, and Daily Alignment Agent included.
 *
 * @see https://characteros.cloud/docs/nexus-protocol
 * @see https://github.com/CharacterOS/nexus-sdk
 */

// Core adapter interface
export { RobotAdapter } from "./adapters/base.js";
export type {
  AdapterConnectResult,
  ActuationCommand,
  AdapterCommandResult,
  AdapterFeedback,
} from "./adapters/base.js";

// Reference implementation
export { MockAdapter } from "./adapters/mock.js";

// Expression computation
export {
  computeActuators,
  getExpressionBase,
  EXPRESSION_PRESETS,
} from "./core/computeActuators.js";
export type { ExpressionPreset } from "./core/computeActuators.js";

// JEPA / world model support
export { JEPA_JOINT_MAP, JEPA_REVERSE_MAP, translateToJEPA } from "./core/jepaMaps.js";

// Types
export type {
  ExpressionVector,
  JEPAJointMap,
} from "./types/index.js";
