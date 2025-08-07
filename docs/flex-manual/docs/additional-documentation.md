---
title: "Opentrons Flex: Additional Documentation"
---

# Additional Documentation

Opentrons maintains additional online documentation for our hardware and software products. You may find these resources valuable as you use Opentrons Flex.

## Opentrons Knowledge Hub

The [Opentrons Knowledge Hub](https://opentrons.com/resources/knowledge-hub/) hosts publications about Opentrons products and related scientific applications. Some of the publication categories are:

- **Application Notes:** Scientific papers on performing particular applications with Opentrons hardware. Topics range from nucleic acid extraction and NGS quantification to handling volatile or viscous liquids.

- **Certificates:** Official regulatory and compliance documents for Opentrons hardware.

- **Documentation & Manuals:** Product instruction manuals (including this one) for Opentrons robots and modules. Also includes digital versions of the Quickstart Guides that ship in Opentrons product packages.

- **White Papers:** Documents that detail how Opentrons products are constructed and validated. White papers include dimensional drawings of Opentrons hardware.

## Python Protocol API documentation

The [online documentation for the Opentrons Python Protocol API](https://docs.opentrons.com/v2/) describes how to write automated biology lab protocols for Opentrons robots and hardware modules. The documentation includes a [Tutorial](https://docs.opentrons.com/v2/tutorial.html) for users writing their first Python protocol.

The Python API documentation covers writing Python code to:

- Load and work with labware.

- Load and work with Opentrons modules.

- Load and work with pipettes and the gripper.

- Perform discrete liquid-handling actions, such as aspirating and dispensing.

- Perform complex liquid-handling actions, such as transfers between wells.

- Move instruments to exact locations in the working area.

There is also a [Python API reference](https://docs.opentrons.com/v2/new_protocol_api.html) with information about all of the classes and methods that comprise the API.

## Opentrons HTTP API reference

The [Opentrons HTTP API reference](http://docs.opentrons.com/http/api_reference.html) describes all of the endpoints of the API used to directly control Opentrons robots. The API has many endpoint categories, including:

- Querying the state of the robot.

- Performing calibration tasks.

- Managing and running protocols.

- Moving the gantry and instruments.

- Controlling discrete systems like the ambient lighting and camera.

The API reference is defined by and generated from an [OpenAPI](https://www.openapis.org) specification.

## Developer documentation

Documentation for working directly with Opentrons source code is available alongside the corresponding code on GitHub. Notable documentation pages include:

- [Development Environment Setup](https://github.com/Opentrons/opentrons/blob/edge/DEV_SETUP.md): Opinionated instructions for setting up your computer to work on the software in the Opentrons/opentrons repository. These setup steps are required for running the Opentrons App or a simulated robot server from source.

- [Opentrons Emulation Wiki](https://github.com/Opentrons/opentrons-emulation/wiki): Explanation and instructions for using our software that emulates Opentrons robots at the firmware or hardware level.
