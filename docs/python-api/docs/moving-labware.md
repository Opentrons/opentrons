---
title: "Python API: Moving Labware"
description: "Move labware manually or with the Flex Gripper in Python protocols."
---

You can move an entire labware (and all of its contents) from one deck slot to another at any point during your protocol. On Flex, you can either use the gripper or move the labware manually. On OT-2, you can only move labware manually, since it doesn't have a gripper instrument.

## Basic movement

Use the [`ProtocolContext.move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware] method to initiate a move, regardless of whether it uses the gripper.

```python
def run(protocol: protocol_api.ProtocolContext):
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D1")
    protocol.move_labware(labware=plate, new_location="D2")
```

*New in version 2.15*

The required arguments of `move_labware()` are the `labware` you want to move and its `new_location`. You don't need to specify where the move begins, since that information is already stored in the [`Labware`][opentrons.protocol_api.labware.Labware] object—`plate` in this example. The destination of the move can be any empty deck slot, or a module that's ready to have labware added to it (see [Movement with Modules](#movement-with-modules) below). Movement to an occupied location, including the labware's current location, will raise an error.

When the move step is complete, the API updates the labware's location, so you can move the plate multiple times:

```python
protocol.move_labware(labware=plate, new_location="D2")
protocol.move_labware(labware=plate, new_location="D3")
```

For the first move, the API knows to find the plate in its initial load location, slot D1. For the second move, the API knows to find the plate in D2.

## Automatic vs manual moves

There are two ways to move labware:

- Automatically, with the Opentrons Flex Gripper.
- Manually, by pausing the protocol until a user confirms that they've moved the labware.

The `use_gripper` parameter of [`move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware] determines whether a movement is automatic or manual. Set its value to `True` for an automatic move. The default value is `False`, so if you don't specify a value, the protocol will pause for a manual move.

```python
def run(protocol: protocol_api.ProtocolContext):
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D1")

    # have the gripper move the plate from D1 to D2
    protocol.move_labware(labware=plate, new_location="D2", use_gripper=True)

    # pause to move the plate manually from D2 to D3
    protocol.move_labware(labware=plate, new_location="D3", use_gripper=False)

    # pause to move the plate manually from D3 to C1
    protocol.move_labware(labware=plate, new_location="C1")
```

*New in version 2.15*

!!! note
    Don't add a `pause()` command before `move_labware()`. When `use_gripper` is unset or `False`, the protocol pauses when it reaches the movement step. The Opentrons App or the touchscreen on Flex shows an animation of the labware movement that you need to perform manually. The protocol only resumes when you press **Confirm and resume**.

The above example is a complete and valid `run()` function. You don't have to load the gripper as an instrument, and there is no `InstrumentContext` for the gripper. All you have to do to specify that a protocol requires the gripper is to include at least one `move_labware()` command with `use_gripper=True`.

If you attempt to use the gripper to move labware in an OT-2 protocol, the API will raise an error.

## Supported labware

<table>
    <thead>
        <tr>
            <th>Labware Type</th>
            <th>API Load Names</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Full-skirt PCR plates</td>
            <td>
                <ul>
                    <li><code>armadillo_96_wellplate_200ul_pcr_full_skirt</code></li>
                    <li><code>opentrons_96_wellplate_200ul_pcr_full_skirt</code></li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>NEST well plates</td>
            <td>
                <ul>
                    <li><code>nest_96_wellplate_200ul_flat</code></li>
                    <li><code>nest_96_wellplate_2ml_deep</code></li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>Opentrons Flex 96 Tip Racks</td>
            <td>
                <ul>
                    <li><code>opentrons_flex_96_tiprack_50ul</code></li>
                    <li><code>opentrons_flex_96_tiprack_200ul</code></li>
                    <li><code>opentrons_flex_96_tiprack_1000ul</code></li>
                    <li><code>opentrons_flex_96_filtertiprack_50ul</code></li>
                    <li><code>opentrons_flex_96_filtertiprack_200ul</code></li>
                    <li><code>opentrons_flex_96_filtertiprack_1000ul</code></li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>Opentrons labware lids</td>
            <td>
                <ul>
                    <li><code>opentrons_tough_pcr_auto_sealing_lid</code></li>
                    <li><code>opentrons_flex_tiprack_lid</code></li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

You can move compatible Opentrons lids manually or with the Flex Gripper, but some restrictions apply. For more information, see [Moving Lids](#moving-lids).

!!! note
    The labware definitions listed above include information about the position and force that the gripper uses to pick up the labware. The gripper uses default values for labware definitions that don't include position and force information. The Python Protocol API won't raise a warning or error if you try to grip and move other types of labware.

## Movement with modules

Moving labware on and off of modules lets you precisely control when the labware is in contact with the hot, cold, or magnetic surfaces of the modules.

When moving labware anywhere that isn't an empty deck slot, consider what physical object the labware will rest on following the move. That object should be the value of `new_location`, and you need to make sure it's already loaded before the move. For example, if you want to move a 96-well flat plate onto a Heater-Shaker module, you actually want to have it rest on top of the Heater-Shaker's 96 Flat Bottom Adapter. Pass the adapter, not the module or the slot, as the value of `new_location`:

```python
def run(protocol: protocol_api.ProtocolContext):
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D1")
    hs_mod = protocol.load_module("heaterShakerModuleV1", "C1")
    hs_adapter = hs_mod.load_adapter("opentrons_96_flat_bottom_adapter")
    hs_mod.open_labware_latch()
    protocol.move_labware(
        labware=plate, new_location=hs_adapter, use_gripper=True
    )
```

*New in version 2.15*

If you try to move the plate to slot C1 or the Heater-Shaker module, the API will raise an error, because C1 is occupied by the Heater-Shaker, and the Heater-Shaker is occupied by the adapter. Only the adapter, as the topmost item in that stack, is unoccupied.

Also note the `hs_mod.open_labware_latch()` command in the above example. To move labware onto or off of a module, you have to make sure that it's physically accessible:

- For the Heater-Shaker, use [`open_labware_latch()`][opentrons.protocol_api.HeaterShakerContext.open_labware_latch].
- For the Thermocycler, use [`open_lid()`][opentrons.protocol_api.ThermocyclerContext.open_lid].

If the labware is inaccessible, the API will raise an error.

## Movement into the waste chute

Move used tip racks and well plates to the waste chute to dispose of them. This requires you to first [configure the waste chute](deck-slots.md#waste-chute-api) in your protocol. Then use the loaded [`WasteChute`][opentrons.protocol_api.WasteChute] object as the value of `new_location`:

```python
chute = protocol.load_waste_chute()
protocol.move_labware(
    labware=plate, new_location=chute, use_gripper=True
)
```

*New in version 2.16*

Always specify `use_gripper=True` when moving labware into the waste chute. The chute is not designed for manual movement. You can still manually move labware to other locations, including off-deck, with the chute installed.

## Moving lids

You can use [`ProtocolContext.move_lid()`][opentrons.protocol_api.ProtocolContext.move_lid] to move labware lids around the deck manually or using the Flex Gripper. Currently supported lids include the Opentrons Tough Universal Lid, the Opentrons Tough PCR Auto-Sealing Lid (for use with the Thermocycler), and the Opentrons Flex Tip Rack Lid.

You can move the auto-sealing lids between deck slots, lid stacks, or compatible labware loaded in your protocol. This example loads a stack of lids and then moves one to a PCR plate on the Thermocycler.

```python
# load Thermocycler and plate
tc_mod = protocol.load_module(module_name="thermocyclerModuleV2")
plate = tc_mod.load_labware(name="opentrons_96_wellplate_200ul_pcr_full_skirt")

# load lid stack
lid_stack = protocol.load_lid_stack(
    load_name="opentrons_tough_pcr_auto_sealing_lid",
    location="D4",
    quantity=4
)
# move one lid to a compatible well plate in the Thermocycler
tc_mod.open_lid()
protocol.move_lid(
    source_location=lid_stack,
    new_location=plate,
    use_gripper=True
)
```

When you're done with a lid, use `move_lid()` to dispose of it in the waste chute or a trash bin:

<!-- test: continue-previous -->
```python
protocol.move_lid(
    source_location=plate,
    new_location=trash,
    use_gripper=True
)
```

To work with tip rack lids, first [load the tip rack lid][loading-lids] using the `lid` parameter of [`load_labware()`][opentrons.protocol_api.ProtocolContext.load_labware]. Once loaded, you can only move a tip rack lid to another, unlidded tip rack or to a trash container. If you try setting another `new_location`, the API will raise an error.

*New in version 2.23*

## The off-deck location

In addition to moving labware around the deck, [`move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware] can also prompt you to move labware off of or onto the deck.

Remove labware from the deck to perform tasks like retrieving samples or discarding a spent tip rack. The destination location for such moves is the special constant [`OFF_DECK`][opentrons.protocol_api.OFF_DECK]:

```python
protocol.move_labware(labware=plate, new_location=protocol_api.OFF_DECK)
```

*New in version 2.15*

Moving labware off-deck always requires user intervention, because the gripper can't reach outside of the robot. Omit the `use_gripper` parameter or explicitly set it to `False`. If you try to move labware off-deck with `use_gripper=True`, the API will raise an error.

You can also load labware off-deck, in preparation for a `move_labware()` command that brings it *onto* the deck. For example, you could assign two tip racks to a pipette—one on-deck, and one off-deck—and then swap out the first rack for the second one:

```python
from opentrons import protocol_api

metadata = {"apiLevel": "{{ apiLevel }}", "protocolName": "Tip rack replacement"}
requirements = {"robotType": "OT-2"}

def run(protocol: protocol_api.ProtocolContext):
    tips1 = protocol.load_labware("opentrons_96_tiprack_1000ul", 1)
    # load another tip rack but don't put it in a slot yet
    tips2 = protocol.load_labware(
        "opentrons_96_tiprack_1000ul", protocol_api.OFF_DECK
    )
    pipette = protocol.load_instrument(
        "p1000_single_gen2", "left", tip_racks=[tips1, tips2]
    )
    # use all the on-deck tips
    for i in range(96):
        pipette.pick_up_tip()
        pipette.drop_tip()
    # pause to move the spent tip rack off-deck
    protocol.move_labware(labware=tips1, new_location=protocol_api.OFF_DECK)
    # pause to move the fresh tip rack on-deck
    protocol.move_labware(labware=tips2, new_location=1)
    pipette.pick_up_tip()
```

Using the off-deck location to remove or replace labware lets you continue your workflow in a single protocol, rather than needing to end a protocol, reset the deck, and start a new protocol run.
