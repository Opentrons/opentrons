---
title: "Python API: Template Protocol"
description: "TBD"
---

## Using these protocols

These sample protocols are designed for anyone using an Opentrons Flex or OT-2 liquid handling robot. For our users with little to no Python experience, we’ve taken some liberties with the syntax and structure of the code to make it easier to understand. For example, we’ve formatted the samples with line breaks to show method arguments clearly and to avoid horizontal scrolling. Additionally, the methods use [named arguments](https://en.wikipedia.org/wiki/Named_parameter) instead of positional arguments. For example:

```python
# This code uses named arguments
tiprack_1 = protocol.load_labware(
    load_name="opentrons_flex_96_tiprack_200ul",
    location="D2"
)

# This code uses positional arguments
tiprack_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
```

Both examples instantiate the variable `tiprack_1` with a Flex tip rack, but the former is more explicit. It shows the parameter name and its value together (e.g. `location="D2"`), which may be helpful when you're unsure about what's going on in a protocol code sample.

Python developers with more experience should feel free to ignore the code styling used here and work with these examples as you like.

## Instruments and labware

The sample protocols all use the following pipettes:

- Flex 1-Channel Pipette (5–1000 µL). The API load name for this pipette is `flex_1channel_1000`.
- pipette Single-Channel GEN2 pipette for the OT-2. The API load name for this pipette is `p300_single_gen2`.

They also use the labware listed below:

| Labware type   | Labware name                        | API load name  {width="40%"} |
|---------------|-------------------------------------|---------------------------------|
| Reservoir     | USA Scientific 12-Well Reservoir 22 mL | `usascientific_12_reservoir_22ml` |
| Well plate    | Corning 96-Well Plate 360 µL Flat    | `corning_96_wellplate_360ul_flat` |
| Flex tip rack | Opentrons Flex 96 Tip Rack 200 µL    | `opentrons_flex_96_tiprack_200ul` |
| OT-2 tip rack | Opentrons 96 Tip Rack 300 µL         | `opentrons_96_tiprack_300ul`      |

---

## Protocol template

This code only loads the instruments and labware listed above, and performs no other actions. Many code snippets from elsewhere in the documentation will run without modification when added at the bottom of this template. You can also use it to start writing and testing your own code.

=== "Flex"
    ```python
    from opentrons import protocol_api
    
    requirements = {"robotType": "Flex", "apiLevel": "{{ apiLevel }}"}
    
    def run(protocol: protocol_api.ProtocolContext):
        # load tip rack in deck slot D3
        tiprack = protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_1000ul", location="D3"
        )
        # attach pipette to left mount
        pipette = protocol.load_instrument(
            instrument_name="flex_1channel_1000",
            mount="left",
            tip_racks=[tiprack]
        )
        # load well plate in deck slot D2
        plate = protocol.load_labware(
            load_name="corning_96_wellplate_360ul_flat", location="D2"
        )
        # load reservoir in deck slot D1
        reservoir = protocol.load_labware(
            load_name="usascientific_12_reservoir_22ml", location="D1"
        )
        # load trash bin in deck slot A3
        trash = protocol.load_trash_bin(location="A3")
        # Put protocol commands here
    ```

=== "OT-2"
    ```python
    from opentrons import protocol_api
    
    metadata = {"apiLevel": "{{ apiLevel }}"}
    
    def run(protocol: protocol_api.ProtocolContext):
        # load tip rack in deck slot 3
        tiprack = protocol.load_labware(
            load_name="opentrons_96_tiprack_300ul", location=3
        )
        # attach pipette to left mount
        pipette = protocol.load_instrument(
            instrument_name="p300_single_gen2",
            mount="left",
            tip_racks=[tiprack]
        )  
        # load well plate in deck slot 2
        plate = protocol.load_labware(
            load_name="corning_96_wellplate_360ul_flat", location=2
        )
        # load reservoir in deck slot 1
        reservoir = protocol.load_labware(
            load_name="usascientific_12_reservoir_22ml", location=1
        )
        # Put protocol commands here
    ```
