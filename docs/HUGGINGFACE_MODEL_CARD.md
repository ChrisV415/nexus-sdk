---
license: mit
tags:
  - robotics
  - social-robotics
  - humanoid
  - expression
  - character-ai
  - nexus-protocol
  - face-robot
language:
  - en
pipeline_tag: other
---

# CharacterOS Nexus Protocol — Expression Vector Format

The Nexus Protocol is the open hardware-agnostic standard for deploying
AI character personalities on social robots.

This card documents the **expression vector format** used by CharacterOS
to communicate with robot hardware adapters.

---

## What This Is

CharacterOS is brand-consistent character middleware for social robots.
It handles personality, safety rules, cultural calibration, and compliance
logging. The Nexus Protocol is the open layer that lets any robot hardware
platform connect to CharacterOS.

**Open source (this repo):** the adapter interface, expression vector format,
`computeActuators()` function, and JEPA joint map.

**Proprietary cloud services:** Safety Harness, Cultural Calibration Engine,
Daily Alignment Agent, NBC Protocol, AI Literacy Reports.

---

## Expression Vector

CharacterOS describes emotional state as an `ExpressionVector`:

```json
{
  "expressionType": "warm_smile",
  "positiveExprBias": 65,
  "smileIntensity": 0.85,
  "eyeContactLevel": 0.70,
  "asymmetryAllowance": 8
}
```

The `computeActuators()` function translates this into 26 normalized float
values (all in `[0.0, 1.0]`) representing motor positions for robot face hardware.

---

## The 26-DOF Actuator Standard

| Key | Anatomy |
|-----|---------|
| actuator_01 | jaw_open |
| actuator_02 | lip_corner_left |
| actuator_03 | lip_corner_right |
| actuator_04 | lip_upper_raise |
| actuator_05 | lip_lower_depress |
| actuator_06 | cheek_raise_left |
| actuator_07 | cheek_raise_right |
| actuator_08 | brow_raise_left |
| actuator_09 | brow_raise_right |
| actuator_10 | brow_lower_left |
| actuator_11 | brow_lower_right |
| actuator_12 | eye_wide_left |
| actuator_13 | eye_wide_right |
| actuator_14 | nose_wrinkle |
| actuator_15 | lip_upper_right |
| actuator_16 | dimpler_left |
| actuator_17 | dimpler_right |
| actuator_18 | chin_raise |
| actuator_19 | neck_pan |
| actuator_20 | neck_tilt |
| actuator_21 | neck_nod |
| actuator_22 | eye_gaze_h_left |
| actuator_23 | eye_gaze_v_left |
| actuator_24 | eye_gaze_h_right |
| actuator_25 | eye_gaze_v_right |
| actuator_26 | tongue_out |

All values are normalized floats `[0.0, 1.0]`. `0.5` = neutral/center.

---

## JEPA Joint Map

For world-model-based robot platforms (Joint Embedding Predictive Architecture),
CharacterOS provides a dot-notation joint namespace:

```
actuator_01 → face.jaw.open
actuator_02 → face.lip_corner.left
actuator_03 → face.lip_corner.right
actuator_06 → face.cheek.raise_left
actuator_08 → face.brow.raise_left
actuator_19 → neck.pan
actuator_22 → eye.gaze.h_left
...
```

Full map available in `src/core/jepaMaps.ts`.

---

## Expression Presets

| Preset | jaw | lip_corner | cheek | brow_raise | eye_wide |
|--------|-----|------------|-------|------------|---------|
| warm_smile | 0.15 | 0.82 | 0.72 | 0.30 | 0.58 |
| gentle_smile | 0.10 | 0.60 | 0.52 | 0.25 | 0.45 |
| raised_brows | 0.22 | 0.50 | 0.35 | 0.88 | 0.78 |
| neutral | 0.10 | 0.40 | 0.25 | 0.28 | 0.40 |

---

## How to Use

```bash
npm install @characteros/nexus-sdk
```

```typescript
import { computeActuators } from "@characteros/nexus-sdk";

const command = computeActuators({
  expressionType: "warm_smile",
  smileIntensity: 0.85,
  eyeContactLevel: 0.7,
});

// command.actuator_02 → 0.796 (lip_corner_left, smile position)
// command.actuator_06 → 0.677 (cheek_raise_left, Duchenne marker)
// ...send to your robot adapter
```

---

## Connect Hardware

GitHub: [github.com/ChrisV415/nexus-sdk](https://github.com/ChrisV415/nexus-sdk)
npm: [@characteros/nexus-sdk](https://www.npmjs.com/package/@characteros/nexus-sdk)
Cloud: [characteros.cloud](https://characteros.cloud)

*Patent pending — USPTO July 2026.*
