# @characteros/nexus-sdk

**The open-source Nexus Protocol adapter interface for CharacterOS.**

Build a hardware adapter for any social robot platform and connect it to CharacterOS character middleware — brand-consistent personality, deterministic safety enforcement, cultural calibration, and compliance logging, delivered as a cloud service.

[![npm version](https://img.shields.io/npm/v/@characteros/nexus-sdk)](https://www.npmjs.com/package/@characteros/nexus-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What This Is

The Nexus Protocol is a hardware-agnostic standard for deploying AI character personalities on social robots. It defines:

- A **universal actuator command format** (26 normalized float values, actuator_01 through actuator_26)
- A **base adapter interface** (`RobotAdapter`) that any hardware platform implements
- A **`computeActuators()` function** that translates high-level emotional state into per-actuator values
- A **JEPA joint map** for world-model-based robot architectures

Your adapter receives normalized commands from CharacterOS and translates them to your hardware's native format — servo positions, REST API calls, ROS 2 topics, WebSocket messages, whatever your robot expects.

**CharacterOS handles everything above the hardware layer:**
- Safety Harness (deterministic, jailbreak-resistant) — *proprietary cloud service*
- Cultural calibration across 6 regional profiles — *proprietary cloud service*
- Daily Alignment Agent (9-provider LLM ensemble) — *proprietary cloud service*
- NBC Protocol (Never Break Character enforcement) — *proprietary cloud service*
- AI Literacy compliance documentation — *proprietary cloud service*

You build the adapter. CharacterOS handles the character.

---

## Installation

```bash
npm install @characteros/nexus-sdk
```

---

## Quick Start

### 1. Use the mock adapter for development

```typescript
import { MockAdapter, computeActuators } from "@characteros/nexus-sdk";

const adapter = new MockAdapter();
await adapter.connect({});

// Compute a warm smile expression
const command = computeActuators({
  expressionType: "warm_smile",
  positiveExprBias: 65,
  smileIntensity: 0.85,
  eyeContactLevel: 0.7,
});

// Send to adapter
const result = await adapter.sendCommand(command);
console.log(result);
// { ok: true, latencyMs: 42, actuatorsUpdated: 26 }

// Read hardware state
const feedback = await adapter.getFeedback();
console.log(feedback.faceState);
```

### 2. Build your own adapter

```typescript
import {
  RobotAdapter,
  type AdapterConnectResult,
  type ActuationCommand,
  type AdapterCommandResult,
  type AdapterFeedback,
} from "@characteros/nexus-sdk";

export class MyRobotAdapter extends RobotAdapter {
  constructor() {
    super();
    this.vendor = "my_robot";
  }

  async connect(config: Record<string, unknown>): Promise<AdapterConnectResult> {
    // Open your hardware connection here
    this.connected = true;
    return { ok: true, vendor: this.vendor, dof: 26 };
  }

  async sendCommand(actuation: ActuationCommand): Promise<AdapterCommandResult> {
    if (!this.validateCommand(actuation)) return { ok: false };

    // Translate actuator_01..26 (0.0–1.0) to your hardware format
    const nativeCommand = this.toNativeFormat(actuation);
    await this.hardware.send(nativeCommand);

    return {
      ok: true,
      latencyMs: 30,
      actuatorsUpdated: Object.keys(actuation).length,
    };
  }

  async getFeedback(): Promise<AdapterFeedback> {
    return {
      timestamp: Date.now(),
      vendor: this.vendor,
      connected: this.connected,
    };
  }

  private toNativeFormat(actuation: ActuationCommand) {
    // Your translation logic here
    // actuator_01 → 0.0–1.0 becomes your hardware's native range
  }
}
```

---

## Actuator Reference

The Nexus Protocol uses 26 standardized actuator identifiers. All values are normalized floats in `[0.0, 1.0]`.

| Key | Anatomy | Description |
|-----|---------|-------------|
| `actuator_01` | jaw_open | Jaw opening |
| `actuator_02` | lip_corner_left | Left lip corner raise (smile) |
| `actuator_03` | lip_corner_right | Right lip corner raise (smile) |
| `actuator_04` | lip_upper_raise | Upper lip raise |
| `actuator_05` | lip_lower_depress | Lower lip depress |
| `actuator_06` | cheek_raise_left | Left cheek raise (Duchenne marker) |
| `actuator_07` | cheek_raise_right | Right cheek raise (Duchenne marker) |
| `actuator_08` | brow_raise_left | Left brow raise |
| `actuator_09` | brow_raise_right | Right brow raise |
| `actuator_10` | brow_lower_left | Left brow lower (concern/focus) |
| `actuator_11` | brow_lower_right | Right brow lower |
| `actuator_12` | eye_wide_left | Left eye widening |
| `actuator_13` | eye_wide_right | Right eye widening |
| `actuator_14` | nose_wrinkle | Nose wrinkle |
| `actuator_15` | lip_upper_right | Upper right lip |
| `actuator_16` | dimpler_left | Left dimpler |
| `actuator_17` | dimpler_right | Right dimpler |
| `actuator_18` | chin_raise | Chin raise |
| `actuator_19` | neck_pan | Neck left/right rotation |
| `actuator_20` | neck_tilt | Neck side tilt |
| `actuator_21` | neck_nod | Neck forward/backward nod |
| `actuator_22` | eye_gaze_h_left | Left eye horizontal gaze |
| `actuator_23` | eye_gaze_v_left | Left eye vertical gaze |
| `actuator_24` | eye_gaze_h_right | Right eye horizontal gaze |
| `actuator_25` | eye_gaze_v_right | Right eye vertical gaze |
| `actuator_26` | tongue_out | Tongue protrusion |

**Convention:** `0.5` = neutral/center for all actuators. Values above `0.5` increase the motion; values below `0.5` decrease it. Gaze actuators: `0.5` = forward, `0.0` = full left/up, `1.0` = full right/down.

---

## computeActuators()

Translates a high-level `ExpressionVector` into a full 26-actuator command.

```typescript
import { computeActuators } from "@characteros/nexus-sdk";

const command = computeActuators({
  expressionType: "warm_smile",   // "warm_smile" | "gentle_smile" | "raised_brows" | "neutral"
  positiveExprBias: 65,           // 0–100, default 50. >50 amplifies positive expressions
  smileIntensity: 0.85,           // 0.0–1.0, default 0.8. Cultural calibration for smile
  eyeContactLevel: 0.7,           // 0.0–1.0, default 0.7. Higher = more direct gaze
  asymmetryAllowance: 8,          // 0–100, default 0. Biological left/right offset (max ±4%)
});
```

### Expression presets

| Preset | Use case |
|--------|----------|
| `warm_smile` | Greetings, positive acknowledgments, hospitality |
| `gentle_smile` | Listening, empathy, softer positive engagement |
| `raised_brows` | Curiosity, surprise, engagement |
| `neutral` | Resting, listening, transitions |

---

## JEPA Support (World Model Robots)

For world-model-based robot platforms using Joint Embedding Predictive Architecture:

```typescript
import { computeActuators, translateToJEPA } from "@characteros/nexus-sdk";

const cosCommand = computeActuators({ expressionType: "warm_smile" });
const jepaCommand = translateToJEPA(cosCommand);

// jepaCommand uses JEPA dot-notation:
// { "face.jaw.open": 0.15, "face.lip_corner.left": 0.82, ... }
```

---

## Connect to CharacterOS Cloud

The Nexus Protocol SDK is the open-source adapter layer. The full CharacterOS platform provides:

- **Safety Harness** — deterministic, jailbreak-resistant safety enforcement (patent pending)
- **Cultural Calibration** — 6 regional expression profiles with per-dimension modifiers
- **Daily Alignment Agent** — nightly character improvement via 9-provider LLM ensemble
- **NBC Protocol** — Never Break Character enforcement across all interactions
- **AI Literacy Reports** — one-click compliance documentation for enterprise procurement

Get access at **[characteros.cloud](https://characteros.cloud)**

---

## Contributing

Contributions welcome. If you've built an adapter for a robot platform not yet in the CharacterOS ecosystem, open a PR.

See [examples/my-robot-adapter.ts](examples/my-robot-adapter.ts) for a complete annotated example.

---

## License

MIT — see [LICENSE](LICENSE).

The CharacterOS Safety Harness, Cultural Calibration Engine, Daily Alignment Agent, NBC Protocol, and AI Literacy Report are proprietary CharacterOS Cloud services and are not included in this SDK.

*Patent pending — CharacterOS Provisional Patent Application, USPTO, July 2026.*
