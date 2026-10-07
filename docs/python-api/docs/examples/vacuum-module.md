---
title: "Python API: Vacuum Module Examples"
description: How the Vacuum Module uses API commands in a miniprep protocol.
---

This use case is based on a plasmid miniprep protocol. It excludes intermediate steps to focus on those Python API commands that control the Vacuum Module. 

!!! note
    The Vacuum Module is supported only on Opentrons Flex and requires Python API version 2.31 or higher.

## Workflow overview

A plasmid miniprep is a technique used to isolate DNA. This analysis examines key API methods and operations that involve the Vacuum Module, such as:

* **Loading modules and labware:** Specifies the modules, labware, adapters, and deck or gantry locations required for the protocol. 

* **Filtrate collection:** Provides an example of Flex Gripper movement, collar sealing, and concurrent vacuum and pipetting actions.

* **Sample binding and waste disposal:** Concludes with module stack reconfigurations, waste extraction, membrane drying, and multiple vacuum pressure profiles.

## Stage 1: Loading modules and labware

The protocol begins by defining what the robot will use and where to find it. During this stage, the `run()` function initializes modules, maps the starting deck layout, and stages labware for our miniprep protocol. 

* **Modules and waste chute:** The Vacuum Module requires deck slots A3–A4 which displaces the trash bin from its default location in slot A3. To dispose of waste generated during the miniprep, this protocol calls [`load_waste_chute()`][opentrons.protocol_api.ProtocolContext.load_waste_chute] to load the external waste chute in slot D3.

* **Collars and spacers:** The tall manifold collar is staged on the dock, which is the raised part of the deck adapter that occupies slot A4. A 3.2 mm spacer is loaded on the manifold base, in the recessed part of the deck adapter that occupies slot A3. Because the gripper cannot pickup a spacer, you must place it on the vacuum base manually.

* **Filter plates:** Because filter plates cannot sit directly on a deck slot you have to nest them inside a deeper well plate. This protocol loads nested filter plates in slots A1 and C1 where they can be picked up by the gripper.

* **Reagents and pipettes:** A 12 well reservoir loaded in slot A2 and 1000 μL tip rack loaded in slot B2 supply the attached 96-channel pipette.

```python
def run(protocol: protocol_api.ProtocolContext):
    # Load modules and the waste chute (replaces the trash bin)
    vacuum = protocol.load_module("vacuumModuleV1", "A3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    waste_chute = protocol.load_waste_chute()

    # Loads a manifold collar, spacer, and nested filter plates
    collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_tall")
    spacer = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_3.2mm")
    collection_plate = spacer.load_labware(
        name="nunc_96_wellplate_450ul",
        label="Lysate Collection Plate"
    )

    mixing_plate = protocol.load_labware(
      "nest_96_wellplate_2ml_deep",
      "A1"
    )
    filter_plate = mixing_plate.load_labware(
        "cytiva_96_wellplate_1000ul_shorttip_filter",
        label="Clarification Plate"
    )
    elution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "C1",
        label="Elution Plate"
    )
    silica_plate = elution_plate.load_labware(
        "cytiva_96_wellplate_1000ul_longtip_filter",
        label="Silica Plate"
    )
    
    # Loads other instruments, labware and supplies used by the protocol
    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "A2")
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    pipette = protocol.load_instrument("flex_96channel_1000", "left", tip_racks=[tips])
```

!!! tip "Tip: stacking spacers"
    Although this use case requires only one spacer, you can stack manifold spacers on other spacers with `load_adapter()`:

    ```python
    vacuum = protocol.load_module("vacuumModuleV1")
    spacer1 = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_3.2mm")
    spacer2 = spacer1.load_adapter("opentrons_vacuum_manifold_spacer_12.8mm")
    collection_plate = spacer2.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")
    collar = vacuum.load_adapter("opentrons_vacuum_manifold_collar_tall")
    filter_plate = collar.load_labware("millipore_96_wellplate_300ul_filter")
    ```

For more information on spacer stacking, see the [Spacers section](../../vacuum/specifications/deck-components.md#spacers) in the Vacuum Module Instruction Manual.

## Stage 2: Filtrate collection and liquid handling

During this stage, the robot uses [concurrent module commands](../modules/concurrent.md) to run filtration and pipetting tasks simultaneously. After parallel pipetting is finished, calling `wait_for_tasks()` pauses protocol execution until the vacuum task completes.

### Liquid collection

To prepare for lysate extraction, the gripper moves the short-tip filter plate onto the collection plate seated on the manifold base, then places the tall collar over both plates to form a vacuum seal.

* **Stack assembly:** The gripper stacks the short tip filter plate over the collection plate that's seated in the vacuum base. Then the gripper positions the tall collar over the filter plates to create a vacuum seal.

* **Asynchronous operation:** Calling [start_set_vacuum_pressure()][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure] applies -330 mbar for 60 seconds and returns a [Task][opentrons.protocol_api.Task] object. Because `start_set_vacuum_pressure()` is a non-blocking command, the robot can perform other operations while the Vacuum Module runs.

* **Equalizing pressure:** Setting `vent_after=True` and `equalize_timeout_s=20` tells the module to open its vent and wait 20 seconds for the system to return to atmospheric pressure (0 mbar).

```python
    # Use the gripper to assemble the filtration stack.
    protocol.move_labware(filter_plate, collection_plate, use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)

    # Use a non-blocking command to extract lysate
    clarify_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-330,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=20,
    )
```

### Liquid handling

Calling `protocol.wait_for_tasks([clarify_task])` switches the robot back to serial operation, preventing other commands from running until the system depressurizes. Waiting for the system to return to atmospheric pressure allows the gripper to move labware off the module.

```python
    # Pipette concurrently while the Vacuum Module runs.
    pipette.pick_up_tip()
    pipette.aspirate(400, reservoir["A5"])
    pipette.dispense(400, mixing_plate["A1"])
    pipette.drop_tip()

    # Wait for filtration to complete and system pressure to equalize.
    protocol.wait_for_tasks([clarify_task])

    # The gripper returns the collar to the dock and discards the clarification plate.
    vacuum.move_to_dock(collar, use_gripper=True)
    protocol.move_labware(filter_plate, waste_chute, use_gripper=True)
```

## Stage 3: Direct-to-waste wash and dry

In this stage, the gripper moves plates and collars to change the stack from filtrate collection to sample binding, washing, and membrane drying procedures.

* **Stack configuration:** The gripper picks up and moves the collection plate from the module to deck slot D2. It then moves the tall collar from the dock, places it on vacuum base, and sets the silica plate on top. This configuration extracts waste through the vacuum base and into the carboy.

* **Wash and dry:** Calling `start_set_vacuum_pressure()` applies -500 mbar for 60 seconds to extract the wash buffer from the sample. This method also incudes `equalize_timeout=10`, which gives the system a chance to return to atmospheric pressure before executing other tasks. Another call to `start_set_vacuum_pressure()` applies a deep -800 mbar vacuum for 60 seconds. This process dries the membrane in the silica plate.

<!--- trying to make a comparison here, not sure if useful --->
!!! note "Serial vs concurrent operations"
    In Stage 2, note that pipetting actions run concurrently before calling `wait_for_tasks()`. In Stage 3, `wait_for_tasks()` is called after each vacuum step. This makes the robot execute wash and dry operations serially.

```python
    # Configure the stack for waste extraction to the carboy
    protocol.move_labware(collection_plate, "D2", use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)
    protocol.move_labware(silica_plate, collar, use_gripper=True)

    # Extract wash buffer to carboy
    bind_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-500,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([bind_task])

    # Dry the silica filter plate
    dry_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-800,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=30,
    )
    protocol.wait_for_tasks([dry_task])
```

## Protocol takeaways

The miniprep protocol demonstrates several key operational principles of the Vacuum Module API.

### Dynamic stack configuration

Using the gripper, the Vacuum Module adapts to changing filtration requirements mid-protocol. For example, the sample protocol alternates between collecting filtrate into an internal well plate, clearing wash buffer directly into the base waste line, and recovering purified product into a an elution plate. Staging collars on the dock (slot A4) allows the gripper to autonomously assemble, seal, and unstack module components.

### Non-blocking operations and concurrency

Commands like `start_set_vacuum_pressure()` run asynchronously and return a `Task` object. Because these commands do not pause protocol execution, the robot can perform independent liquid handling actions (e.g., pipetting buffers) or control other deck modules while the Vacuum Module operates on its own.

### Pressure profiles

Pressure sensors in the Control Box allows the module to change and maintain vacuum pressures based on liquid volumes and membrane porosities. For example, the sample protocol applies -330 mbar for lysate clarification, then uses -500 mbar to quickly clear waste, and ends at -800 mbar to dry the silica membrane.

### Depressurization and gripper safety

Moving labware while the manifold remains under vacuum raises an API error. Setting `vent_after=True` with`equalize_timeout_s` lets the module return to atmospheric pressure (`0` mbar) at the end of a cycle. Synchronizing tasks with `wait_for_tasks()` ensures the system is depressurized before the gripper attempts to move collars and labware.
