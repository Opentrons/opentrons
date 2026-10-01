---
title: "Python API: Vacuum Module Examples"
description: An analysis of how the Vacuum Module uses API commands in a miniprep protocol.
---

This use case is based on a plasmid miniprep protocol. It excludes some intermediate steps to focus on those Python API commands that control the Vacuum Module. 

!!! note
    The Vacuum Module is supported only on Opentrons Flex and requires Python API version 2.30 or higher.

The code analysis starts below.

## Workflow overview

A plasmid miniprep is a technique used to isolate DNA. Rather than covering the complete protocol this analysis examines key operations that involve the Vacuum Module, such as:

* **Loading modules and labware:** Specifies the modules, labware, adapters, and deck or gantry locations required for the protocol. 

* **Filtrate collection:** Provides an example of Gripper movement, collar sealing, and concurrent vacuum and pipetting actions.

* **Sample binding and waste disposal:** Concludes with module stack reconfigurations, waste extraction, membrane drying, and multiple vacuum pressure profiles.

## Stage 1: Loading modules and labware

During this stage, the `run()` function initializes hardware, defines the deck layout, and loads the starting labware. Before executing any miniprep protocol steps, this specifies what the robot will use and where to find it on the deck.

```python
def run(protocol: protocol_api.ProtocolContext):
    # Load modules and external waste chute.
    # The Vacuum Module adapter occupies slots A3 and A4, displacing the trash bin.
    # The external waste chute replaces the trash bin for waste handling.
    vacuum = protocol.load_module("vacuumModuleV1", "A3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    waste_chute = protocol.load_waste_chute()

    # Stage the tall collar on the vacuum module dock (slot A4)
    collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_tall")

    # Stage the spacer and collection plate.
    spacer = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_3.2mm")
    collection_plate = spacer.load_labware(
        "nunc_96_wellplate_450ul",
        label="Lysate Collection Plate"
    )

    # Stage the clarification filter plate nested in a deep-well plate.
    # Nesting allows for staging filer plates in a deck location.
    # The Gripper can grab and move the plate from this deck location.
    holding_plate = protocol.load_labware(
      "nest_96_wellplate_2ml_deep",
      "A1"
    )
    filter_plate = holding_plate.load_labware(
        "cytiva_96_wellplate_1000ul_shorttip_filter",
        label="Clarification Plate"
    )

    # Stage the silica filter plate nested in an elution plate.
    elution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "C1",
        label="Elution Plate"
    )
    silica_plate = elution_plate.load_labware(
        "cytiva_96_wellplate_1000ul_longtip_filter",
        label="Silica Plate"
    )
    
    # Stage other labware and instruments used in the protocol.
    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "A2")
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    pipette = protocol.load_instrument("flex_96channel_1000", "left", tip_racks=[tips])
```

### Staging filter plates and spacers

Filter plates have nozzle tips that extend past the bottom of the plate skirt. Placing a filter plate directly on a deck slot causes the API to raise an error. To stage filter plates on a regular deck slot, nest it inside a deep-well plate, which can then be loaded in software from that slot.

Spacers cannot be placed on standard deck slots or moved by the Gripper. Spacers must be seated manually into the vacuum base and loaded in software via `vacuum.load_adapter()`.

### Stacking manifold spacers

Although this use case requires only one spacer, you can accommodate shallow collection labware by stacking spacers directly on a loaded spacer with `load_adapter()` like this:

```python
spacer1 = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_3.2mm")
spacer2 = spacer1.load_adapter("opentrons_vacuum_manifold_spacer_12.8mm")
plate = spacer2.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")
```

## Stage 2: Concurrent actions

During this stage, the robot uses [non-blocking API commands](../modules/concurrent.md) to run filtration and pipetting tasks simultaneously. After parallel pipetting is finished, calling `wait_for_tasks()` pauses protocol execution until the vacuum task completes.

### Liquid collection

To prepare for lysate extraction, the Flex Gripper moves the short-tip filter plate onto the collection plate seated on the manifold base. The Gripper then places the tall collar over both plates to form a vacuum seal.

Because `start_set_vacuum_pressure()` is a non-blocking command, the robot can perform other operations while the Vacuum Module runs.

```python
    # Using the Gripper, assemble the filtration stack. The collar seals the stack.
    protocol.move_labware(filter_plate, collection_plate, use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)

    # Call the non-blocking pressure command at -330 mbar to extract lysate.
    clarify_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-330,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=20,
    )
```

### Liquid handling

Calling `protocol.wait_for_tasks([clarify_task])` switches the robot back to serial operation, preventing other commands from running until the system depressurizes. Allowing time for system pressure to equalize allows the Gripper to move labware off the module.

```python
    # Pipette concurrently while the Vacuum Module runs.
    pipette.pick_up_tip()
    pipette.aspirate(400, reservoir["A5"])
    pipette.drop_tip()

    # Wait for filtration to complete and system pressure to equalize.
    protocol.wait_for_tasks([clarify_task])

    # Using the Gripper, return the collar to the dock and discard the clarification plate.
    vacuum.move_to_dock(collar, use_gripper=True)
    protocol.move_labware(filter_plate, waste_chute, use_gripper=True)
```

## Stage 3: Direct-to-waste wash and dry

In this stage, the Gripper reconfigures the stack to prepare the sample for washing and plate drying.

```python
    #The Gripper moves the lysate collection plate to slot D2.
    protocol.move_labware(collection_plate, "D2", use_gripper=True)

    # The Gripper seats the collar on the vacuum base and places the silica plate on top.
    protocol.move_labware(collar, vacuum, use_gripper=True)
    protocol.move_labware(silica_plate, collar, use_gripper=True)

    # Extract waste directly to the carboy at -500 mbar and wait for system pressure to equalize.
    bind_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-500,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([bind_task])

    # Dry the silica plate at -800 mbar and wait for system pressure to equalize.
    dry_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-800,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=30,
    )
    protocol.wait_for_tasks([dry_task])
```

## Protocol takeaways

The miniprep protocol demonstrates several key operational principles of the Vacuum Module API and hardware operations.

### Dynamic stack configuration

Using the Gripper, the Vacuum Module adapts to changing filtration requirements mid-protocol. For example, the sample protocol alternates between collecting filtrate into an internal well plate, clearing wash buffer directly into the base waste line, and recovering purified product into a an elution plate. Staging collars on the dock (slot A4) allows the Gripper to autonomously assemble, seal, and unstack module components.

!!! tip "Stacking manifold spacers"
    Although this use case didn't require it, you can account for shallow collection labware by stacking a spacer directly on a loaded spacer with `load_adapter()`. For example:


To adjust manifold height for shallow collection labware (such as PCR plates), call `load_adapter()` directly on a loaded spacer to stack another spacer on top:

You can stack multiple spacers inside the vacuum base by calling `load_adapter()` on an existing spacer:


### Non-blocking operations and concurrency

Commands like `start_set_vacuum_pressure()` run asynchronously and return a `Task` object. Because these commands do not pause protocol execution, the robot can perform independent liquid handling actions (e.g., pipetting buffers) or control other deck modules while the Vacuum Module operates on its own.

### Pressure profiles

Pressure sensors in the Control Box allows the module to change vacuum pressures based on liquid volumes and membrane porosities. For example, the sample protocol applies -330 mbar for lysate clarification, then uses -500 mbar to quickly clear waste, and ends at -800 mbar to dry the silica membrane.

### Depressurization and Gripper safety

Moving labware while the manifold remains under vacuum raises an API error. Setting `vent_after=True` with`equalize_timeout_s` lets the module return to atmospheric pressure (`0` mbar) at the end of a cycle. Synchronizing tasks with `wait_for_tasks()` ensures the system is depressurized before the Gripper attempts to move collars and labware.
