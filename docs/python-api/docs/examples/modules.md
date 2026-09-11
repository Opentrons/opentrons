---
title: "Python API: Module Examples"
description: Code samples that demonstrate using the Opentrons Python API to run protocols and control hardware.
---

## Vacuum module miniprep use case

This example demonstrates how a plasmid miniprep protocol uses Vacuum Module API methods. A miniprep a common, but often tedious, laboratory procedure used in molecular biology to isolate DNA. The Opentrons Flex pared with the Vacuum Module and other Opentrons deck modules and labware, helps speed up this procedure through full automation of all the steps in a miniprep workflow.

## Some descriptive header here



### Protocol metadata

Every protocol file starts with metadata. This is a dictonary that defines specific requirements for a protocol At a minimum, a Flex protocol needs a requirements block to define the robot as a Flex and the API version (the minimum API version for the Vacuum Module is v2.30). Our miniprep use case is no different. The protocol code starts as shown:

```python
from opentrons import protocol_api
from opentrons.protocol_api import VacuumModuleContext

metadata = {
    "protocolName": "Multi-Stage Purification Use Case",
    "description": "Demonstrates internal collection, direct-to-waste washing, and concurrent pipetting",
}

requirements = {"robotType": "Flex", "apiLevel": "2.30"}
```

Created automatically by the Opentrons App, AI, or Protocol Designer.

"Step" or "Stage"

### Part 1: load modules and labware

Some description or summary here.

```python
def run(protocol: protocol_api.ProtocolContext):
    vacuum: VacuumModuleContext = protocol.load_module("vacuumModuleV1", "A3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    waste_chute = protocol.load_waste_chute()

    # Stage the tall collar on the vacuum module dock (slot A4)
    collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_tall")

    # Load a spacer in deck slot A1 and well plates
    short_spacer = protocol.load_adapter(
        "opentrons_vacuum_manifold_spacer_short", "A1"
    )
    collection_plate = vacuum.load_labware(
        "nunc_96_wellplate_450ul", label="Lysate Collection Plate"
    )
    filter_plate = short_spacer.load_labware(
        "cytiva_96_wellplate_1000ul_shorttip_filter", label="Clarification Plate"
    )

    # Load a silica binding plate, a reservoir of reagent, a pipette and tiprack
    silica_plate = protocol.load_labware(
        "cytiva_96_wellplate_1000ul_longtip_filter", "C1", label="Silica Plate"
    )
    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "A2")
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    pipette = protocol.load_instrument("flex_96channel_1000", "left", tip_racks=[tips])
```

### Part 2: clarify and filter

Some description or summary here. Mention concurrent or simultaneous actions. Split code into 2 blocks here:

- labware movement and setting vacuum parameters
- Concurrent actions (can we say "parallel" or "simultaneous"?)

block 1

```python
# Stack the filter plate over the collection plate inside the manifold base
    protocol.move_labware(filter_plate, collection_plate, use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)

    # Start gentle vacuum to draw clarified lysate without fouling the filter
    clarify_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-330,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=20,
    )
```

block 2, the concurrent stuff, do some hand waving

```python
    # The Flex can pipette liquids or manipulate labware in other deck slots while 
    # the vacuum pump runs in the background
    pipette.pick_up_tip()
    pipette.aspirate(400, reservoir["A5"])
    # Dispense binding agent into downstream processing plate...
    pipette.drop_tip()

    # Wait for filtration, venting, and pressure equalization to finish
    protocol.wait_for_tasks([clarify_task])

    # Return the collar to the dock and discard the exhausted clarification filter
    vacuum.move_to_dock(collar, use_gripper=True)
    protocol.move_labware(filter_plate, waste_chute, use_gripper=True)
```

### Part 3: waste binding, wash, and dry

More description here, focus is on vacuum module

```python
# Move collection plate off the module to open the base for direct draining
    protocol.move_labware(collection_plate, "D2", use_gripper=True)

    # Seat the collar on the base and load the silica plate directly onto it
    protocol.move_labware(collar, vacuum, use_gripper=True)
    protocol.move_labware(silica_plate, collar, use_gripper=True)

    # Sample Binding: evacuate waste liquid directly to the 2 L carboy
    bind_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-500,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([bind_task])

    # Membrane Drying: deep vacuum profile to clear residual wash ethanol
    dry_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-800,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=30,
    )
    protocol.wait_for_tasks([dry_task])
```

### Step 4: recover elution

Collect the liquid.

```python
# Return collar to dock to access the empty base cavity
    vacuum.move_to_dock(collar, use_gripper=True)

    # Place a clean PCR plate inside the base, then stack the silica plate and collar
    elution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C2", label="Elution Plate"
    )
    protocol.move_labware(elution_plate, vacuum, use_gripper=True)
    protocol.move_labware(silica_plate, elution_plate, use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)

    # Pull purified eluate into the recovery plate
    elute_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-500,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=20,
    )
    protocol.wait_for_tasks([elute_task])

    # Return collar to the dock to expose the purified samples for downstream use
    vacuum.move_to_dock(collar, use_gripper=True)
```

## Procedure conclusion

The "what did we learn" section, learn about the code and the module. Less about the "miniprep" as a thing.

Key concepts here or at beginning?

## Full protocol?

Use drop-down? Exclude?

If you're interested in the complete Python protocol, you can review and copy this file here.

<font color="red">Expand section with complete .py file? 900 lines. </font>