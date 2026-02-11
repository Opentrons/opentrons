---
title: "Opentrons OT-2: Labware Calibration"
---

Also known as labware offsets and Labware Position Check.

## Labware offsets

Labware offsets are fine-tuned positional coordinates that help your robot align its pipette relative to a specific piece of labware. The release of robot software version 8.4 introduced significant improvements to the labware offset and position checking system.

IMAGE PLACEHOLDER

## Labware Position Check

Labware Position Check lets you align a pipette relative to a piece of labware (e.g., a well plate), which helps ensure accurate and reproducible pipetting results.

You must ensure that each piece of labware used in your protocol has a default or applied offset associated with it.

## Running Labware Position Check

STEPS HERE.


!!! note
    Labware Position Check corrects for minor, millimeter-scale pipette and labware alignment variations. If you find yourself using it to compensate for large, multi-centimeter offsets, this may suggest an alignment problem related to labware manufacturing defects or incorrect labware definitions. Contact Opentrons Support if you encounter persistent, significant instrument or labware misalignments.
