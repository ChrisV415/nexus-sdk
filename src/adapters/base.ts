import type {
  AdapterConnectResult,
  ActuationCommand,
  AdapterCommandResult,
  AdapterFeedback,
} from "../types/index.js";

export type {
  AdapterConnectResult,
  ActuationCommand,
  AdapterCommandResult,
  AdapterFeedback,
};

/**
 * RobotAdapter — The Nexus Protocol base class.
 *
 * Every CharacterOS hardware adapter extends this class.
 * Your adapter receives normalized ActuationCommand frames (all values 0.0–1.0)
 * and translates them to your hardware's native format.
 *
 * Three methods to implement:
 *   connect()     — establish connection to your hardware
 *   sendCommand() — translate and send an ActuationCommand frame
 *   getFeedback() — read current hardware state
 *
 * The CharacterOS Safety Harness, cultural calibration, and NBC Protocol
 * all run before your adapter receives any command. You do not need to
 * implement safety logic in your adapter — focus only on the hardware
 * translation layer.
 *
 * @example
 * class MyRobotAdapter extends RobotAdapter {
 *   constructor() {
 *     super();
 *     this.vendor = "my_robot";
 *   }
 *
 *   async connect(config) {
 *     // open serial port, WebSocket, REST connection, etc.
 *     this.connected = true;
 *     return { ok: true, vendor: this.vendor, dof: 26 };
 *   }
 *
 *   async sendCommand(actuation) {
 *     if (!this.validateCommand(actuation)) return { ok: false };
 *     const native = this.toNative(actuation);
 *     await this.hardware.send(native);
 *     return { ok: true, latencyMs: 30, actuatorsUpdated: Object.keys(actuation).length };
 *   }
 *
 *   async getFeedback() {
 *     const state = await this.hardware.getState();
 *     return { timestamp: Date.now(), vendor: this.vendor, connected: this.connected, faceState: state };
 *   }
 * }
 */
export abstract class RobotAdapter {
  config: Record<string, unknown>;
  connected: boolean;
  vendor: string;

  constructor(config: Record<string, unknown> = {}) {
    this.config = config;
    this.connected = false;
    this.vendor = "base";
  }

  /**
   * Connect to the hardware platform.
   * Called once before any sendCommand() calls.
   *
   * @param vendorConfig - Hardware-specific connection parameters
   *   (API endpoint, serial port, device ID, auth token, etc.)
   */
  abstract connect(
    vendorConfig: Record<string, unknown>
  ): Promise<AdapterConnectResult>;

  /**
   * Send a single expression frame to the hardware.
   *
   * The actuation object contains actuator_01 through actuator_26 keys
   * with float values in [0.0, 1.0]. Your adapter translates these to
   * whatever format your hardware expects (motor positions, servo angles,
   * JSON API payloads, ROS topics, etc.).
   *
   * Call validateCommand(actuation) first to verify all values are in range.
   *
   * @param actuation - Normalized actuator command (actuator_01..26 → 0.0–1.0)
   */
  abstract sendCommand(
    actuation: ActuationCommand
  ): Promise<AdapterCommandResult>;

  /**
   * Read current hardware state.
   * Called periodically by CharacterOS to monitor hardware health.
   */
  abstract getFeedback(): Promise<AdapterFeedback>;

  /**
   * Disconnect from the hardware.
   * Override if your hardware requires explicit teardown.
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Validate that an actuation command is well-formed.
   * All values must be numbers in [0.0, 1.0].
   * Call this at the start of sendCommand().
   */
  validateCommand(actuation: ActuationCommand): boolean {
    if (!actuation || typeof actuation !== "object") return false;
    return Object.values(actuation).every(
      (v) => typeof v === "number" && v >= 0 && v <= 1
    );
  }
}
