---
title: "Opentrons Flex: Labware and the Gripper"
---

# Labware and the Opentrons Flex Gripper 

Although Opentrons Flex works with all items in the Labware Library, the Opentrons Flex Gripper is compatible only with labware whose definitions provide information about how they should be picked up and moved around the deck. Currently, the gripper is compatible with the following Opentrons-verified labware: 

- All Opentrons Tough labware.
- All Opentrons Flex tip racks and their lids.
- All well plate lids.
- Most flat bottom well plates and PCR plates.
- The NEST 1 Well Reservoir 195 mL.

!!! note
    For best results, use the Flex Gripper only with the labware listed above. If you need to use the gripper with other ANSI/SLAS automation compliant labware, you need to create a custom labware definition by manually editing the JSON file to include gripper-specific information. See the [Custom Labware Definitions section][custom-labware-definitions] or contact Opentrons Support for more information. 
