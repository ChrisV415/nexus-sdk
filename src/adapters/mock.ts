import {
  RobotAdapter,
  type AdapterConnectResult,
  type ActuationCommand,
  type AdapterCommandResult,
  type AdapterFeedback,
} from "./base.js";

interface CommandLogEntry {
  timestamp: number;
  command: ActuationCommand;
  latencyMs: number;
}

/**
 * MockAdapter — Reference implementation of the Nexus Protocol.
 *
 * Use this adapter for:
 *   - Development and testing without physical hardware
 *   - Validating your CharacterOS character configuration
 *   - Understanding how sendCommand() receives actuation frames
 *   - Template for building your own hardware adapter
 *
 * The mock simulates 26 DOF with realistic latency (30–60ms)
 * and maintains an in-memory face state for feedback reads.
 *
 * @example
 * import { MockAdapter } from "@characteros/nexus-sdk";
 *
 * const adapter = new MockAdapter();
 * await adapter.connect({});
 *
 * const result = await adapter.sendCommand({
 *   actuator_02: 0.82,  // lip_corner_left — smile
 *   actuator_03: 0.82,  // lip_corner_right — smile
 *   actuator_06: 0.72,  // cheek_raise_left
 *   actuator_07: 0.72,  // cheek_raise_right
 * });
 *
 * console.log(result); // { ok: true, latencyMs: 42, actuatorsUpdated: 4 }
 *
 * const feedback = await adapter.getFeedback();
 * console.log(feedback.faceState); // current actuator values
 */
export class MockAdapter extends RobotAdapter {
  faceState: Record<string, number>;
  commandLog: CommandLogEntry[];

  constructor() {
    super();
    this.vendor = "mock";
    this.faceState = {};
    this.commandLog = [];

    // Initialize all 26 actuators to 0.0 (neutral/resting)
    for (let i = 1; i <= 26; i++) {
      const key = `actuator_${String(i).padStart(2, "0")}`;
      this.faceState[key] = 0.0;
    }
  }

  async connect(
    _vendorConfig: Record<string, unknown>
  ): Promise<AdapterConnectResult> {
    // Simulate hardware connection handshake
    await new Promise((r) => setTimeout(r, 50));
    this.connected = true;
    return {
      ok: true,
      vendor: "mock",
      message: "MockAdapter connected — 26 DOF simulated",
      dof: 26,
    };
  }

  async sendCommand(
    actuation: ActuationCommand
  ): Promise<AdapterCommandResult> {
    if (!this.connected) throw new Error("Not connected — call connect() first");
    if (!this.validateCommand(actuation)) {
      throw new Error(
        "Invalid actuation command — all values must be numbers in [0.0, 1.0]"
      );
    }

    // Simulate hardware transmission latency
    const latency = 30 + Math.random() * 30;
    await new Promise((r) => setTimeout(r, latency));

    // Apply command to internal face state
    Object.assign(this.faceState, actuation);

    const latencyMs = Math.round(latency);
    this.commandLog.push({
      timestamp: Date.now(),
      command: actuation,
      latencyMs,
    });

    return {
      ok: true,
      latencyMs,
      actuatorsUpdated: Object.keys(actuation).length,
    };
  }

  async getFeedback(): Promise<AdapterFeedback> {
    if (!this.connected) throw new Error("Not connected");
    return {
      timestamp: Date.now(),
      vendor: "mock",
      connected: true,
      faceState: { ...this.faceState },
    };
  }

  /**
   * Returns the last 100 commands sent to this adapter.
   * Useful for debugging character expression sequences.
   */
  getCommandLog(): CommandLogEntry[] {
    return this.commandLog.slice(-100);
  }

  /**
   * Reset all actuators to neutral (0.0) and clear command log.
   */
  reset(): void {
    for (const key of Object.keys(this.faceState)) {
      this.faceState[key] = 0.0;
    }
    this.commandLog = [];
  }
}
