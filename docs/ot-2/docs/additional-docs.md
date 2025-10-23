---
title: "Opentrons OT-2: Additional Documentation"
---

In addition to this manual, Opentrons provides several online resources for our hardware and software products. These resources may be valuable as you use the OT-2.

## Opentrons Knowledge Hub

The [Opentrons Knowledge Hub](https://opentrons.com/resources/knowledge-hub/) hosts publications about Opentrons products and related scientific applications. Some of the publication categories are:

- **Application notes:** Scientific papers on performing particular applications with Opentrons hardware. Topics range from nucleic acid extraction and NGS quantification to handling volatile or viscous liquids.
- **Certificates:** Official regulatory and compliance documents for Opentrons hardware.
- **Documentation and manuals:** Product instruction manuals (including this one) for Opentrons robots and modules. Also includes digital versions of the Quickstart Guides that ship in Opentrons product packages.
- **White papers:** Documents that detail how Opentrons products are constructed and validated. White papers include dimensional drawings of Opentrons hardware.

## Python Protocol API documentation

The [Opentrons Python Protocol API documentation](https://docs.opentrons.com/v2/) describes how to write automated biology lab protocols for Opentrons robots and hardware modules. The documentation includes a [Tutorial](https://docs.opentrons.com/v2/tutorial.html) for users writing their first Python protocol.

The Python API documentation covers writing Python code to:

- Load and work with labware.
- Load and work with Opentrons modules.
- Load and work with pipettes.
- Perform discrete liquid-handling actions, such as aspirating and dispensing.
- Perform complex liquid-handling actions, such as transfers between wells.
- Move instruments to exact locations in the working area.

A [Python API reference](https://docs.opentrons.com/v2/new_protocol_api.html) is also available, with information about all of the classes and methods that comprise the API.

## Opentrons HTTP API reference

The [Opentrons HTTP API reference](http://docs.opentrons.com/http/api_reference.html) describes all of the endpoints of the API used to directly control Opentrons robots. The API has many endpoint categories, including:

- Querying the state of the robot.
- Performing calibration tasks.
- Managing and running protocols.
- Moving the gantry and instruments.
- Controlling discrete systems like the ambient lighting and camera.

The API reference is defined by and generated from an [OpenAPI](https://www.openapis.org) specification.

## Developer documentation

For users who want to work directly with Opentrons source code, documentation is available alongside the corresponding code on GitHub. For example, the [Development Environment Setup](https://github.com/Opentrons/opentrons/blob/edge/DEV_SETUP.md) page provides a guide with opinionated instructions for setting up your computer. Working through these steps is required to run the Opentrons App or a simulated robot server from source.
