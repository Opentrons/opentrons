---
title: "Python API: Protocol Examples"
description: "Example protocols for transfers, mixes, and common workflows."
---

This page provides simple, ready-made protocols for Flex and OT-2. Feel free to copy and modify these examples to create unique protocols that help automate your laboratory workflows. Also, experimenting with these protocols is another way to build upon the skills you've learned from working through the [tutorial](../tutorial.md). Try adding different hardware, labware, and commands to a sample protocol and test its validity after importing it into the Opentrons App.

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
