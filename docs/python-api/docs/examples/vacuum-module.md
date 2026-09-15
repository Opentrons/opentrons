---
title: "Python API: Vacuum Module Examples"
description: Code samples that demonstrate using the Opentrons Python API to run protocols and control hardware.
---

This use case examines an automated miniprep protocol for the Flex liquid handling robot and the Vacuum Module. It is excerpted from a real, multi-stage python protocol. While the underlying protocol performs a nucleic acid miniprep, our focus here is on how the API code and how it's used with the Vacuum Module, the Gripper, pipettes, and related labware. In this example, you'll see how API commands are used to programmatically reconfigure the manifold stack mid-protocol, apply different vacuum pressures for different filter types, and execute pipetting actions concurrently while the Vacuum Module operates independently, in the background.

### Stage 1: protocol metadata

Every protocol file starts with metadata and requirements. In this sample:

- The `metadata` dictionary contains protocol information such as its name and an optional, brief description, which is displayed in the Opentrons App and on the Flex touchscreen.

- The `requirements` dictionary tells us what robot model to use (Flex) and the API version (v2.31). Note that the Vacuum Module works with the Flex only and requires API version 2.30, or higher, to run.

```python
from opentrons import protocol_api
from opentrons.protocol_api import VacuumModuleContext

metadata = {
    "protocolName": "Miniprep Vacuum Module Use Case",
    "description": "Demonstrates waste collection, direct-to-waste washing, and concurrent execution."
}

requirements = {"robotType": "Flex", "apiLevel": "2.31"}
```

### Stage 2: Loading modules and labware

The protocol begins by loading hardware and staging labware. Staging the collar on the dock allows the Flex Gripper to assemble the internal stack (like spacers and collection plates) directly inside the vacuum manifold base.

```python
def run(protocol: protocol_api.ProtocolContext):
    # Load modules and waste routing
    vacuum: VacuumModuleContext = protocol.load_module("vacuumModuleV1", "A3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    waste_chute = protocol.load_waste_chute()

    # Stage the tall collar on the vacuum module dock (slot A4)
    collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_tall")

    # Load an internal spacer and collection plate into the manifold base (slot A3)
    short_spacer = protocol.load_adapter("opentrons_vacuum_manifold_spacer_short", "A1")
    collection_plate = vacuum.load_labware(
        "nunc_96_wellplate_450ul", label="Lysate Collection Plate"
    )

    # Stage the filter plates and pipetting tools
    filter_plate = short_spacer.load_labware(
        "cytiva_96_wellplate_1000ul_shorttip_filter", label="Clarification Plate"
    )
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

## Protocol takeaways

The miniprep protocol demonstrates several key operational principles of the Vacuum Module API and hardware operations.

### Dynamic stack configuration

The Flex, Vacuum Module, and related hardware can adapt to changing filtration requirements mid-protocol. For example, the code commands the Gripper alternate between collecting filtrate into an internal well plate, clearing large volumes of wash buffer directly into the base waste line, and recovering purified product into a final PCR plate. Staging collars on the dock (slot A4) allows the Gripper to autonomously assemble, seal, and unstack these components.

### Non-blocking operations and concurrency

Operational commands like start_set_vacuum_pressure() run asynchronously and return a `Task` object. Because these commands do not pause the protocol, the robot can perform independent liquid handling actions (e.g., aspirating and dispensing buffers) or running other deck modules and pipetting while the Vacuum Module operates on its own.

### Pressure profiles

Pressure sensors in the Control Box allows the module to apply multiple vacuum pressures based on liquid volumes and membrane porosities at different protocol stages. As shown in the examples, the protocol starts with a gentle vacuum (-330 mbar) during clarification, then uses an intermediate vacuum (-500 mbar) to quickly clear washes, and ends by running the module to its maximum capacity (-800 mbar) to dry the silica membrane for elution.

### Depressurization and Gripper safety

Attempting to move labware while the manifold remains under vacuum raises an API error. Setting vent_after=True with an equalize_timeout_s delay ensures the module vents to atmospheric pressure (0 mbar) at the end of a cycle. Synchronizing the background task with wait_for_tasks() ensures the system is depressurized before the Gripper attempts to move the collar or labware.
