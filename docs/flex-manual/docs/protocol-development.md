---
title: "Opentrons Flex: Protocol Development"
---

# Protocol Development

The Opentrons Flex system can run a wide variety of automated protocols, for tasks such as PCR, NGS, ELISA, and many more. You can run fully built and verified protocols, edit community protocols to suit your needs, or design protocols from scratch—with or without writing code.

This chapter provides an overview of each of these protocol development methods, as well as giving guidance on how to adapt protocols written for the Opentrons OT-2 to run on Opentrons Flex.

## Pre-made protocols

### Protocol Library

The Opentrons Protocol Library hosts protocols authored either by Opentrons itself or by members of the Opentrons community. To find a protocol that fits your target application, use the search field at the top of the [Protocol Library homepage](https://library.opentrons.com).

You can also browse protocols by categories, like DNA/RNA, cell biology, cell and tissue culture, proteins, commercial assay kits, or molecular biology. There's even a category for protocols that create art by pipetting! Take some time to check out the protocols in our library. Understanding what's available—and making some cool pixel art—is a great way to learn about the features and capabilities of your robot before moving on to using real samples and reagents.

#### Searching for protocols

The Protocol Library search returns results as you type. You can select a result from the search list or click **View All Results** to go to the full results page, which shows more details about each protocol and lets you filter them based on several criteria.

Each protocol card will show:

| **Category**                | **Description**                                                                                                                                         |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Protocol name**        | The name of the protocol.                                                                                                                               |
| **Verification**         | Badges indicate if the protocol is verified by Opentrons, a third-party manufacturer, or members of the community.                                      |
| **Time estimate**        | Approximately how long the protocol takes to run.                                                                                                       |
| **Description**          | A short summary of what the protocol does.                                                                                                              |
| **Robot model**          | Which Opentrons robots the protocol is compatible with.                                                                                                 |
| **Protocol editability** | JSON protocols are editable in Protocol Designer, with no coding required. Python protocols are editable in any text editor, using the Python Protocol API. |
| **Modules**              | Any hardware modules that are required.                                                                                                                 |

In addition to these categories, in the sidebar you can filter results
by:

- **Pipettes:** Which pipettes the protocol uses (you can usually change a protocol's pipettes, but it may affect the run time and the number of tips consumed).

- **Categories:** Target applications, like DNA/RNA, cell biology, proteins, etc.

- **Protocol version:** Show or hide older versions of protocols.

#### Protocol details

Click on a protocol to go to its detail page, which provides even more information. In addition to what is shown in search, here you can see:

- **Supporting data:** Additional data, explanations, or links to outside sources provided by the protocol author.

- **What you'll need:** A complete list of all equipment needed for the protocol, including the robot, modules, labware, pipettes, and third-party kits.

- **Protocol steps:** A list of steps written by the protocol author, as well as a visual deck map and list of liquids specified in the protocol file.

The details page also provides basic instructions for downloading and running the protocol. For more information on importing a protocol to the Opentrons App and setting up a run, see the [Transferring Protocols to Flex section][transferring-protocols-to-flex] in the Software and Operation chapter.

### Custom Protocol Development service

Opentrons provides a [Remote Custom Protocol Development service](https://opentrons.com/instrument-services) for applications not already included in the Protocol Library. Our comprehensive authoring and validation service has a turnaround time of two weeks. As part of the service, Opentrons field applications scientists will:

- Develop the Python protocol.

- Validate the code.

- Install the protocol remotely.

- Create deck and reagent setup instructions.

- Optimize your protocol as much as needed within one week of initial delivery.

By default, Opentrons adds all custom protocols to the Protocol Library so the community can benefit from them. However, if your application requires privacy, you can opt out of inclusion in the Protocol Library.

!!! note
    The Custom Protocol Development service only writes Python protocols that control Opentrons hardware. It does not cover controlling the robot with code in other languages, nor does it cover controlling third-party hardware.

#### Protocol request guidelines

Describing your protocol in detail enables Opentrons field applications scientists to accurately code the automation that you need. Consider your protocol's requirements, including:

- Hardware (pipettes, gripper, modules, fixtures).

- Labware (Opentrons verified, other standard, or custom).

Also consider special cases that apply to your protocol, like:

- Liquids that are volatile, viscous, or otherwise behave differently than water.

- Conservation of expensive reagents.

- Sterility and cross-contamination.

- Advanced pipetting techniques like air-gapping, high or low flow rate, or pipetting at specific locations within wells.

To explain the movements the robot will make in executing the protocol, start with your initial deck state. Where should modules, labware, and trash containers be located? Which liquids will be in which labware, and in what quantities? Use the coordinate systems printed on the Opentrons Flex deck and on standard labware to describe these locations.

Next, give step-by-step instructions on how Opentrons Flex should handle liquids, specifying quantities in microliters (µL) and giving exact source and destination locations (rows, columns, or individual wells of labware).

In general, following the style of the methods section of an academic paper will help the Opentrons team understand your instructions. And always err on the side of providing extra information—it may be exactly the detail we need to write code for your protocol.

#### Custom protocol pricing

Custom Protocol Development is a service available to all owners of Opentrons Flex systems. Opentrons provides remote and onsite protocol development services customized to your specific workflow. Price and development time are based on the complexity of your protocol and the related code. See the [Instrument Services section](https://opentrons.com/instrument-services) of the Opentrons website to contact us for more information about our Custom Protocol Development offerings.

## Protocol Designer

Protocol Designer is a web-based, no-code tool for developing protocols that run on Opentrons robots, including Opentrons Flex. You can use Protocol Designer to create protocols that:

- Aspirate, dispense, transfer, and mix liquids.

- Move labware around the deck with the gripper.

- Operate Opentrons Flex modules.

- Pause to let you verify progress or access samples.

All work on your protocol takes place within your web browser. When
you're done creating or editing your protocol, you need to export it to
a JSON file. Then upload that file to a robot and run it, as you would
with any protocol.

### Protocol Designer requirements

Currently, Protocol Designer is only supported for use in Google Chrome
and requires an internet connection. Uploading and running JSON
protocols on Opentrons Flex requires version 7.0.0 or later of the
Opentrons App.

You can't create or modify Python protocol files with Protocol Designer.

### Designing a protocol

Protocols are all about informing the robot what hardware it will use to
take specific actions. This process is broken down into three tabs in
Protocol Designer:

**Icon Tab**

The **File tab** is where you manage protocol files and specify hardware
for use in your protocol.

The **Liquids tab** lets you define samples, reagents, and any other
liquids that your robot will handle.

The **Design tab** is where you specify the initial state of the deck,
add steps that the robot will perform, and view the projected outcomes
of those steps.

To create a protocol from scratch, you'll start on the File tab, work
with the Liquids and Design tabs, and then return to the File tab to
export your work. The remainder of this section goes through the
protocol creation process in detail.

#### Part 1: Create a protocol

When you launch Protocol Designer, you'll begin on the **File** tab. In
the left sidebar, click **Create New** to open the Create New Protocol
dialog. Click on the image of Opentrons Flex and then click **Next**.

Choosing to create a protocol for Opentrons Flex in Protocol Designer.

Enter a name for your protocol, which is how it will appear in the
Opentrons App and on the touchscreen. You'll also see your protocol name
in the Protocol Designer header while you're working on it. Optionally
add a description and author information for your protocol.

Next, Protocol Designer guides you through choosing the hardware used in
your protocol:

1.  Pipettes and what type of tip racks you'll use with them. Every
    protocol requires at least one pipette.

2.  Staging area slots in column 3 (optional).

3.  Additional hardware used in your protocol, such as modules, the
    gripper, or the waste chute. Only are shown.

!!! note
    You can't currently use multiple Heater-Shaker Modules or Magnetic Blocks in a JSON protocol. If your application requires them, you'll need to use a Python protocol. See the below.

At any time, you can return to the File tab to rename your protocol, add
an author name or description, or change your hardware configuration.

#### Part 2: Define liquids

Move on to the **Liquids** tab to set up samples and reagents. This tab
is only for *defining* types of liquids. You'll indicate the starting
positions and amounts of liquids in Part 3, on the Design tab.

Click **New Liquid** and then enter the name of your liquid and an
optional description. You can also choose whether to *serialize* the
liquid, so each well containing that liquid will be numbered on the deck
map and in action steps. For example, if your protocol has blood
samples, serialization can help you keep them separate in your workflow,
while still labeling them all as "blood" and color-coding them the same.

Each type of liquid appears in a different color on the deck map in
Protocol Designer, in the Opentrons App, and on the touchscreen. You can
use the default color, pick another preset color, or enter an RGB hex
code to set a custom color.

#### Part 3: Lay out the deck

Go to the Design tab to do the final setup step, which is placing
labware and liquids on the deck. The main view on this tab is the deck
map, which shows everything on the deck down to individual wells ---
even on 384-well plates.

The deck map starts with the tip racks and modules you chose for your
protocol in their default locations. Hover over any open slot and click
**Add Labware or Adapter** to add more tip racks, other types of
labware, or adapters. Drag and drop labware to an open slot to move it
there, or to an occupied slot to swap the two pieces of labware.

!!! note
    You can'tmove modules or adapters around the deck map by drag and drop. This is to make it easier to move *labware* onto or off of a module.

- To change a module's position, return to the **File** tab and click
  **Edit** next to the module name.

- To change an adapter's position, add a new adapter. Then move the
  labware from the old adapter to the new adapter. Finally, delete the
  old adapter.

Hover over any labware and click **Add Liquids** to specify which wells
contain which liquid. Clicking on a single well or dragging across a
range of wells will reveal a form at the top of the screen. Choose one
of the liquids you defined and the volume *each* well should start with,
in μL. For example, if you select the first column on a 96-well plate
and specify 100 μL, that will be 800 μL of liquid total (100 μL × 8
wells).

#### Part 4: Add steps

At last, it's time to tell your robot how to move liquid around the
deck. Click **Add Step** and choose the type of step.

- Pipetting steps

  - **Transfer:** Move liquid from one well or group of wells to
    another. Specify the source, where liquid will be aspirated from, on
    the left. Specify the destination, where liquid will be dispensed,
    on the right. Click either gear icon to change behaviors such as
    flow rate, tip height, knocking droplets off (touch tip), air
    gapping, blowout, and more. In the Sterility & Motion section,
    choose the correct tip-use strategy for your application.

  - **Mix:** Repeatedly aspirate and dispense liquid within the same
    well. Choose how much liquid to mix with, the number of mixing
    repetitions, and which wells will be mixed. Like with transfer
    steps, click either gear to change mixing behavior. You can also
    choose a tip-use strategy for mixing. These options are more limited
    than for transfers, since all liquid returns to its starting
    location when mixing.

- Gripper steps

  - **Move Labware:** Control the Flex Gripper or move labware around
    the deck manually. Choose which labware you want to move and its new
    location. Check the **Use Gripper** box to have the gripper move the
    labware automatically, or leave it unchecked to have the protocol
    pause so you can move the labware manually. You need to use the
    gripper to dispose labware by moving it into the waste chute. You
    need to move labware manually to move it off the deck (without
    disposing it).

- Module steps

  - **Heater-Shaker:** Control the temperature, shake speed, and labware
    latch of the Heater-Shaker Module. You can set an optional timer
    that will pause the protocol for a set period of time *after* the
    other actions are completed (heating to high temperatures or waiting
    for the module to passively cool to a temperature can take a long
    time).

  - **Temperature:** Set a target temperature or deactivate the
    Temperature Module.

  - **Thermocycler:** This action has two mutually exclusive sets of
    options.

    - Change Thermocycler state: Set a block temperature, set a lid
      temperature, or move the lid.

    - Program a Thermocycler profile: Define a *profile*, a timed
      heating and cooling routine that can be automatically repeated.
      Each step of the profile holds the block at a certain temperature
      for a certain time. Profiles do not change the temperature of the
      lid.

- **Pause:** Prevent the protocol from continuing until one of three
  criteria is met. Pauses can require user intervention (pressing a
  button on the touchscreen or in the app), wait for a fixed time, or
  wait until a module reaches a target temperature. Timed pauses are
  useful for incubation or letting the Magnetic Block work.

#### Part 5: Edit steps

Once you've created a step, preview its effects by hovering over it in
the Protocol Timeline. Affected tips and wells will be highlighted, as
will the entire labware containing those wells.

Show or hide the details of a step by clicking the disclosure triangle
to the right of its name. For liquid handling steps, this will show
every discrete aspirate and dispense pair comprising the step. For
module steps, this will show the features of the module that the step
controls.

Click on the name of a step in the Protocol Timeline to edit it.
Shift-click to select a range of steps and enter batch editing mode. If
you select only transfer or mix steps, you can change their behavior as
a batch. Reorder steps by dragging and dropping them up or down in the
Protocol Timeline.

When editing any step, click **Notes** to change the step name or add a
description of what the step does. Custom step names replace their
default action descriptions (like "Transfer" and "Temperature") in the
Protocol Timeline, making it easier to navigate around your protocol.

#### Part 6: Export your protocol

When your protocol is complete, click **Final Deck State** to preview
how the deck should appear at the end of your protocol. In this view (or
when viewing a particular step), you can click on labware and examine
the expected quantity of liquid in each well.

To save your work, return to the File tab and click **Export** to
download your protocol as a JSON file. The file will have the name you
chose in the Protocol Name field and will have a .json extension. You
can find exported protocols in the default download location of your web
browser.

To run your protocol, import it into the Opentrons App. (See the for
details on installing and using the Opentrons App.) Then either run it
from the app or send it to your Flex to run from the touchscreen.

### Modifying existing protocols

Click **Import** in the File tab to load an existing protocol. Choose
any JSON protocol file from the standard system file picker. Once
loaded, you can edit any aspect of the protocol, including its name,
description, hardware configuration, and steps.

!!! warning
    Importing a protocol will replace any other protocol that you've been working on in Protocol Designer. Be sure to export your work before importing another file, or open Protocol Designer in a second browser tab to work on multiple files at once.

## Python Protocol API

Writing protocol scripts in Python gives you the most fine-grained
control of Opentrons Flex. Version 2 of the Python Protocol API is a
single Python package that exposes a wide range of liquid handling
features on Opentrons robots. For an idea of the breadth of the API,
check out the [full online documentation](https://docs.opentrons.com/v2/), which includes topic-based articles as well as a [comprehensive reference](https://docs.opentrons.com/v2/new_protocol_api.html) of all
methods and functions contained in the package. If you've never written
an Opentrons protocol before and want to build one from scratch, follow
the [Tutorial](https://docs.opentrons.com/v2/tutorial.html).

### Writing and running scripts

Python protocols generally follow the same basic structure:

1.  Importing the `opentrons` package.

2.  Declaring the `requirements` and `metadata` in their respective dictionaries.

3.  Defining a `run()` function that contains all of the instructions to the robot, including:

    - [Pipettes](https://docs.opentrons.com/v2/new_pipette.html) the protocol will use.

    - Locations of [modules](https://docs.opentrons.com/v2/new_modules.html), [labware](https://docs.opentrons.com/v2/new_labware.html), and [deck fixtures](https://docs.opentrons.com/v2/deck_slots.html#deck-configuration).

    - [Liquid](https://docs.opentrons.com/v2/new_labware.html#labeling-liquids-in-wells) types and locations (optional).

    - Commands the system will physically execute (e.g., [simple](https://docs.opentrons.com/v2/new_atomic_commands.html) or [complex](https://docs.opentrons.com/v2/new_complex_commands.html) liquid
      handling commands, [module](https://docs.opentrons.com/v2/new_modules.html) commands, or [movement](https://docs.opentrons.com/v2/robot_position.html) commands).

```python
from opentrons import protocol_api
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

def run(protocol):

    # labware
    plate = protocol.load_labware(
        "corning_96_wellplate_360ul_flat", location="D1"
    )
    tip_rack = protocol.load_labware(
        "opentrons_flex_96_tiprack_200ul", location="D2"
    )

    # pipettes
    left_pipette = protocol.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tip_rack]
    )

    # commands
    left_pipette.pick_up_tip()
    left_pipette.aspirate(100, plate["A1"])
    left_pipette.dispense(100, plate["B2"])
    left_pipette.drop_tip()

```

If you're running a protocol via the Opentrons App or the touchscreen, you don't need to call the `run()` function, because the robot software does it for you.

However, one of the advanced features of the Python API is to control a robot outside of the usual flow for setting up and running a protocol. Opentrons Flex runs a Jupyter Notebook server, which can execute discrete blocks of code (called *cells*), rather than a complete protocol file. When organizing your code into cells, you can define a `run()` function (and then call it) or run commands without one. It's also possible to execute complete protocols in a Jupyter terminal session or when connected to Flex via SSH. For more information, see the [Advanced Operation section][advanced-operation] of the Software and Operation chapter.

### Python-exclusive features

Certain features are only available in Python protocols, either because they are part of the API or because of the inherent flexibility of Python code.

#### Partial tip pickup

The Python API supports the most partial tip pickup configurations. Currently, JSON protocols only support column pickup with the 96-channel pipette. The `InstrumentContext.configure_nozzle_layout()` method supports these additional layouts:

- Row pickup with the 96-channel pipette.

- Partial column pickup with 8-channel pipettes.

- Single tip pickup with all multi-channel pipettes.

Certain configurations allow changing which nozzles are used. For example, you can pick up a column of tips with either the left or right edge of the 96-channel pipette.

#### Runtime parameters

Starting in API version 2.18, you can define user-customizable variables in your Python protocols. This gives you greater flexibility and puts extra control in the hands of the technician running the protocol --- without forcing them to switch between lots of protocol files or write code themselves.

Runtime parameters can customize Boolean, numerical, and string values in your protocol. And starting in API version 2.20, you can require a CSV file of data to be parsed and used in the protocol. See the [API documentation on runtime parameters](https://docs.opentrons.com/v2/runtime_parameters.html) for information on writing them into protocols, and see the Runtime Parameters section of the Software and Operation chapter for information on changing parameter values during run setup.

#### Non-blocking commands

Some module commands that take a long time to complete (such as heating from ambient temperature to a high temperature) can be run in a *non-blocking* manner. This lets your protocol save time by continuing on to other pipetting tasks instead of waiting for the command to complete. Non-blocking commands are currently supported on the [Heater-Shaker Module](https://docs.opentrons.com/v2/modules/heater_shaker.html#non-blocking-commands).

#### Multiple modules of the same type

The Python API only restricts module placement based on physical limitations. Protocol Designer can only place one of each type of module on the deck, except the Temperature Module. [`ProtocolContext.load_module()`](https://docs.opentrons.com/v2/new_protocol_api.html#opentrons.protocol_api.ProtocolContext.load_module) allows placing any powered module in any column 1 or 3 slot (except the Thermocycler Module, which only fits in slots A1 and B1). And it allows placing Magnetic Blocks in any working area slot.

#### Python packages

Not only does the Python API support some features not included in Protocol Designer, but every Python protocol *is a Python script*, which means that it can perform any computation that relies on the Python standard libraries or the suite of libraries included in the Flex system software.

You can even install additional Python packages on Flex. [Connect to your Flex via SSH][command-line-operation-over-ssh] and install the package with `pip`. To avoid analysis errors in the Opentrons App, install the packages on your computer as well. In the Opentrons App settings, go to **Advanced** and click **Add override path** in the Override Path to Python section. Choose the copy of `python` on your system that has access to the packages.

## OT-2 protocols

There are hundreds of OT-2 protocols in the Protocol Library, and you may have created your own OT-2 protocols for your lab. Opentrons Flex can perform all the basic actions that the OT-2 can, but OT-2 protocols aren't directly compatible with Flex. However, with a little effort, you can adapt an OT-2 protocol so it will run on Flex. This lets you have parity across different Opentrons robots in your lab, or you can extend older protocols to take advantage of new features only offered on Flex.

### OT-2 Python protocols

Using the Python Protocol API, you only have to change a few aspects of an OT-2 protocol for it to run on Flex.

#### Metadata and requirements

The API requires you to declare that a protocol is designed to run on Flex. Use the `robotType` key in the new `requirements` dictionary. You should also specify an `apiLevel` of 2.15 or higher. You can specify `apiLevel` either in the `metadata` dictionary or the `requirements`
dictionary.

```python
from opentrons import protocol_api
requirements = {'robotType': 'Flex', 'apiLevel': '2.15'}
```

#### Pipettes and tip racks

Flex uses different types of pipettes and tip racks than OT-2, which have their own load names in the API. Choose pipettes of the same capacity or larger (or whatever you've outfitted your Flex with).

For example, you could convert an OT-2 protocol that uses a P300 Single-Channel GEN2 pipette and 300 µL tips to a Flex protocol that uses a Flex 1-Channel 1000 µL pipette and 1000 µL tips:

```python
# Original OT-2 code
def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    left_pipette = protocol.load_instrument(
        "p300_single_gen2", "left", tip_racks=[tips]
    )
```

```python
# Modified Flex code
def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    left_pipette = protocol.load_instrument(
        "flex_1channel_1000", "left", tip_racks[tips]
    )
```


The only necessary changes are the new arguments of `load_labware()` and `load_instrument()`. Keep in mind that if you use smaller capacity tips than the original protocol, you may need to make further adjustments to avoid running out of tips, and the protocol may take longer to execute.

#### Deck slots

The API accepts OT-2 and Flex deck slot names interchangeably. It's good practice to use the coordinate deck slot format in Flex protocols (as in the example in the previous subsection), but it's not required. The correspondence between deck slot numbers is as follows:

<table>
  <tr>
    <th>Flex</th>
    <td>A1</td>
    <td>A2</td>
    <td>A3</td>
    <td>B1</td>
    <td>B2</td>
    <td>B3</td>
    <td>C1</td>
    <td>C2</td>
    <td>C3</td>
    <td>D1</td>
    <td>D2</td>
    <td>D3</td>
  </tr>
  <tr>
    <th>OT-2</th>
    <td>10</td>
    <td>11</td>
    <td>Trash</td>
    <td>7</td>
    <td>8</td>
    <td>9</td>
    <td>4</td>
    <td>5</td>
    <td>6</td>
    <td>1</td>
    <td>2</td>
    <td>3</td>
  </tr>
</table>

A protocol that calls `#!python protocol.load_labware("opentrons_flex_96_tiprack_200ul", "1")` would require you to place that tip rack in slot D1 on Flex.

#### Modules

Update module load names for the Temperature Module and Thermocycler Module to ones that are compatible with Flex, if necessary. Flex supports:

- `temperature module gen2`

- `thermocycler module gen2` or `thermocyclerModuleV2`

The Heater-Shaker Module only has one generation, which is compatible
with Flex and OT-2.

For protocols that load `magnetic module`, `magdeck`, or `magnetic module
gen2`, see [Magnetic Module Protocols][magnetic-module-protocols] below.

### OT-2 JSON protocols

Currently, Protocol Designer can't convert an OT-2 protocol to a Flex protocol. You have to choose which robot the protocol will run on when you create it.

Since Flex protocols support nearly all the features of OT-2 protocols, you can create a new protocol that performs all the same steps, but is designed to run on Flex. The simplest way to do this is:

1.  Launch Protocol Designer and import your OT-2 protocol.

2.  Open a second browser window and launch Protocol Designer there.

3.  Create a new Flex protocol in the second browser window.

4.  Set up the Flex hardware as similarly as possible as the OT-2 hardware. For example, choose pipettes of the same capacity or larger, and choose modules of the same type.

5.  Replicate the liquid setup and steps from the OT-2 protocol.

6.  Export your Flex protocol. Import it into the Opentrons App and check the run preview to see that it performs the same steps as your OT-2 protocol.

You can make bigger changes if your Flex configuration differs significantly from your OT-2 configuration, but you may need to re-verify your protocol.

### Magnetic Module protocols

Note that there is no direct analogue of the Magnetic Module on Flex. You'll have to use the Magnetic Block and Flex Gripper instead. This will require reworking some of your protocol steps, and you should verify that your new protocol design achieves similar results.
