---
title: "Python API: Vacuum Module Examples"
description: An analysis of how the Vacuum Module uses API commands in a miniprep protocol.
---

This use case is taken from a plasmid miniprep protocol. Several intermediate steps have been excluded to keep focus on those Python API commands relevant to Vacuum Module operations.

!!! note
    The Vacuum Module is supported on Opentrons Flex only and requires Python API version 2.30 or higher.

## Workflow overview

A plasmid miniprep is a technique used to isolate DNA. A typical protocol involves multiple steps and many lines of code. This code analysis examines processes that involve the Vacuum Module, such as:

* **Filtrate collection:** The procedure begins with nesting a short-tip filter plate in an internal 96-well collection plate on the base of the manifold. The vacuum then draws clarified lysate into a collection plate.

* **Sample binding and waste disposal:** The Gripper reconfigures the stack so the module pulls waste through the manifold into an external carboy. The module then applies different vacuum pressures to collect and dispose of material.

The code analysis starts below.

## Stage 1: Loading modules and labware

During this stage, the `run()` function initializes hardware, defines the deck layout, and loads the starting labware. Before executing any steps in the miniprep protocol, this code tells the robot what's going to be used and where it can be found.

!!! tip "Staging filter plates and spacers"
    * Filter plates have nozzle tips that extend past the bottom of the plate skirt. As a result, you cannot put a filter plate directly on a deck slot or the API will raise an error.
    
    * To stage filter plates on a regular deck slot, nest it inside a deep-well plate, which can then be loaded in software from a deck slot.

    * Spacers cannot be placed on standard deck slots or be manipulated by the Gripper. Spacers must be seated manually into the vacuum base and loaded in software via `vacuum.load_adapter()`.

```python
def run(protocol: protocol_api.ProtocolContext):
    # Load modules and the external waste chute.
    # The Vacuum Module requires slots A3 and A4, displacing the trash bin from its default location.
    # Waste collection is handled by the external waste chute, which replaces the trash bin.
    vacuum = protocol.load_module("vacuumModuleV1", "A3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    waste_chute = protocol.load_waste_chute()

    # Stage the tall collar on the vacuum module dock (slot A4)
    collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_tall")

    # Stage the spacer and collection plate.
    spacer = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_7.25mm")
    collection_plate = spacer.load_labware(
        "nunc_96_wellplate_450ul",
        label="Lysate Collection Plate"
    )

    # Stage the filter plate and a deep well plate.
    # Note plate nesting to stage a filter plate on a regular deck slot.
    # The Gripper can pickup and move the nested plate.
    holding_plate = protocol.load_labware(
      "nest_96_wellplate_2ml_deep",
      "A1"
    )
    filter_plate = holding_plate.load_labware(
        "cytiva_96_wellplate_1000ul_shorttip_filter",
        label="Clarification Plate"
    )

    # Staging and nesting another filter plate.
    elution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "C1",
        label="Elution Plate"
    )
    silica_plate = elution_plate.load_labware(
        "cytiva_96_wellplate_1000ul_longtip_filter",
        label="Silica Plate"
    )
    
    # Staging typical labware used in this miniprep protocol
    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "A2")
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    pipette = protocol.load_instrument("flex_96channel_1000", "left", tip_racks=[tips])
```

## Stage 2: Concurrent actions

During this stage, the robot takes advantage of [non-blocking API commands](../modules/concurrent.md) to run filtration and pipetting actions simultaneously. Once parallel pipetting is complete, you can use `wait_for_tasks()` to pause protocol execution until the vacuum task finishes.

### Liquid collection

To prepare for lysate extraction, the Flex Gripper moves the short-tip filter plate onto the collection plate, which is already seated in the manifold base. The Gripper then places the tall collar over both plates to create a vacuum seal.

Because `start_set_vacuum_pressure()` is a non-blocking command, the robot can carry out other operations while the Vacuum Module operates.

```python
    # The Gripper moves well plates onto the manifold and adds a collar to seal the stack.
    protocol.move_labware(filter_plate, collection_plate, use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)

    # Concurrent method sets a -330 mbar vacuum to extract clarified liquid.
    clarify_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-330,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=20,
    )
```

### Liquid handling

Calling `protocol.wait_for_tasks([clarify_task])` switches the robot back to serial operation preventing other commands from executing until the system depressurizes. Returning the stack to atmospheric pressure allows the Gripper to move labware off the module.

```python
# Pipetting liquids concurrently with Vacuum Module operations.
    pipette.pick_up_tip()
    pipette.aspirate(400, reservoir["A5"])
    pipette.drop_tip()

    # Wait for other operations to finish and equalize pressure before using the Gripper.
    protocol.wait_for_tasks([clarify_task])

    # The Gripper returns the collar to the dock.
    # The Gripper picks up and discards the used clarification filter in the waste chute.
    vacuum.move_to_dock(collar, use_gripper=True)
    protocol.move_labware(filter_plate, waste_chute, use_gripper=True)
```

## Stage 3: Direct-to-waste wash and dry

In this stage, additional Gripper movements reconfigure the stack to prepare the sample for washing and plate drying. 

```python
    #The Gripper moves the lysate collection plate to slot D2.
    #This is a standard well plate and can be placed in a deck slot.
    protocol.move_labware(collection_plate, "D2", use_gripper=True)

    # The Gripper seats the collar on the vacuum base and sets the silica filter plate on top of it.
    # The Gripper moves the collar and silica plate stack onto the vacuum base.
    protocol.move_labware(collar, vacuum, use_gripper=True)
    protocol.move_labware(silica_plate, collar, use_gripper=True)

    # The module executes direct-to-carboy waste extraction procedure.
    # Other tasks pause during this task.
    bind_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-500,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([bind_task])

    # The module executes another waste exctraction procedure using a deep vacuum.
    # Other tasks pause during this task.
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

Using the Gripper, the Vacuum Module can adapt to changing filtration requirements mid-protocol. For example, this protocol alternates between collecting filtrate into an internal well plate, clearing large volumes of wash buffer directly into the base waste line, and recovering purified product into a final PCR plate. Staging collars on the dock (slot A4) allows the Gripper to autonomously assemble, seal, and unstack these components.

<font color="red">Nesting and staging?</font>

### Non-blocking operations and concurrency

Operational commands like `start_set_vacuum_pressure()` run asynchronously and return a `Task` object. Because these commands do not pause the protocol, the robot can perform independent liquid handling actions (e.g., aspirating and dispensing buffers) or control other deck modules and pipetting while the Vacuum Module operates on its own.

### Pressure profiles

Pressure sensors in the Control Box allows the module to apply multiple vacuum pressures based on liquid volumes and membrane porosities at different protocol stages. As shown in the examples, the protocol starts with a vacuum at -330 mbar, then uses a -500 mbar vacuum to quickly clear washes, and ends by running the module at -800 mbar to dry the silica membrane for elution.

### Depressurization and Gripper safety

Attempting to move labware while the manifold remains under vacuum raises an API error. Setting `vent_after=True` with an `equalize_timeout_s` delay lets the module return to atmospheric pressure (`0` mbar) at the end of a cycle. Synchronizing background tasks with `wait_for_tasks()` guarantees the system is fully depressurized before the Flex Gripper attempts to unstack collars or labware.
