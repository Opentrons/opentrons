---
title: "Python API: Vacuum Module Examples"
description: Code samples that demonstrate using the Opentrons Python API to run protocols and control hardware.
---

This use case examines an automated miniprep protocol for the Flex liquid handling robot and the Vacuum Module. It is excerpted from a real, multi-stage python protocol. While the underlying protocol performs a nucleic acid miniprep, our focus here is on how the API code and how it's used with the Vacuum Module, the Gripper, pipettes, and related labware.

In sample code, you'll see how API commands are used to programmatically reconfigure the manifold stack mid-protocol, apply different vacuum pressures for different filter types, and execute pipetting actions concurrently while the Vacuum Module operates independently, in the background.

TBD placeholder: Something something write your own code, use Protocol Designer, or Opentrons AI. Can export as `.py` (Python) file.

### Stage 1: protocol metadata

Every protocol file starts with the `metadata` and `requirements` dictionaries. 

- `metadata`: This includes key-value pairs for the protocol name (`protocolName`) and aa concise description (`description`), which are displayed in the Opentrons App and on the Flex touchscreen.

- `requirements`: This includes the key-value pairs `robotType` and `apiLevel` which tell the protocol engine what robot is being used and the API version. The Vacuum Module can only be used with the Flex robot and requires API version 2.30, or higher.

```python
from opentrons import protocol_api
from opentrons.protocol_api import VacuumModuleContext

metadata = {
    "protocolName": "Nucleic acid miniprep",
    "description": "A Vacuum Module use case using the Python API."
}

requirements = {"robotType": "Flex", "apiLevel": "2.31"}
```

### Stage 2: Loading modules and labware

During this stage, `run()` function initializes hardware, defines the deck layout, and loads the starting labware. Before executing any steps in the miniprep protocol, the API code establishes what's going to be used and where it can be found.

<!--- replacing with a test table
* **Modules and waste:** Calls [`load_module()`][opentrons.protocol_api.ProtocolContext.load_module] to initialize the Vacuum Module in slot A3 and an adjacent Heater-Shaker in slot D1. Because the vacuum manifold adapter requires the location used by the trash bin, calling [`load_waste_chute()`][opentrons.protocol_api.ProtocolContext.load_waste_chute] configures the external waste chute for hands-free, external waste disposal.
* **Manifold collars:** Calls [`load_adapter_to_dock()`][opentrons.protocol_api.VacuumModuleContext.load_adapter_to_dock] to stage the tall collar on the dock in slot A4, keeping the manifold base open for internal stack assembly.
* **Manifold stacks:** Calls [`load_adapter()`][opentrons.protocol_api.VacuumModuleContext.load_adapter] and [`load_labware()`][opentrons.protocol_api.VacuumModuleContext.load_labware] to place an internal short spacer and a 96-well collection plate directly into the manifold base to catch clarified filtrate.
* **Labware and instruments:** Calls [`load_instrument()`][opentrons.protocol_api.ProtocolContext.load_instrument] to mount the 96-channel pipette with its 1000 µL tip racks, and uses `load_labware()` across remaining deck slots and adapters to stage reagent reservoirs, clarification plates, and silica binding plates.
--->

<!--- table loos cleaner --->

<table>
  <thead>
    <tr>
      <th>Component</th>
      <th>API method and role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Modules and waste</strong></td>
      <td>
        <ul>
          <li><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.load_module"><code>load_module()</code></a> places the Vacuum Module in slot A3 and the Heater-Shaker in slot D1.</li>
          <li><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.load_waste_chute"><code>load_waste_chute()</code></a> loads the external waste chute because the Vacuum Module adapter displaces the on-deck trash bin from its default location in slot A3.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Manifold collar</strong></td>
      <td><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.load_adapter_to_dock"><code>load_adapter_to_dock()</code></a> stages the tall collar on the doc, the raised part of the Vacuum Module adapter that occupies slot A4.</td>
    </tr>
    <tr>
      <td><strong>Internal manifold stack</strong></td>
      <td>
        <ul>
          <li><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.load_adapter"><code>load_adapter()</code></a> loads the short spacer on the vacuum base.</li>
          <li><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.load_labware"><code>load_labware()</code></a> loads the lysate collection plate on the short spacer.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Plates, reservoirs, tips</strong></td>
      <td><code>load_labware()</code> loads filter plates, reagent reservoirs, and pipette tip racks on their starting deck slots.</td>
    </tr>
    <tr>
      <td><strong>Pipette</strong></td>
      <td><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.load_instrument"><code>load_instrument()</code></a> loads the Flex 96-channel pipette and associates it with a starting tip rack.</td>
    </tr>
  </tbody>
</table>

```python
def run(protocol: protocol_api.ProtocolContext):
    # Load modules and external waste chute
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

    # Stage the filter plates, reservoir, pipette, and tips
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

### Stage 3: Clarify and filter

During this stage, the protocol collects clarified lysate into an internal 96-well collection plate. The script first uses the Flex Gripper to assemble the clarification stack inside the manifold base. Once filtration begins, the non-blocking vacuum command allows the robot to perform liquid handling steps in parallel across other deck slots while extraction proceeds in the background.

<table>
  <thead>
    <tr>
      <th>Action</th>
      <th>API method and role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Stack assembly</strong></td>
      <td>
        <ul>
          <li><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.move_labware"><code>move_labware()</code></a> uses the Flex Gripper to place the short-tip filter plate directly over the collection plate inside the manifold base.</li>
          <li><code>move_labware()</code> seats the tall collar over the base to seal the chamber.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Asynchronous vacuum</strong></td>
      <td><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure"><code>start_set_vacuum_pressure()</code></a> initiates a gentle pull (<code>-330</code> mbar) to clear the lysate without membrane fouling, returning a <a href="../../reference/types/#opentrons.protocol_api.Task"><code>Task</code></a> object.</td>
    </tr>
    <tr>
      <td><strong>Parallel liquid handling</strong></td>
      <td><code>pick_up_tip()</code>, <code>aspirate()</code>, and <code>drop_tip()</code> prepare binding buffers on external deck slots while the vacuum cycle runs.</td>
    </tr>
    <tr>
      <td><strong>Safety synchronization</strong></td>
      <td><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.wait_for_tasks"><code>wait_for_tasks()</code></a> halts execution until the vacuum cycle finishes and pressure equalizes before unstacking labware.</td>
    </tr>
    <tr>
      <td><strong>Teardown and disposal</strong></td>
      <td>
        <ul>
          <li><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.move_to_dock"><code>move_to_dock()</code></a> returns the collar to slot A4 to expose the clarified filtrate.</li>
          <li><code>move_labware()</code> transports the exhausted clarification plate to the waste chute.</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

**Assembling the manifold and initiating vacuum**

The Flex Gripper builds the clarification stack directly inside the manifold base. Calling `start_set_vacuum_pressure()` launches the extraction cycle in the background and returns a `Task` object, leaving the protocol thread free to continue.

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

While the vacuum pump is running, the Flex 96-channel pipette prepares binding buffer in an adjacent plate. Calling wait_for_tasks() acts as a synchronization barrier, ensuring the chamber equalizes to atmospheric pressure (0 mbar) before the gripper removes the collar and discards the filter plate.

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

### Stage 4: waste binding, wash, and dry

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

### Stage 5: recover elution

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
