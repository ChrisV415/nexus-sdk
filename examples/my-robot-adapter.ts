/**
 * Example: Building a Custom Hardware Adapter
 *
 * This file shows how to implement a CharacterOS Nexus Protocol adapter
 * for a fictional "MyRobot" platform that communicates via HTTP REST API.
 *
 * Copy this file, rename MyRobotAdapter to your platform name,
 * and replace the HTTP calls with your hardware's actual protocol.
 *
 * Supported protocols in production adapters:
 *   - REST API (HTTP/HTTPS)     ← this example
 *   - WebSocket
 *   - Serial/UART
 *   - ROS 2 topics via rosbridge
 *   - Bluetooth GATT
 *   - gRPC
 *   - SDK/DLL via Node.js FFI
 */

import {
  RobotAdapter,
  computeActuators,
  type AdapterConnectResult,
  type ActuationCommand,
  type AdapterCommandResult,
  type AdapterFeedback,
} from "../src/index.js";

// ── Your hardware's native command format ─────────────────────────────────
// This is what your robot expects. CharacterOS sends actuator_XX → 0.0–1.0.
// Your adapter translates that to whatever format your robot needs.

interface MyRobotCommand {
  servo_id: number;
  position: number;    // 0–1000 (your hardware's native range)
  speed: number;       // 0–100
}

interface MyRobotResponse {
  status: "ok" | "error";
  latency_ms: number;
  message?: string;
}

// ── Actuator → servo ID mapping for MyRobot ───────────────────────────────
// Map CharacterOS standard actuator keys to your hardware's servo IDs.
// You need to define this mapping for your specific robot platform.
// Refer to your robot's hardware documentation.

const MYROBOT_SERVO_MAP: Record<string, number> = {
  actuator_01: 1,   // jaw_open → servo 1
  actuator_02: 2,   // lip_corner_left → servo 2
  actuator_03: 3,   // lip_corner_right → servo 3
  actuator_04: 4,   // lip_upper_raise → servo 4
  actuator_05: 5,   // lip_lower_depress → servo 5
  actuator_06: 6,   // cheek_raise_left → servo 6
  actuator_07: 7,   // cheek_raise_right → servo 7
  actuator_08: 8,   // brow_raise_left → servo 8
  actuator_09: 9,   // brow_raise_right → servo 9
  actuator_10: 10,  // brow_lower_left → servo 10
  actuator_11: 11,  // brow_lower_right → servo 11
  actuator_12: 12,  // eye_wide_left → servo 12
  actuator_13: 13,  // eye_wide_right → servo 13
  actuator_19: 19,  // neck_pan → servo 19
  actuator_20: 20,  // neck_tilt → servo 20
  actuator_21: 21,  // neck_nod → servo 21
  // Add remaining actuators for your hardware's DOF count
};

// ── The adapter implementation ─────────────────────────────────────────────

export class MyRobotAdapter extends RobotAdapter {
  private apiUrl: string | null = null;
  private apiKey: string | null = null;
  private lastFaceState: Record<string, number> = {};

  constructor() {
    super();
    this.vendor = "my_robot"; // Change to your company/product name
  }

  /**
   * Connect to the robot.
   * vendorConfig comes from the CharacterOS Deploy tab configuration.
   */
  async connect(
    vendorConfig: Record<string, unknown>
  ): Promise<AdapterConnectResult> {
    this.apiUrl = vendorConfig.apiUrl as string;
    this.apiKey = vendorConfig.apiKey as string;

    if (!this.apiUrl || !this.apiKey) {
      return {
        ok: false,
        vendor: this.vendor,
        message: "apiUrl and apiKey are required in vendor config",
      };
    }

    try {
      // Perform a health check to verify the robot is reachable
      const response = await fetch(`${this.apiUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
        return {
          ok: false,
          vendor: this.vendor,
          message: `Health check failed: HTTP ${response.status}`,
        };
      }

      this.connected = true;
      return {
        ok: true,
        vendor: this.vendor,
        message: `MyRobot connected at ${this.apiUrl}`,
        dof: Object.keys(MYROBOT_SERVO_MAP).length,
      };
    } catch (err) {
      return {
        ok: false,
        vendor: this.vendor,
        message: `Connection error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Send an expression frame to the robot.
   *
   * CharacterOS calls this with actuator_01..26 keys, all values 0.0–1.0.
   * You translate to your robot's native format and send.
   */
  async sendCommand(
    actuation: ActuationCommand
  ): Promise<AdapterCommandResult> {
    if (!this.validateCommand(actuation)) {
      return { ok: false };
    }

    // Translate CharacterOS actuator keys to MyRobot servo commands
    const commands: MyRobotCommand[] = [];
    for (const [actuatorKey, normalizedValue] of Object.entries(actuation)) {
      const servoId = MYROBOT_SERVO_MAP[actuatorKey];
      if (servoId !== undefined) {
        commands.push({
          servo_id: servoId,
          position: Math.round(normalizedValue * 1000), // 0.0–1.0 → 0–1000
          speed: 80, // Default movement speed
        });
      }
    }

    if (commands.length === 0) {
      return { ok: true, actuatorsUpdated: 0 };
    }

    const start = Date.now();

    try {
      const response = await fetch(`${this.apiUrl}/servos/command`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commands }),
      });

      const result: MyRobotResponse = await response.json();
      const latencyMs = Date.now() - start;

      if (result.status === "ok") {
        // Update internal face state
        Object.assign(this.lastFaceState, actuation);
      }

      return {
        ok: result.status === "ok",
        latencyMs,
        actuatorsUpdated: commands.length,
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Read current hardware state.
   */
  async getFeedback(): Promise<AdapterFeedback> {
    return {
      timestamp: Date.now(),
      vendor: this.vendor,
      connected: this.connected,
      faceState: { ...this.lastFaceState },
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.apiUrl = null;
    this.apiKey = null;
  }
}

// ── Usage example ─────────────────────────────────────────────────────────

async function example() {
  // 1. Create your adapter
  const adapter = new MyRobotAdapter();

  // 2. Connect to hardware
  const connection = await adapter.connect({
    apiUrl: "http://my-robot-ip:8080",
    apiKey: "your-api-key",
  });
  console.log("Connected:", connection);

  // 3. Compute a warm smile expression
  const command = computeActuators({
    expressionType: "warm_smile",
    positiveExprBias: 65,
    smileIntensity: 0.85,
    eyeContactLevel: 0.7,
    asymmetryAllowance: 8,
  });

  // 4. Send the expression to your robot
  const result = await adapter.sendCommand(command);
  console.log("Command sent:", result);

  // 5. Read hardware feedback
  const feedback = await adapter.getFeedback();
  console.log("Hardware state:", feedback.faceState);
}
