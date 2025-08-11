---
title: "Opentrons Flex: OT-2 Protocols"
---

# OT-2 Protocols

There are hundreds of OT-2 protocols in the Protocol Library, and you may have created your own OT-2 protocols for your lab. Opentrons Flex can perform all the basic actions that the OT-2 can, but OT-2 protocols aren't directly compatible with Flex. However, with a little effort, you can adapt an OT-2 protocol so it will run on Flex. This lets you have parity across different Opentrons robots in your lab, or you can extend older protocols to take advantage of new features only offered on Flex.

## OT-2 Python protocols

Using the Python Protocol API, you only have to change a few aspects of an OT-2 protocol for it to run on Flex.

### Metadata and requirements

The API requires you to declare that a protocol is designed to run on Flex. Use the `robotType` key in the new `requirements` dictionary. You should also specify an `apiLevel` of 2.15 or higher. You can specify `apiLevel` either in the `metadata` dictionary or the `requirements`
dictionary.

```python
from opentrons import protocol_api
requirements = {'robotType': 'Flex', 'apiLevel': '2.15'}
```

### Pipettes and tip racks

Flex uses different types of pipettes and tip racks than OT-2, which have their own load names in the API. Choose pipettes of the same capacity or larger (or whatever you've outfitted your Flex with).

For example, you could convert an OT-2 protocol that uses a P300 Single-Channel GEN2 pipette and 300 µL tips to a Flex protocol that uses a Flex 1-Channel 1000 µL pipette and 1000 µL tips:

```python
# Original OT-2 code
def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    left_pipette = protocol.load_instrument(
        "p300_single_gen2", "left", tip_racks=[tips]
    )
```

```python
# Modified Flex code
def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    left_pipette = protocol.load_instrument(
        "flex_1channel_1000", "left", tip_racks[tips]
    )
```


The only necessary changes are the new arguments of `load_labware()` and `load_instrument()`. Keep in mind that if you use smaller capacity tips than the original protocol, you may need to make further adjustments to avoid running out of tips, and the protocol may take longer to execute.

### Deck slots

The API accepts OT-2 and Flex deck slot names interchangeably. It's good practice to use the coordinate deck slot format in Flex protocols (as in the example in the previous subsection), but it's not required. The correspondence between deck slot numbers is as follows:

<table>
  <tr>
    <th>Flex</th>
    <td>A1</td>
    <td>A2</td>
    <td>A3</td>
    <td>B1</td>
    <td>B2</td>
    <td>B3</td>
    <td>C1</td>
    <td>C2</td>
    <td>C3</td>
    <td>D1</td>
    <td>D2</td>
    <td>D3</td>
  </tr>
  <tr>
    <th>OT-2</th>
    <td>10</td>
    <td>11</td>
    <td>Trash</td>
    <td>7</td>
    <td>8</td>
    <td>9</td>
    <td>4</td>
    <td>5</td>
    <td>6</td>
    <td>1</td>
    <td>2</td>
    <td>3</td>
  </tr>
</table>

A protocol that calls `#!python protocol.load_labware("opentrons_flex_96_tiprack_200ul", "1")` would require you to place that tip rack in slot D1 on Flex.

### Modules

Update module load names for the Temperature Module and Thermocycler Module to ones that are compatible with Flex, if necessary. Flex supports:

- `temperature module gen2`

- `thermocycler module gen2` or `thermocyclerModuleV2`

The Heater-Shaker Module only has one generation, which is compatible
with Flex and OT-2.

For protocols that load `magnetic module`, `magdeck`, or `magnetic module
gen2`, see [Magnetic Module Protocols][magnetic-module-protocols] below.

## OT-2 JSON protocols

Currently, Protocol Designer can't convert an OT-2 protocol to a Flex protocol. You have to choose which robot the protocol will run on when you create it.

Since Flex protocols support nearly all the features of OT-2 protocols, you can create a new protocol that performs all the same steps, but is designed to run on Flex. The simplest way to do this is:

1.  Launch Protocol Designer and import your OT-2 protocol.

2.  Open a second browser window and launch Protocol Designer there.

3.  Create a new Flex protocol in the second browser window.

4.  Set up the Flex hardware as similarly as possible as the OT-2 hardware. For example, choose pipettes of the same capacity or larger, and choose modules of the same type.

5.  Replicate the liquid setup and steps from the OT-2 protocol.

6.  Export your Flex protocol. Import it into the Opentrons App and check the run preview to see that it performs the same steps as your OT-2 protocol.

You can make bigger changes if your Flex configuration differs significantly from your OT-2 configuration, but you may need to re-verify your protocol.

## Magnetic Module protocols

Note that there is no direct analogue of the Magnetic Module on Flex. You'll have to use the Magnetic Block and Flex Gripper instead. This will require reworking some of your protocol steps, and you should verify that your new protocol design achieves similar results.
