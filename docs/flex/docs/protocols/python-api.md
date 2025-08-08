---
title: "Opentrons Flex: Python Protocol API"
---

# Python Protocol API

Writing protocol scripts in Python gives you the most fine-grained control of Opentrons Flex. Version 2 of the Python Protocol API is a single Python package that exposes a wide range of liquid handling features on Opentrons robots. 

!!! info "Additional Documentation"
    For an idea of the breadth of the API, check out the [full online documentation](https://docs.opentrons.com/v2/), which includes topic-based articles as well as a [comprehensive reference](https://docs.opentrons.com/v2/new_protocol_api.html) of all methods and functions contained in the package. If you've never written an Opentrons protocol before and want to build one from scratch, follow the [Tutorial](https://docs.opentrons.com/v2/tutorial.html).

## Writing and running scripts

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

## Python-exclusive features

Certain features are only available in Python protocols, either because they are part of the API or because of the inherent flexibility of Python code.

### Partial tip pickup

The Python API supports the most partial tip pickup configurations. Currently, Protocol Designer only supports column pickup with the 96-channel pipette. The `InstrumentContext.configure_nozzle_layout()` method supports these additional layouts:

- Row pickup with the 96-channel pipette.

- Partial column pickup with 8-channel pipettes.

- Single tip pickup with all multi-channel pipettes.

Certain configurations allow changing which nozzles are used. For example, you can pick up a column of tips with either the left or right edge of the 96-channel pipette.

### Runtime parameters

Starting in API version 2.18, you can define user-customizable variables in your Python protocols. This gives you greater flexibility and puts extra control in the hands of the technician running the protocol --- without forcing them to switch between lots of protocol files or write code themselves.

Runtime parameters can customize Boolean, numerical, and string values in your protocol. And starting in API version 2.20, you can require a CSV file of data to be parsed and used in the protocol. See the [API documentation on runtime parameters](https://docs.opentrons.com/v2/runtime_parameters.html) for information on writing them into protocols, and see the Runtime Parameters section of the Software and Operation chapter for information on changing parameter values during run setup.

### Non-blocking commands

Some module commands that take a long time to complete (such as heating from ambient temperature to a high temperature) can be run in a *non-blocking* manner. This lets your protocol save time by continuing on to other pipetting tasks instead of waiting for the command to complete. Non-blocking commands are currently supported on the [Heater-Shaker Module](https://docs.opentrons.com/v2/modules/heater_shaker.html#non-blocking-commands).

### Python packages

Not only does the Python API support some features not included in Protocol Designer, but every Python protocol *is a Python script*, which means that it can perform any computation that relies on the Python standard libraries or the suite of libraries included in the Flex system software.

You can even install additional Python packages on Flex. [Connect to your Flex via SSH][command-line-operation-over-ssh] and install the package with `pip`. To avoid analysis errors in the Opentrons App, install the packages on your computer as well. In the Opentrons App settings, go to **Advanced** and click **Add override path** in the Override Path to Python section. Choose the copy of `python` on your system that has access to the packages.