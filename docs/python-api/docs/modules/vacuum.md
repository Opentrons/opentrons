---
Title: "Python API: Vacuum Module"
description: How to use the Vacuum Module in a Python protocol.
---

The Vacuum Module is an automated filtration system for the Opentrons Flex liquid handling robot. This module enables Flex to run vacuum-based protocols for protein and peptide sample cleanup, solid-phase extraction, and nucleic acid extraction, all within in an enclosed system that includes waste collection.

The system pairs a on-deck modular manifold stack with an off-deck vacuum pump control box and a 2-liter carboy for waste collection. The included on-deck pieces—a set of short and tall collars and height spacers, along with ANSI/SLAS compliant filter plates—are compatible with the Flex Gripper.

The module is represented in code by a [`VacuumModuleContext`][opentrons.protocol_api.VacuumModuleContext] object that includes methods for asynchronous vacuum pressure control (in mbar), pump duty-cycle regulation (power control), deck plate staging, and system venting.

## Deck slots and loading

The Vacuum Module uses a physical deck adapter to hold labware and other pieces used in a vacuum filter protocol. See the <font color="red">PLACEHOLDER instruction manual?</font> for assembly instructions. This adapter fits in deck slots A3–A4 on the Flex.

* **Slot A3:** You load the module in slot A3. On the deck adapter, this is the recessed half that holds the vacuum base and 6 mm hose that pulls waste to the carboy.
* **Slot A4:** You load collars on slot A4. Known as "the dock," this is the raised half of the adapter. It's a pedestal or platform you can use to hold the tall or short collars and stacked spacers and well plates when they're not seated on the vacuum base.

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

## Staging collars and adding labware

The module supports two primary configurations with the following stacking order (from bottom to top).
<!-- note to readers, trying to avoid using images here -->
- **Direct to waste:** vacuum base → collar → filter plate
- **Filtrate collection:** vacuum base → spacer → collection plate → collar → filter plate

### Staging collars

You can load a short collar (`opentrons_vacuum_manifold_collar_short`) or tall collar (`opentrons_vacuum_manifold_collar_tall`) on the adapter dock (A4) using [`load_adapter_to_doc()`][opentrons.protocol_api.VacuumModuleContext.load_adapter_to_dock]. For example:

```python
collar = vacuum.load_adapter_to_doc("opentrons_vacuum_manifold_collar_short")
```

### Assembling collection stacks with spacers

During filtrate collection, you can place an internal spacer on the vacuum base to raise the collection plate closer to the filter plate. Reducing the gap between the source (filter plate) and destination (well plate) helps reduce droplet deflection and cross-well contamination. Spacer types and load names are provided below:

* **Short spacer (27 mm):** `opentrons_vacuum_manifold_spacer_short`
* **Tall spacer (34 mm):** `opentrons_vacuum_manifold_spacer_tall`

Load spacers and sample collection plates onto the module as shown here:

```python
# Loads a spacer onto the vacuum base
spacer = vacuum.load_adapter("opentrons_vacuum_manifold_spacer_short")

# Loads a collection well plate on the spacer
collection_plate = spacer.load_labware(
    name="corning_96_wellplate_360ul_flat",
    label="Collection Wellplate"
)

# Loads a sample filter plate on the staged collar
filter_plate = collar.load_labware(
    name="millipore_96_wellplate_500ul_ultracel_filter",
    label="Sample Filter Plate"
)
```

### Moving collars and plates

The collars and spacers are compatible with the Gripper. You can use the gripper to stack well plates on the collars and spacers and move the stack to the dock or onto the vacuum base to put samples under vacuum.

```python
protocol.move_labware(collar, new_location=vacuum, use_gripper=True)
```

After depressurizing the system, you can use the Gripper to return a stack to the dock using [`move_to_dock()`][opentrons.protocol_api.VacuumModuleContext.move_to_dock]:

```python
vacuum.move_to_doc(collar, use_gripper=True)
```

!!! note
    You cannot move labware on or off the vacuum module while the pump is running or the system is under vacuum pressure. Return the system to return to atmospheric pressure (0 mbar) before moving labware with the Gripper or by hand.

## Placeholder for stack and gripper

Something something soon?

## Controlling vacuum operations

The module measures vacuum as gauge pressure in millibars (mbar). The vacuum range is from 0 mbar (atmospheric) to -800 mbar. Lower, or more negative, values represent a deeper vacuum. Two properties let you set the minimum and maximum vacuum in a protocol.

* **0 mbar:** [`min_gauge_pressure_mbar`][opentrons.protocol_api.VacuumModuleContext.min_gauge_pressure_mbar]

* **-800 mbar:** [`max_gauge_pressure_mbar`][opentrons.protocol_api.VacuumModuleContext.max_gauge_pressure_mbar]

You may note that some vacuum commands are prefixed with `start_` (e.g., [`start_set_vacuum_pressure()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure] and [`start_set_vacuum_power()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_power]). These are _non-blocking_ or _asynchronous commands_. They return a [`Task`][opentrons.protocol_api.Task] object and execute in the background, allowing the Flex to perform liquid handling or other deck operations concurrently. See also [Concurrent Module Actions](concurrent.md).

### Closed-loop pressure control

In a closed loop, the module receives data from a sensor to actively monitor vacuum state and adjust the pump's speed to reach and maintain the specified vacuum pressure.

Use [`start_set_vacuum_pressure()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure] to run the pump to reach a target pressure. This method returns a [task][opentrons.protocol_api.Task] (`Task`?) object representing concurrent execution. Pass the task to [`ProtocolContext.wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] to make the protocol wait for the system to return to atmospheric pressure before continuing.

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

In this example:

- Setting `vent_after=True` opens the vent after 30 seconds (`duration_s=30`).
- Setting `equalize_timeout_s` sets the maximum time allowed to 5 seconds (`equalize_timeout_s=5`) for the system to return to atmospheric pressure.

What does protocol.wait_for_tasks then do? Continue with other steps in the protocol?
Why is the "closed loop"?

### Open-loop power control

In an open-loop, the module sends a fixed instruction to the pump motor (e.g., run at 60%) but does not check sensor readings to control its power. The data feedback here is "open" because the sensor doesn't control the pump.

To run the pump using % power, rather than to a target pressure, use [`start_set_vacuum_power()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_power].

```python
# Run pump at 60% power for 20 seconds
power_task = vacuum.start_set_vacuum_power(
    percent_power=60,
    duration_s=20,
    vent_after=True,
    equalize_timeout_s=5,
)
# Wait for power duration and pressure equalization to complete.
protocol.wait_for_tasks([power_task])
```

In this example:

- The pump runs at a duty cycle of 60% of its rated power (`percent_power=60`) for a duration of 20 seconds (`duration_s=20`).
- Setting `equalize_timeout_s` sets the maximum time allowed to 5 seconds (`equalize_timeout_s=5`) for the system to return to atmospheric pressure.

### Multi-step vacuum profiles

Use [start_execute_profile()][opentrons.protocol_api.VacuumModuleContext.start_execute_profile] to run a multi-step sequence of pressure or power stages without pausing the protocol run.

<font color="red">Maybe use inline tabs here to show multi-step with pressure and power?</font>

### Multi-step vacuum profiles

Use [`start_execute_profile()`][opentrons.protocol_api.VacuumModuleContext.start_execute_profile] to run a multi-step sequence of pressure or power stages without pausing the protocol run.

!!! note
    Multi-step profiles cannot combine `gauge_pressure_mbar` and `percent_power` within the same profile. Specify one or the other for all steps in your profile list.

=== "Pressure"

    Each step dictionary requires `enable_pump: True` and a target `gauge_pressure_mbar` (from `0` to `-800` mbar). You can also specify an optional `hold_time_seconds` or `hold_time_minutes` for each stage.

    ```python
    # Define multi-stage pressure steps
    profile_steps = [
        {
            "enable_pump": True,
            "gauge_pressure_mbar": -200,
            "hold_time_seconds": 15,
        },
        {
            "enable_pump": True,
            "gauge_pressure_mbar": -500,
            "hold_time_seconds": 30,
        },
    ]

    # Start profile execution
    profile_task = vacuum.start_execute_profile(
        steps=profile_steps,
        repetitions=1,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([profile_task])
    ```

=== "Power"

    Each step dictionary requires `enable_pump: True` and a target `percent_power` (from `1` to `100`% duty cycle). Use power steps when you want fixed pump duty cycles across multiple stages instead of closed-loop pressure regulation.

    ```python
    # Define multi-stage power steps
    profile_steps = [
        {
            "enable_pump": True,
            "percent_power": 40,
            "hold_time_seconds": 20,
        },
        {
            "enable_pump": True,
            "percent_power": 80,
            "hold_time_seconds": 30,
        },
    ]

    # Start profile execution
    profile_task = vacuum.start_execute_profile(
        steps=profile_steps,
        repetitions=1,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([profile_task])
    ```

### Manual pump and vent control

You can also control the pump motor and vent using these standalone, utility commands:

- **Stop pump:** Use [`stop_vacuum_pump()`][opentrons.protocol_api.VacuumModuleContext.stop_vacuum_pump] to stop the pump motor immediately.
- **Open vent:** Use [open_vent()][opentrons.protocol_api.VacuumModuleContext.open_vent] to open the vent and return the system to atmospheric pressure.
- **Close vent:** Use [close_vent()][opentrons.protocol_api.VacuumModuleContext.close_vent] to close the vent so the system can hold vacuum.

## Filter plate load names

The Vacuum Module is compatible with the filter plates listed below and in the [Opentrons Labware Library](https://labware.opentrons.com/). Organized by manufacturer, refer to these tables to find the API `load_name` for a supported filter plate.

<font color="red">Mention using an unsupported filter plate as custom labware?</font>

### Empore

| Display Name | API Load Name |
| --- | --- |
| Empore C18-SD 96<br>Well Plate 1200 µL | `empore_96_wellplate_1200ul_c18_filter` |

### Luna Nanotech

| Display Name | API Load Name |
| --- | --- |
| Luna Nanotech PuroSPIN<br>96 Well Plate 1000 µL | `lunanano_96_wellplate_1000ul_filter` |

### Millipore

| Display Name | API Load Name |
| --- | --- |
| Millipore<br>384 Well Plate 100 µL | `millipore_384_wellplate_100ul_filter` |
| Millipore<br>96 Well Plate 300 µL | `millipore_96_wellplate_300ul_filter` |
| Millipore<br>96 Well Plate 300 µL HTS | `millipore_96_wellplate_300ul_hts_filter` |
| Millipore<br>96 Well Plate 300 µL PCR | `millipore_96_wellplate_300ul_pcr_filter` |
| Millipore<br>96 Well Plate 500 µL HTS Ultracel | `millipore_96_wellplate_500ul_ultracel_filter` |
| Millipore<br>96 Well Plate 500 µL Solvinert | `millipore_96_wellplate_500ul_solvinet_filter` |

### Cytiva (formerly Pall)

Product images on the manufacturer's website and your existing lab stock may display "Pall" and "Pall Corporation" on the box.

| Display Name | API Load Name |
| --- | --- |
| Pall AcroPrep Advance<br>96 Well Plate 1000 µL Long Tip | `cytiva_96_wellplate_1000ul_longtip_filter` |
| Pall AcroPrep Advance<br>96 Well Plate 350 µL | `cytiva_96_wellplate_350ul_filter` |

### Thermo Scientific

| Display Name | API Load Name |
| --- | --- |
| Thermo Scientific Nunc<br>96 Well Plate 1000 µL Filter | `thermoscientificnunc_96_wellplate_1000ul_filter` |