---
title: "Opentrons Flex: Introduction"
---

Opentrons Flex is a liquid-handling robot designed for high throughput and complex workflows. The Flex robot is the base of a modular system that includes pipettes, a labware gripper, deck fixtures, on-deck modules, and labware — all of which you can swap out yourself. Flex is designed with a touchscreen so you can work with it directly at the lab bench, or you can control it from across your lab with the Opentrons App or our open-source APIs.

Flex workstations come with all of the equipment — robot, hardware, and labware — that you need to get started automating common lab tasks. For other applications, Opentrons Flex runs on fully open-source software and firmware, and does not require proprietary reagents and labware, giving you control over how you design and run your protocols.

## What's new in Flex

Opentrons Flex is part of the Opentrons liquid handler series of robots. Users of Opentrons Flex may be familiar with the Opentrons OT-2, our personal pipetting robot. Flex goes beyond the capabilities of OT-2 in several key areas, delivering higher throughput and walkaway time.

| Feature | Description |
| --- | --- |
| **Pipette throughput** | Flex pipettes have 1, 8, or 96 channels. The 96-channel pipette operates on 12 times as many wells at once as the largest OT-2 pipette.                                                                                                                               |
| **Pipette and tip capacities** | Flex pipettes have larger volume ranges (1–50 µL, 5–1000 µL). The 5–1000 µL Flex pipettes can work with any volume of Opentrons Flex tips. This is an improvement over OT-2 pipettes, which have smaller ranges and must use tips with a matching volume range.                         |
| **Gripper** | The Opentrons Flex Gripper picks up and moves labware around the deck automatically, without user intervention. The gripper enables more complex workflows within a single protocol run.                                                                             |
| **Automated calibration** | Positional calibration of Flex pipettes and the gripper is fully automated. Press one button, and the instrument will move to precision-machined points on the deck to determine its exact position, saving that data for use in your protocols.                      |
| **Touchscreen** | Flex has its own touchscreen interface that lets you control it directly, in addition to using the Opentrons App. Use the touchscreen to start protocol runs, check job status, and change settings right on the robot.                                                 |
| **Module caddies** | Flex modules fit into caddies that occupy space below the deck. Caddies place your labware closer to the deck surface and allow for below-deck cable routing. Caddies enable even more module and labware configurations on the deck.                                  |
| **Deck slot coordinates** | Deck slots on Flex are numbered with a coordinate system (A1–D4) which is similar to how wells are numbered on labware.                                                                                                                                             |
| **Movable trash** | The trash bin can go in multiple deck locations on Flex. The default location (slot A3) is the recommended position. You can also use the gripper to dispose of trash in the optional waste chute.                                                                     |
| **Size and weight** | Flex is a bit bigger and much heavier than OT-2. Installation tasks on Flex require the assistance of a lab partner.                                                                                                                                                   |

A detailed [comparison of robot technical specifications](https://opentrons.com/products/robots/) is available on the Opentrons website.

Both Flex and OT-2 robots run on our open-source software, and the Opentrons App can control both types of robots at once. While OT-2 protocols can't be run directly on Flex, it's straightforward to adapt them (see the [OT-2 Protocols section][ot-2-python-protocols] of the Protocol Development chapter for details).

## Flex workstations

Opentrons Flex workstations include the Flex robot, accessories, pipettes and gripper, on-deck modules, and labware needed to automate a particular application. All workstation components are modular. If you need to change applications, you can add or swap in other Flex hardware and compatible consumables.

Check our [available workstations](https://opentrons.com/products/categories/workstations) and get set up to automate steps in next-generation sequencing, proteomics, nucleic acid extraction, and other workflows. 


