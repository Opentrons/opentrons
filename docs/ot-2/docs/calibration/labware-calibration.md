---
title: "Opentrons OT-2: Labware Calibration"
---

Labware calibration helps the OT-2 match the physical dimensions and deck locations of labware with their corresponding definitions in the software. Labware offsets and the Labware Position Check are the two procedures that comprise labware calibration.

## Labware offsets

Labware offsets are fine-tuned positional coordinates that help the OT-2 align its pipette relative to a specific piece of labware. A key feature of these offsets is protocol independence: because offset data is associated with the physical labware and saved directly on the robot, you can reuse the same offsets across different protocols.

Depending on how they are created and used, offsets fall into three categories:

| Offset&nbsp;type | Description |
| :--- | :--- |
| **Default** | Created manually via Labware Position Check and automatically applied to every instance of that labware. This "measure once, set everywhere" approach reduces setup time for duplicate labware across any deck slot or protocol. |
| **Applied** | Overrides a default offset for a specific piece of labware in a specific deck slot. You can reuse this offset in other protocols, but only for that exact labware-and-slot combination. |
| **Hardcoded** | Defined directly in Python API protocols using `set_offset`. Because these offsets are written into the code, they cannot be adjusted via the Opentrons App or touchscreen; you must edit the Python script. See [Setting Labware Offsets](../../python-api/advanced-control/jupyter.md#setting-labware-offsets).. |

## Labware Position Check

Labware Position Check lets you align a pipette relative to a piece of labware (e.g., a well plate), which helps ensure accurate and reproducible pipetting results.

You must ensure that each piece of labware used in your protocol has a default or applied offset associated with it.

## Running Labware Position Check

STEPS HERE.


!!! note
    Labware Position Check corrects for minor, millimeter-scale pipette and labware alignment variations. If you find yourself using it to compensate for large, multi-centimeter offsets, this may suggest an alignment problem related to labware manufacturing defects or incorrect labware definitions. Contact Opentrons Support if you encounter persistent, significant instrument or labware misalignments.
