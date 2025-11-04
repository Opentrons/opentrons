---
title: "Opentrons Flex: Introduction"
---

Opentrons Flex is a liquid-handling robot designed for high throughput and complex workflows. The Flex robot is the base of a modular system that includes pipettes, a labware gripper, deck fixtures, on-deck modules, and labware — all of which you can swap out yourself. Flex is designed with a touchscreen so you can work with it directly at the lab bench, or you can control it from across your lab with the Opentrons App or our open-source APIs.

Flex workstations come with all of the equipment — robot, hardware, and labware — that you need to get started automating common lab tasks. For other applications, Opentrons Flex runs on fully open-source software and firmware, and does not require proprietary reagents and labware, giving you control over how you design and run your protocols.

## Flex-exclusive features

Opentrons Flex includes advanced features to help you automate any workflow, available only on the Flex. 

| Feature | Description |
| --- | --- |
| **Pipette throughput** | <ul><li>Flex pipettes have 1, 8, or 96 channels. The 96-channel pipette is available only for Flex.</li><li> Flex pipettes have large volume ranges. The 5–1000 µL pipettes work with any volume of Opentrons Flex tips, making it easy to automate a wide range of pipetting tasks in a single workflow.</li></ul> |
| **Gripper** | The Opentrons Flex Gripper picks up and moves labware around the deck automatically, without user intervention. The gripper enables more complex workflows within a single protocol run.                                                                             |
| **Automated calibration** | Positional calibration of Flex pipettes and the gripper is fully automated. Press one button, and the instrument will move to precision-machined points on the deck to determine its exact position, saving that data for use in your protocols.                      |
| **Touchscreen** | Flex has its own touchscreen interface that lets you control it directly, in addition to using the Opentrons App. Use the touchscreen to start protocol runs, perform quick transfers, check job status, and change settings right on the robot.                                                 |
| **Module caddies** | Flex modules fit into caddies that occupy space below the deck. Caddies place your labware closer to the deck surface and allow for below-deck cable routing. Caddies enable even more module and labware configurations on the deck. |
| **Moveable trash** | The trash bin can go in multiple deck locations on Flex. The default location (slot A3) is the recommended position. You can also use the gripper to dispose of trash in the optional waste chute. |
| **Liquid detection** | Pressure sensors in Flex pipettes detect liquid in wells, including tip contact and liquid level. This feature lets you control the Flex's pipetting relative to a liquid meniscus, and alerts you if wells are empty. |
| **Liquid classes** | Use [liquid class settings](https://docs.opentrons.com/v2/liquid_classes.html) to optimize Flex's pipetting behavior for your liquids, including fine-tuned control of pipette actions like flow rate and submerge speed. You can easily apply Opentrons-verified settings for aqueous, viscous, or volatile liquids using Python commands, in a quick transfer, or in Protocol Designer. |

## Flex and OT-2 

Both Flex and OT-2 robots run on our open-source software, and the Opentrons App can control both types of robots at once. While OT-2 protocols can't be run directly on Flex, it's straightforward to adapt them (see the [OT-2 Protocols section](protocols/ot-2.md) of the Protocol Development chapter for details).

## Flex workstations

Opentrons Flex workstations include the Flex robot, accessories, pipettes and gripper, on-deck modules, and labware needed to automate a particular application. All workstation components are modular. If you need to change applications, you can add or swap in other Flex hardware and compatible consumables.

### NGS Workstation

The Opentrons Flex NGS Workstation automates NGS library prep. It can automate pre-sequencing workflows using any leading reagent system, including fragmentation- and tagmentation-based library prep.

In addition to the Flex robot, the NGS Workstation includes:

- Gripper

- Choice of pipette configuration

    - Two 8-Channel Pipettes (1–50 µL and 5–1000 µL)
  
    - 96-Channel Pipette (5–1000 µL)

- Waste Chute

- Magnetic Block

- Temperature Module

- Thermocycler Module

- Labware kit with filter tips, microcentrifuge tubes, reservoirs, and PCR plates

### PCR Workstation

The Opentrons Flex PCR Workstation automates PCR setup and thermocycling workflows for up to 96 samples. It can aliquot chilled reagents and samples into a 96-well PCR plate. With the addition of the automated Thermocycler Module, use the gripper to load the plate into the Thermocycler, and then run your chosen PCR program.

In addition to the Flex robot, the PCR Workstation includes:

- Gripper

- Choice of pipette configuration

    - 1-Channel Pipette (1–50 µL) and 8-Channel Pipette (1–50 µL)
  
    - 96-Channel Pipette (5–1000 µL)

- Waste Chute

- Temperature Module

- Labware kit with filter tips, microcentrifuge tubes, reservoirs, and PCR plates

### Nucleic Acid Extraction Workstation

The Opentrons Flex Nucleic Acid Extraction Workstation automates DNA/RNA isolation and purification. It uses the Magnetic Block for separation of magnetic beads, and the Heater-Shaker for sample lysis and resuspension of magnetic beads.

In addition to the Flex robot, the Nucleic Acid Extraction Workstation includes:

- Gripper

- Choice of pipette configuration

    - 1-Channel Pipette (5–1000 µL) and 8-Channel Pipette (5–1000 µL)
  
    - 96-Channel Pipette (5–1000 µL)

- Waste Chute

- Magnetic Block

- Heater-Shaker Module

- Labware kit with filter tips, reservoirs, PCR plates, and deep well plates

### Magnetic Bead Protein Purification Workstation

The Opentrons Flex Magnetic Bead Protein Purification Workstation automates small-scale protein purification and proteomics sample prep for up to 96 samples. It is compatible with many popular magnetic-bead-based reagents.

In addition to the Flex robot, the Protein Purification Workstation includes:

- Gripper

- Choice of pipette configuration

    - 1-Channel Pipette (5–1000 µL) and 8-Channel Pipette (5–1000 µL)
  
    - 96-Channel Pipette (5–1000 µL)

- Waste Chute

- Magnetic Block

- Heater-Shaker Module

- Labware kit with filter tips, reservoirs, PCR plates, and deep well plates


