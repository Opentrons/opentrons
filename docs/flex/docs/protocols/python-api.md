---
title: "Opentrons Flex: Python Protocol API"
description: "Write Python protocols for Flex using the Opentrons Python API."
---

Writing protocol scripts in Python gives you the most fine-grained control of Opentrons Flex. Version 2 of the Python Protocol API is a single Python package that exposes a wide range of liquid handling features on Opentrons robots. 

!!! info "Additional Documentation"
    For an idea of the breadth of the API, check out the [full API documentation](../../python-api/index.md), which includes topic-based articles as well as a [comprehensive reference](../../python-api/reference/protocols.md) of all methods and functions contained in the package. If you've never written an Opentrons protocol before and want to build one from scratch, follow the [Tutorial](../../python-api/tutorial.md).

## Writing and running scripts

Python protocols generally follow the same basic structure:

1.  Importing the `opentrons` package.

2.  Declaring the `requirements` and `metadata` in their respective dictionaries.

3.  Defining a `run()` function that contains all of the instructions to the robot, including:

    - [Pipettes](../../python-api/pipettes/index.md) the protocol will use.

    - Locations of [modules](../../python-api/modules/index.md), [labware](../../python-api/labware.md), and [deck fixtures](../../python-api/deck-slots.md#deck-configuration).

    - Liquid [classes](../../python-api/liquid-classes/liquid-classes.md) or [types and locations](../../python-api/labware.md#labeling-liquids-in-labware) (optional).

    - Commands the system will physically execute (e.g., [simple](../../python-api/building-block-commands/index.md) or [complex](../../python-api/complex-commands/index.md) liquid
    handling commands, [module](../../python-api/modules/index.md) commands, or [movement](../../python-api/robot-position.md) commands).

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

However, one of the advanced features of the Python API is to control a robot outside of the usual flow for setting up and running a protocol. Opentrons Flex runs a Jupyter Notebook server, which can execute discrete blocks of code (called *cells*), rather than a complete protocol file. When organizing your code into cells, you can define a `run()` function (and then call it) or run commands without one. It's also possible to execute complete protocols in a Jupyter terminal session or when connected to Flex via SSH. For more information, see the [Advanced Operation chapter](../advanced-operation/index.md).

## Python-exclusive features

Certain features are only available in Python protocols, either because they are part of the API or because of the inherent flexibility of Python code.

### Runtime parameters

Starting in API version 2.18, you can define user-customizable variables in your Python protocols. This gives you greater flexibility and puts extra control in the hands of the technician running the protocol — without forcing them to switch between lots of protocol files or write code themselves.

Runtime parameters can customize Boolean, numerical, and string values in your protocol. And starting in API version 2.20, you can require a CSV file of data to be parsed and used in the protocol. See the [API documentation on runtime parameters](../../python-api/runtime-parameters/index.md) for information on writing them into protocols, and see the [Runtime Parameters section](../touchscreen/protocol-setup.md#runtime-parameters) of the Touchscreen chapter for information on changing parameter values during run setup.

### Robot motor control 

Starting in API version 2.22, you can move individual robot motors like the gantry, pipette plunger, and gripper jaws with [robot motor control commands](../../python-api/advanced-control/robot-motors.md). Use helper and movement commands to calculate and move robot axes to precise positions on the Flex deck, and gripper commands to open or close the Flex Gripper jaws. 

Unlike other protocol commands, robot motor control commands execute movements independent of labware and hardware positions on the Flex. This lets you complete advanced tasks, like using 3D-printed labware in your protocols, moving the Flex's z-axis carriage without a pipette attached, or simultaneously pipetting and holding labware with the Flex Gripper. 

###  Liquid level detection 

Sensors in Flex pipettes can detect the level of liquid in a well. You can use this feature to target a [liquid meniscus](../../python-api/robot-position.md#meniscus) while aspirating, dispensing, or mixing in a Python protocol. 

### Dynamic pipetting

Starting in API version 2.27, use start and end location parameters to control pipette movements during liquid transfers: 

- Continuously target the [liquid meniscus](../../python-api/robot-position.md#meniscus) as it changes while pipetting liquid.
- Change the pipette's position within a well while aspirating, dispensing, or mixing.
- Mix in different locations in labware using the [dynamic mix](../../python-api/building-block-commands/liquids.md#dynamic-mix) method.

### Concurrent commands

Some module commands that take a long time to complete (such as executing a Thermocycler profile or heating to a high temperature) can be run in a *concurrent* manner. This lets your protocol save time by continuing on to other pipetting tasks instead of waiting for the command to complete. 

As of API version 2.27, concurrent commands are currently supported on the [Heater-Shaker](../../python-api/modules/heater-shaker.md#heating-and-shaking), [Temperature](../../python-api/modules/temperature-module.md#temperature-control), and [Thermocyler](../../python-api/modules/thermocycler.md) Modules. You can also run multiple modules at the same time. See [Concurrent Module Actions](../../python-api/modules/concurrent.md) for more.

### Python packages

Not only does the Python API support some features not included in Protocol Designer, but every Python protocol *is a Python script*, which means that it can perform any computation that relies on the Python standard libraries or the suite of libraries included in the Flex system software.

You can even install additional Python packages on Flex. [Connect to your Flex via SSH](../advanced-operation/command-line.md) and install the package with `pip`. To avoid analysis errors in the Opentrons App, install the packages on your computer as well. In the Opentrons App settings, go to **Advanced** and click **Add override path** in the Override Path to Python section. Choose the copy of `python` on your system that has access to the packages.