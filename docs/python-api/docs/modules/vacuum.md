---
Title: "Python API: Vacuum Module"
description: How to use the Vacuum Module in a Python protocol.
---

The Vacuum Module is an automated filtration system for the Opentrons Flex liquid handling robot. This module enables Flex to run vacuum-based protocols for protein and peptide sample cleanup, solid-phase extraction, and nucleic acid extraction, all within in an enclosed system that includes waste collection.

The module is represented in code by a [`VacuumModuleContext`][opentrons.protocol_api.VacuumModuleContext] object that includes methods for deck staging and vacuum control.

For hardware-related information, see the [Vacuum Module Instruction Manual](../../modules/index.md). <!--- landing page for now --->

## Filter plate load names

See the [Opentrons Labware Library](https://labware.opentrons.com/) for filter plate and well plate API load names. You can also find the `loadName` for filter plates in the [definition files on Github](https://github.com/Opentrons/opentrons/tree/edge/shared-data/labware/definitions/2). When searching, note that all filter plate load names end with `_filter`.

## Deck adapter

The Vacuum Module requires a physical deck adapter to hold module components, labware, and other pieces used in a vacuum filtration protocol. This adapter is a single piece that fits in deck slots A3–A4 only.

<figure markdown>
![Deck adapter with labeled features matching slots A3 and A4](images/deck_adapter_features.svg){ width="80%" }
<figcaption>Vacuum Module deck adapter</figcaption>
</figure>

* **Slot A3:** This is the recessed half of the deck adapter that holds the vacuum base piece and its attached 6 mm hose that pulls waste to the carboy. See the instruction manual (linked above) for installation steps.
* **Slot A4:** Known as "the dock," this is the raised half of the deck adapter. It is a staging area for collars (and other parts of the vacuum stack) when they're not seated on the vacuum base or actively used in a protocol. You cannot store or put well plates on the dock.

## Loading deck slots

Load the module using [`ProtocolContext.load_module()`][opentrons.protocol_api.ProtocolContext.load_module] with the load name, `vacuumModuleV1`:

```python
from opentrons import protocol_api
requirements = {"robotType": "Flex", "apiLevel": "2.30"}

def run(protocol: protocol_api.ProtocolContext):
    vacuum = protocol.load_module(
        module_name="vacuumModuleV1",
        location="A3"
    )
```

## Collars and spacers

Collars and spacers are modular components that you use to create deck stacks for different types vacuum filtration protocols. Specific combinations configure the module to collect samples or extract liquids directly to the waste collection carboy. The following sections describe how to stage collars and spacers on the Vacuum Module deck adapter.

### Staging collars

Collars support filter plates during vacuum extraction. The Vacuum Module includes a short and tall collar to match different labware profiles. Collar types and load names are shown below.

| Collar | Height | Load Name |
|:----|:----|:----|
| **Short** | 42 mm | `opentrons_vacuum_manifold_collar_short` |
| **Tall** |72 mm | `opentrons_vacuum_manifold_collar_tall` |

Stage a collar on the manifold dock (slot A4) using [`load_adapter_to_dock()`][opentrons.protocol_api.VacuumModuleContext.load_adapter_to_dock], then load your filter plate directly onto the staged collar:

```python
# Load a short collar on the manifold dock (slot A4)
collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_short")

# Load the sample filter plate onto the staged collar
filter_plate = collar.load_labware(
    load_name="millipore_96_wellplate_500ul_ultracel_filter",
    label="Sample Filter Plate"
)
```

### Staging spacers

Spacers fit inside collars (and the vacuum base). Spacers are used to raise a collection well plate so it's closer a filter plate. Narrowing the gap between these well plates helps reduce droplet deflection under vacuum pressure. Spacers are optional. Types and load names are shown below.

| Spacer | Height | Load Name |
|:----|:----|:----|
| **Short** | 27 mm | `opentrons_vacuum_manifold_spacer_short` |
| **Tall** | 34 mm | `opentrons_vacuum_manifold_spacer_tall` |

Load spacers and internal collection labware directly onto the vacuum base in slot A3 using [`load_adapter()`][opentrons.protocol_api.VacuumModuleContext.load_adapter]

```python
# Load a short spacer on the manifold base
spacer = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_short")

# Load a collection plate on top of the spacer
collection_plate = spacer.load_labware(
    load_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
    label="Collection Wellplate"
)
```

## Moving labware

Vacuum Module collars, spacers, and filter plates are compatible with the Flex Gripper. You can call [`ProtocolContext.move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware] and use the Gripper to move collars and well plates between the dock (slot A4), the vacuum base (slot A3), and other deck locations or modules.

Keep in mind these best practices and limitations when including Gripper movements in your vacuum protocol:

| Activity | Description |
|:----|:----|
| **Deck placement** | Because filter plate wells can extend below the plate's sides or skirt, you cannot place a filter plate directly in an empty deck slot (the API will raise a `LabwareIsNotAllowedInLocationError`). Filter plates must sit on an adapter like a collar (slot A4), the vacuum base (slot A3), or on another well plate or module. |
| **Returning to dock** | Use [`vacuum.move_to_dock(collar, use_gripper=True)`][opentrons.protocol_api.VacuumModuleContext.move_to_dock] to move a collar stack from the vacuum base to the dock. |
| **Stacking** | Including a `collar` in `move_labware()` automatically moves the collar and any filter or well plate placed on top of it. |
| **Targeting locations** | Set `new_location=vacuum` to place collars or spacers on the vacuum base (slot A3), or `collar` to put well plates onto a collar staged on the dock (slot A4). |

!!! note "Movement reminder"
    You cannot move labware on or off the module while the pump is running or while the system is under vacuum. Always pass asynchronous vacuum tasks to [`ProtocolContext.wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] and wait until system pressure reaches 0 mbar before moving labware with the gripper.

## Controlling vacuum operations

The Vacuum Module measures vacuum as gauge pressure in millibars (mbar). The module has an operational range from 0 mbar (atmospheric pressure) to -800 mbar, where lower (more negative) values represent a deeper vacuum.

Vacuum commands prefixed with `start_` (e.g., [`start_set_vacuum_pressure()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure], [`start_set_vacuum_power()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_power], etc.) are non-blocking commands. These methods return a [`Task`][opentrons.protocol_api.Task] object that runs in the background, allowing the Flex to perform liquid handling or other module operations in parallel with the Vacuum Module. See [Concurrent Module Actions](concurrent.md) for more information about operating multiple modules simultaneously.

The following sections describe how to configure minimum and maximum vacuum pressure, closed-loop pressure control, open-loop power regulation, and multi-step vacuum profiles.

### Minimum and maximum pressure limits

Two properties set the operational minimum and maximum gauge pressure limits for the Vacuum Module:

* [`min_gauge_pressure_mbar`][opentrons.protocol_api.VacuumModuleContext.min_gauge_pressure_mbar]: Returns `0` mbar (atmospheric pressure). However, you may never (or rarely) use this command. Instead, to vent or return the system to atmospheric pressure, call [`open_vent()`][opentrons.protocol_api.VacuumModuleContext.open_vent] or set `vent_after=True` rather than specifying `min_gauge_pressure_mbar`.

* [`max_gauge_pressure_mbar`][opentrons.protocol_api.VacuumModuleContext.max_gauge_pressure_mbar]: Returns `-800` mbar, the maximum vacuum supported by the module. You can pass `max_gauge_pressure_mbar` in code to run the module at full vacuum capacity.

```python
vacuum_task = vacuum.start_set_vacuum_pressure(
    gauge_pressure_mbar=vacuum.max_gauge_pressure_mbar,
    duration_s=30,
    vent_after=True,
    equalize_timeout_s=5
)
```

### Pressure control

You can set the Vacuum Module to reach and maintain a specific vacuum pressure (from `0` to `-800` mbar) by calling [`start_set_vacuum_pressure()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure]. When using this method, the module actively monitors its pressure sensor to maintain the target vacuum.

Also, this method returns a [Task][opentrons.protocol_api.Task] object representing concurrent execution. Pass the task to [`ProtocolContext.wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] to make the protocol wait for the system to return to atmospheric pressure before continuing.

```python
# Set system pressure to -300 mbar for 30 seconds and then equalize to atmospheric
vacuum_task = vacuum.start_set_vacuum_pressure(
    gauge_pressure_mbar=-300,
    duration_s=30,
    vent_after=True,
    equalize_timeout_s=5
)

# Runs other pipetting or protocols actions while pump runs...

# Wait for pressure equalization
protocol.wait_for_tasks([vacuum_task])
```

### Power control

You can set the Vacuum Module to run the pump motor at a specific power level (from `1` to `100`%) by calling [`start_set_vacuum_power()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_power]. When using this method, the module does not use sensor data. Instead, the pump runs at the set duty cycle level.

Also, this method returns a [Task][opentrons.protocol_api.Task] (`Task`?) object representing concurrent execution. Pass the task to [`ProtocolContext.wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] to make the protocol wait for the system to return to atmospheric pressure before continuing.

```python
# Run pump at 60% power for 20 seconds
power_task = vacuum.start_set_vacuum_power(
    percent_power=60,
    duration_s=20,
    vent_after=True,
    equalize_timeout_s=5
)

# Runs other pipetting or protocols actions while pump operates ...

# Wait for power duration and pressure equalization to complete.
protocol.wait_for_tasks([power_task])
```

### Multi-step vacuum profiles

Use [`start_execute_profile()`][opentrons.protocol_api.VacuumModuleContext.start_execute_profile] to run a multi-step sequence of pressure or power stages without pausing the protocol run.

!!! note
    Multi-step profiles cannot combine `gauge_pressure_mbar` and `percent_power` arguments in the same profile. Specify pressure _or_ power for steps in a particular profile.

=== "Pressure profile"

    In a multi-step pressure profile, each step requires `enable_pump: True` and a target `gauge_pressure_mbar` (from `0` to `-800` mbar). You can also specify an optional `hold_time_seconds` or `hold_time_minutes` for each stage. Use pressure steps when you need to reach and hold a specific vacuum across multiple stages, instead of open-loop pressure regulation.

    ```python
    # Define the stages, pressure, and duration
    profile_steps = [
        {
            "enable_pump": True,
            "gauge_pressure_mbar": -200,
            "hold_time_seconds": 15
        },
        {
            "enable_pump": True,
            "gauge_pressure_mbar": -500,
            "hold_time_seconds": 30
        }
    ]

    # Run the profile
    profile_task = vacuum.start_execute_profile(
        steps=profile_steps,
        repetitions=1,
        vent_after=True,
        equalize_timeout_s=10
    )
    protocol.wait_for_tasks([profile_task])
    ```

=== "Power profile"

    In a multi-step power profile, each step requires `enable_pump: True` and a target `percent_power` (from `1` to `100` % duty cycle). Use power steps when you want fixed pump duty cycles across multiple stages instead of closed-loop pressure regulation.

    ```python
    # Define the stages, power %, and duration
    profile_steps = [
        {
            "enable_pump": True,
            "percent_power": 40,
            "hold_time_seconds": 20
        },
        {
            "enable_pump": True,
            "percent_power": 80,
            "hold_time_seconds": 30
        }
    ]

    # Run the profile
    profile_task = vacuum.start_execute_profile(
        steps=profile_steps,
        repetitions=1,
        vent_after=True,
        equalize_timeout_s=10
    )
    protocol.wait_for_tasks([profile_task])
    ```

## Utility controls

### Deactivating and depressurizing

You can stop the pump and depressurize the system separately by using the [`stop_vacuum_pump()`][opentrons.protocol_api.VacuumModuleContext.stop_vacuum_pump] and [`open_vent()`][opentrons.protocol_api.VacuumModuleContext.open_vent] methods, respectively. While commands like `start_set_vacuum_pressure()` automatically manage pump and vent operations, these two standalone utility methods give you direct control over the pump motor and vent valve.

### Closing the vent

You can close the vent by using [`close_vent()`][opentrons.protocol_api.VacuumModuleContext.close_vent]. This is a standalone utility method used for testing, diagnostics, or sealing the system without running the pump.

<font color="red"><strong>maybe remove this section below?</strong></font>

## Use cases

### Direct-to-waste

This example demonstrates one way to move a filter plate onto the module for waste extraction. When finished, the robot returns the filter plate to its original deck location.

```python
# Stage a collar on the dock (slot A4) and load a filter plate in slot D1
collar = vacuum.load_adapter_to_dock("opentrons_vacuum_manifold_collar_short")
filter_plate = protocol.load_labware(
    load_name="millipore_96_wellplate_300ul_filter",
    location="D1",
    label="Sample Filter Plate",
)

# Move the filter plate from slot D1 onto the collar
protocol.move_labware(
    labware=filter_plate,
    new_location=collar,
    use_gripper=True,
)

# Move the collar and filter plate stack onto the vacuum base in slot A3
protocol.move_labware(
    labware=collar,
    new_location=vacuum,
    use_gripper=True,
)

# Pull vacuum, extract waste and return system to atmospheric pressure
filter_task = vacuum.start_set_vacuum_pressure(
    gauge_pressure_mbar=-300,
    duration_s=20,
    vent_after=True,
    equalize_timeout_s=5,
)

# Continue other pipetting or module actions simultaneously

protocol.wait_for_tasks([filter_task])

# Move the stack to the dock
vacuum.move_to_dock(collar, use_gripper=True)

# Return the filter plate to deck slot D1
protocol.move_labware(
    labware=filter_plate,
    new_location="D1",
    use_gripper=True,
)
```
