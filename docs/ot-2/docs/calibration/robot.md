---
title: "Opentrons OT-2: Robot Calibration"
---

Start here for an overview of the robot calibration process and instructions on how to perform this procedures.

## Calibration overview

Your OT-2 moves gantry-mounted pipettes in three dimensional space (left-right, front-back, up-down). To move accurately, the robot needs a precise map of its own hardware relative to a good reference point, the deck. The robot calibration process creates this map.

<font color="red">IMAGE PLACEHOLDER</font>

There are three positional calibrations that work together in a hierarchy:

- **Deck calibration:** The foundation of it all. This process maps the deck to the gantry.
- **Tip length calibration:** Helps the robot measure the distance from the tip of the pipette to the nozzle.
- **Pipette offset calibration:** Aligns the pipette nozzle to the calibrated deck.

## Deck calibration

Deck calibration helps the OT-2 understand deck location and scale. This calibration ensures that movement distance in software equals that same physical distance across the deck. It compensates for physical variations cause by things like:

* How the deck is fastened to the frame.
* Parallelism of the gantry rails.
* Manufacturing tolerance variations in motors and pulleys.

!!! note
    Deck calibration does *not* account for the deck being tilted or bent. It assumes the deck is perfectly level.

### How it works

During deck calibration, the Opentrons App guides you to manually jog the pipette to specific reference points precision-engraved into the deck surface. The robot measures the motor steps required to reach each point and performs calculations to match its internal coordinate system to the actual location of physical deck.

### When to calibrate the deck

Deck calibration is required:

* **During setup:** Always calibrate after unboxing and assembling an OT-2.
* **After relocation:** Always calibrate after moving the robot more than a short distance.
* **For troubleshooting:** A good idea to try if the robot experiences consistent positioning errors across the deck.

## Tip-length calibration

Tip length calibration measures the Z-axis distance between the pipette’s nozzle and the bottom of the tip. This helps ensure the robot knows exactly how close the tip is to the deck or labware.

Because pipette nozzles vary slightly in manufacturing, this calibration is unique to specific pipette and tip combinations. For example, if you have two identical P300 pipettes, they each need their own tip length calibration for the same box of tips.

### How it works

During tip-length calibration, the OT-2 measures the height of the bare pipette nozzle against a flat surface. Next, it picks up a tip from a tip rack and performs movements to determine the height of the tip compared the reference. The difference between the measurements is saved as the tip length.

### When to calibrate

Tip-length calibration is required the first time you use a specific tip type or model with a specific pipette. Also, you must perform this calibration _before_ you can check the pipette offset.

## Pipette offset calibration

Pipette off set calibration calculates the precise X, Y, and Z position of the pipette nozzle relative to the pipette mount and the deck. It accounts for slight variations in how the pipette is screwed onto the mount and how the mount sits on the gantry. The pipette offset calibration relies on the deck and tip length measurements and is the final part of the robot calibration process.

### How it works

During pipette offset calibration, the robot moves the pipette to a known slot on the deck. You manually jog the pipette until the nozzle is perfectly centered over a specific reference point. The OT-2 saves this adjustment (the "offset") and applies it to every movement that pipette makes.

### When to calibrate

A pipette offset calibration is required after:

- Attaching a new pipette to the gantry.
- Running a deck calibration.
- Running a tip length calibration.

## Running robot calibrations 

The calibration controls are located in the Robot Settings section of the Opentrons App. To calibrate your OT-2:

<div class="instruction-list" markdown>

1. Click the **Devices** tab in the Opentrons App.
2. Find your robot in the list and click on it. This opens the details page.
3. Click the three-dot menu (⋮) and then click **Robot settings**. This opens the Calibration tab in the Settings screen.
4. Click **Launch Calibration**. Instructions and animations will guide you through the robot calibration process.

</div>

## Jog controls

Placeholder text here.

<font color="red">IMAGE PLACEHOLDER</font>
