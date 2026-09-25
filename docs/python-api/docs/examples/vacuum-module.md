---
title: "Python API: Vacuum Module Examples"
description: An analysis of the Opentrons Python API code used by the Vacuum Module in a miniprep protocol.
---

This use case is taken from a plasmid miniprep protocol. These excerpted code samples demonstrate how the Python API works with the Vacuum Module and other Flex instruments, modules, and labware.

!!! note
    The Vacuum Module is supported on Opentrons Flex only and requires Python API version 2.30 or higher.

## Workflow overview

A plasmid miniprep is a technique used to isolate DNA. A typical protocol involves multiple steps and many lines of code. This use case focuses exclusively on the procedures that interact with API methods used by the Vacuum Module such as:

* **Filtrate collection:** The procedure begins with stacking a short-tip filter plate over an internal 96-well collection plate on the base of the manifold. The vacuum then draws clarified lysate into a collection plate.

* **Sample binding and waste disposal:** The Gripper reconfigures the stack so the module pulls waste through the manifold into an external carboy. The module then applies different vacuum pressures to collect and dispose of material.

The code analysis starts below.


## Stage 1: Loading modules and labware

During this stage, the `run()` function initializes hardware, defines the deck layout, and loads the starting labware. Before executing any steps in the miniprep protocol, this code to tells the robot what's going to be used and where it can be found.

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
      <td><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.load_adapter_to_dock"><code>load_adapter_to_dock()</code></a> stages the tall collar on the dock. The dock is the raised part of the Vacuum Module adapter that occupies slot A4.</td>
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
      <td><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.load_instrument"><code>load_instrument()</code></a> loads a Flex 96-channel pipette and tip rack.</td>
    </tr>
  </tbody>
</table>

```python
def run(protocol: protocol_api.ProtocolContext):
    # Load modules and external waste chute
    vacuum = protocol.load_module("vacuumModuleV1", "A3")
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
## Stage 2: Concurrent actions
<!--- figure out something after new spacer info is available --->
<font color="red">Needs some intro here. During this stage, the robot does all the things.</font>

### Liquid collection

During this stage, a gentle vacuum pulls clarified lysate into a 96-well collection plate. To prepare for this process, the Flex Gripper stacks a collection and filter plate on top of each other and places both on the manifold base. A collar placed over the well plates completes the stack and creates vacuum seal.

<table>
  <thead>
    <tr>
      <th style="text-align: left;">Action</th>
      <th style="text-align: left;">API method and role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Stack assembly</strong></td>
      <td><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.move_labware"><code>move_labware()</code></a>:
        <ul>
          <li> uses the Flex Gripper to place the short-tip filter plate over the collection plate inside the manifold base.</li>
          <li>seats the tall collar over the base to seal the labware stack.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Asynchronous vacuum</strong></td>
      <td><a href="../../reference/vacuum/#opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure"><code>start_set_vacuum_pressure()</code></a> pulls a <code>-330</code> mbar vacuum to clear lysate without fouling the filter and returns a <a href="../../reference/types/#opentrons.protocol_api.Task"><code>Task</code></a> object.</td>
    </tr>
  </tbody>
</table>

```python
    # Stack the filter plate over the collection plate on the manifold base and add a collar
    protocol.move_labware(filter_plate, collection_plate, use_gripper=True)
    protocol.move_labware(collar, vacuum, use_gripper=True)

    # Pull vacuum at -330 mbar to extract clarified liquid
    clarify_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-330,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=20,
    )
```

### Liquid handling

Because `start_set_vacuum_pressure()` is a non-blocking command, the robot can carry out other operations while the Vacuum Module operates. Calling `protocol.wait_for_tasks([clarify_task])` switches the robot back to serial operation preventing other commands from executing until the system depressurizes so the Gripper can move labware off the module.

```python
# Pipette liquids while the Vacuum Module runs
    pipette.pick_up_tip()
    pipette.aspirate(400, reservoir["A5"])
    pipette.drop_tip()

    # Wait for operations to finish and pressure to equalize before using the Gripper
    protocol.wait_for_tasks([clarify_task])

    # Return the collar to the dock and discard the used clarification filter
    vacuum.move_to_dock(collar, use_gripper=True)
    protocol.move_labware(filter_plate, waste_chute, use_gripper=True)
```

## Stage 3: Direct-to-waste wash and dry

In this stage, additional Gripper movements reconfigure the stack to prepare the sample for washing and plate drying.

<table>
  <thead>
    <tr>
      <th style="text-align: left;">Action</th>
      <th style="text-align: left;">API method and role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Stack reconfiguration</strong></td>
      <td>
        <ul>
          <li><code>move_labware()</code></a> moves the lysate collection plate off the module to slot D2, preparing the vacuum base for direct-to-waste evacuation.</li>
          <li><code>move_labware()</code> seats the tall collar directly onto the vacuum base and places the long-tip silica plate on the collar.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Sample binding</strong></td>
      <td>
        <ul>
          <li><code>start_set_vacuum_pressure()</code></a> applies <code>-500</code> mbar vacuum to draw sample liquid through the silica membrane directly to the waste carboy.</li>
          <li><a href="../../reference/protocols/#opentrons.protocol_api.ProtocolContext.wait_for_tasks"><code>wait_for_tasks()</code></a> halts operations until the binding cycle finishes and pressure equalizes (<code>equalize_timeout_s=10</code>).</li>
        </ul>
      </td>
    </tr>
<tr>
      <td><strong>Membrane drying</strong></td>
      <td>
        <ul>
          <li><code>start_set_vacuum_pressure()</code> pulls a deep vacuum (<code>-800</code> mbar) for 60 seconds to purge residual wash ethanol, configuring the module to vent and equalize for up to 30 seconds (<code>vent_after=True</code>, <code>equalize_timeout_s=30</code>).</li>
          <li><code>wait_for_tasks()</code> forces the robot to pause until the drying cycle and pressure equalization finish before subsequent gripper operations.</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

```python
    protocol.move_labware(collection_plate, "D2", use_gripper=True)

    # Seat the collar on the vauum base and set the silica plate on top of it
    protocol.move_labware(collar, vacuum, use_gripper=True)
    protocol.move_labware(silica_plate, collar, use_gripper=True)

    # Binding: extract waste liquid to the carboy
    bind_task = vacuum.start_set_vacuum_pressure(
        gauge_pressure_mbar=-500,
        duration_s=60,
        vent_after=True,
        equalize_timeout_s=10,
    )
    protocol.wait_for_tasks([bind_task])

    # Drying: run a deep vacuum to extract residual ethanol
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

### Non-blocking operations and concurrency

Operational commands like `start_set_vacuum_pressure()` run asynchronously and return a `Task` object. Because these commands do not pause the protocol, the robot can perform independent liquid handling actions (e.g., aspirating and dispensing buffers) or control other deck modules and pipetting while the Vacuum Module operates on its own.

### Pressure profiles

Pressure sensors in the Control Box allows the module to apply multiple vacuum pressures based on liquid volumes and membrane porosities at different protocol stages. As shown in the examples, the protocol starts with a vacuum at -330 mbar, then uses a -500 mbar vacuum to quickly clear washes, and ends by running the module at -800 mbar to dry the silica membrane for elution.

### Depressurization and Gripper safety

Attempting to move labware while the manifold remains under vacuum raises an API error. Setting `vent_after=True` with an `equalize_timeout_s` delay lets the module return to atmospheric pressure (`0` mbar) at the end of a cycle. Synchronizing background tasks with `wait_for_tasks()` guarantees the system is fully depressurized before the Flex Gripper attempts to unstack collars or labware.
