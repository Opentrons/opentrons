---
title: "Opentrons Flex: Custom Protocol Service"
---

# Custom Protocol Development Service

Opentrons provides a [Remote Custom Protocol Development service](https://opentrons.com/instrument-services) for applications not already included in the Protocol Library. Our comprehensive authoring and validation service has a turnaround time of two weeks. As part of the service, Opentrons field applications scientists will:

- Develop the Python protocol.

- Validate the code.

- Install the protocol remotely.

- Create deck and reagent setup instructions.

- Optimize your protocol as much as needed within one week of initial delivery.

By default, Opentrons adds all custom protocols to the Protocol Library so the community can benefit from them. However, if your application requires privacy, you can opt out of inclusion in the Protocol Library.

!!! note
    The Custom Protocol Development service only writes Python protocols that control Opentrons hardware. It does not cover controlling the robot with code in other languages, nor does it cover controlling third-party hardware.

## Protocol request guidelines

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

## Custom protocol pricing

Custom Protocol Development is a service available to all owners of Opentrons Flex systems. Opentrons provides remote and onsite protocol development services customized to your specific workflow. Price and development time are based on the complexity of your protocol and the related code. See the [Instrument Services section](https://opentrons.com/instrument-services) of the Opentrons website to contact us for more information about our Custom Protocol Development offerings.

