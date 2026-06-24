---
title: Python Protocol API Documentation
description: "Write Python protocols for Opentrons liquid handling robots."
---

The Opentrons Python Protocol API is a Python framework designed to make it easy to write automated biology lab protocols. Python protocols can control Opentrons Flex and OT-2 robots, their pipettes, and optional hardware modules. We've designed the API to be accessible to anyone with basic Python and wet-lab skills.

As a bench scientist, you should be able to code your protocols in a way that reads like a lab notebook. You can write a fully functional protocol just by listing the equipment you'll use (modules, labware, and pipettes) and the exact sequence of movements the robot should make.

As a programmer, you can leverage the full power of Python for advanced automation in your protocols. Perform calculations, manage external data, use built-in and imported Python modules, and more to implement your custom lab workflow.

## Getting started

**New to Python protocols?** Check out the [tutorial](tutorial.md) to learn about the different parts of a protocol file and build a working protocol from scratch.

If you want to **dive right into code**, take a look at our [examples](examples.md) and the comprehensive [Protocol API Reference](reference/protocols.md).

When you're ready to **try out a protocol**, download the [Opentrons App](https://www.opentrons.com/ot-app), import the protocol file, and run it on your robot.

## How the API works

The design goal of this API is to make code readable and easy to understand. A protocol, in its most basic form:

1. Provides some information about who made the protocol and what it is for.
2. Specifies which type of robot the protocol should run on.
3. Tells the robot where to find labware, pipettes, and (optionally) hardware modules.
4. Commands the robot to manipulate its attached hardware.

For example, if we wanted to transfer liquid from well A1 to well B1 on a plate, our protocol would look like:

=== "Flex"
    ```python
    from opentrons import protocol_api

    # metadata
    metadata = {
        "protocolName": "My Protocol",
        "author": "Name <opentrons@example.com>",
        "description": "Simple protocol to get started using the Flex",
    }

    # requirements
    requirements = {"robotType": "Flex", "apiLevel": "{{ apiLevel }}"}

    # protocol run function
    def run(protocol: protocol_api.ProtocolContext):
        # labware
        plate = protocol.load_labware(
            "corning_96_wellplate_360ul_flat", location="D1"
        )
        tip_rack = protocol.load_labware(
            "opentrons_flex_96_tiprack_200ul", location="D2"
        )
        trash = protocol.load_trash_bin(location="A3")

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
    This example proceeds completely linearly. Following it line-by-line, you can see that it has the following effects:

    1. Gives the name, contact information, and a brief description for the protocol.
    2. Indicates the protocol should run on a Flex robot, using API version {{ apiLevel }}.
    3. Tells the robot that there is:

        1. A 96-well flat plate in slot D1.
        2. A rack of 300 µL tips in slot D2.
        3. A 1-channel 1000 µL pipette attached to the left mount, which should pick up tips from the aforementioned rack.
    4. Tells the robot to act by:

        1. Picking up the first tip from the tip rack.
        2. Aspirating 100 µL of liquid from well A1 of the plate.
        3. Dispensing 100 µL of liquid into well B1 of the plate.
        4. Dropping the tip in the trash.

=== "OT-2"
    ```python
    from opentrons import protocol_api

    # metadata
    metadata = {
        "protocolName": "My Protocol",
        "author": "Name <opentrons@example.com>",
        "description": "Simple protocol to get started using the OT-2",
    }

    # requirements
    requirements = {"robotType": "OT-2", "apiLevel": "{{ apiLevel }}"}

    # protocol run function
    def run(protocol: protocol_api.ProtocolContext):
        # labware
        plate = protocol.load_labware(
            "corning_96_wellplate_360ul_flat", location="1"
        )
        tip_rack = protocol.load_labware(
            "opentrons_96_tiprack_300ul", location="2"
        )

        # pipettes
        left_pipette = protocol.load_instrument(
            "p300_single", mount="left", tip_racks=[tip_rack]
        )

        # commands
        left_pipette.pick_up_tip()
        left_pipette.aspirate(100, plate["A1"])
        left_pipette.dispense(100, plate["B2"])
        left_pipette.drop_tip()
    ```
    This example proceeds completely linearly. Following it line-by-line, you can see that it has the following effects:

    1. Gives the name, contact information, and a brief description for the protocol.
    2. Indicates the protocol should run on an OT-2 robot, using API version {{ apiLevel }}.
    3. Tells the robot that there is:

        1. A 96-well flat plate in slot 1.
        2. A rack of 300 µL tips in slot 2.
        3. A single-channel 300 µL pipette attached to the left mount, which should pick up tips from the aforementioned rack.
    4. Tells the robot to act by:

        1. Picking up the first tip from the tip rack.
        2. Aspirating 100 µL of liquid from well A1 of the plate.
        3. Dispensing 100 µL of liquid into well B1 of the plate.
        4. Dropping the tip in the trash.

There is much more that Opentrons robots and the API can do! The [Building Block Commands](building-block-commands/index.md), [Complex Commands](complex-commands/index.md), and [Modules](modules/index.md) pages cover many of these functions.

## More resources

### Opentrons App

The [Opentrons App](https://opentrons.com/ot-app/) is the easiest way to run your Python protocols. The app runs on the latest versions of macOS, Windows, and Ubuntu.

### Support

Questions about setting up your robot, using Opentrons software, or troubleshooting? Check out [our other documentation](../index.md) or [contact Opentrons Support directly](mailto:support@opentrons.com).

### Custom protocol service

Don't have the time or resources to write your own protocols? Our [custom protocol development service](https://opentrons.com/instrument-services/) can help you set up and optimize your workflow.

### Contributing

Opentrons software, including the Python API and this documentation, is open source. If you have an improvement or an interesting idea, you can create an issue on GitHub by following our [guidelines](https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#opening-issues).

That guide also includes more information on how to [directly contribute code](https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md).
