# Welcome

The Opentrons Python Protocol API is a Python framework designed to make it easy to write automated biology lab protocols. Python protocols can control Opentrons Flex and OT-2 robots, their pipettes, and optional hardware modules. We've designed the API to be accessible to anyone with basic Python and wet-lab skills. 

As a bench scientist, you should be able to code your protocols in a way that reads like a lab notebook. You can write a fully functional protocol just by listing the equipment you'll use (modules, labware, and pipettes) and the exact sequence of movements the robot should make.

As a programmer, you can leverage the full power of Python for advanced automation in your protocols. Perform calculations, manage external data, use built-in and imported Python modules, and more to implement your custom lab workflow.

## Getting Started

**New to Python protocols?** Check out the [Tutorial](tutorial.md) to learn about the different parts of a protocol file and build a working protocol from scratch. 

If you want to **dive right into code**, take a look at our [Protocol Examples](examples.md) and the comprehensive [API Version 2 Reference](api-reference.md).

When you're ready to **try out a protocol**, download the [Opentrons App](https://www.opentrons.com/ot-app), import the protocol file, and run it on your robot.

## How the API Works

The design goal of this API is to make code readable and easy to understand. A protocol, in its most basic form:

1. Provides some information about who made the protocol and what it is for.
2. Specifies which type of robot the protocol should run on.
3. Tells the robot where to find labware, pipettes, and (optionally) hardware modules.
4. Commands the robot to manipulate its attached hardware.

TK TK TK