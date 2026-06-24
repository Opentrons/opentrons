---
title: "Python API: Adapting from OT-2 to Flex"
description: "Port OT-2 protocols to Flex; deck slots, pipettes, and API differences."
---

Python protocols designed to run on the OT-2 can't be directly run on Flex without some modifications. This page describes the minimal steps that you need to take to get OT-2 protocols analyzing and running on Flex.

Adapting a protocol for Flex lets you have parity across different Opentrons robots in your lab, or you can extend older protocols to take advantage of new features only available on Flex. Depending on your application, you may need to do additional verification of your adapted protocol.

Examples on this page are in tabs so you can quickly move back and forth to see the differences between OT-2 and Flex code.

## Metadata and requirements

Flex requires you to specify an `apiLevel` of 2.15 or higher. If your OT-2 protocol specified `apiLevel` in the `metadata` dictionary, it's best to move it to the `requirements` dictionary. You can't specify it in both places, or the API will raise an error.

!!! note
    Consult the [list of changes in API versions][changes-in-api-versions] to see what effect raising the `apiLevel` will have. If you increased it by multiple minor versions to get your protocol running on Flex, make sure that your protocol isn't using removed commands or commands whose behavior has changed in a way that may affect your scientific results.

You also need to specify `"robotType": "Flex"`. If you omit `robotType` in the `requirements` dictionary, the API will assume the protocol is designed for the OT-2.

=== "Original OT-2 code"
    ```python
    from opentrons import protocol_api

    metadata = {
        "protocolName": "My Protocol",
        "description": "This protocol uses the OT-2",
        "apiLevel": "{{ apiLevel }}"
    }
    ```

=== "Updated Flex code"
    ```python
    from opentrons import protocol_api

    metadata = {
        "protocolName": "My Protocol",
        "description": "This protocol uses the Flex",
    }

    requirements = {"robotType": "Flex", "apiLevel": "{{ apiLevel }}"}
    ```

## Pipettes and tip-rack load names

Flex uses different types of pipettes and tip racks than OT-2, which have their own load names in the API. If possible, load Flex pipettes of the same capacity or larger than the OT-2 pipettes. See the [list of pipette API load names](pipettes/loading.md#api-load-names) for the valid values of `instrument_name` in Flex protocols. And check [Labware Library](https://labware.opentrons.com) or the Opentrons App for the load names of Flex tip racks.

!!! note
    If you use smaller capacity tips than in the OT-2 protocol, you may need to make further adjustments to avoid running out of tip_rack. Also, the protocol may have more steps and take longer to execute.

This example converts OT-2 code that uses a P300 Single-Channel GEN2 pipette and 300 µL tips to Flex code that uses a Flex 1-Channel 1000 µL pipette and 1000 µL tip_rack.

=== "Original OT-2 code"
    ```python
    def run(protocol: protocol_api.ProtocolContext):
        tip_rack = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
        left_pipette = protocol.load_instrument(
            "p300_single_gen2", "left", tip_racks=[tip_rack]
        )
    ```

=== "Updated Flex code"
    ```python
    def run(protocol: protocol_api.ProtocolContext):
        tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
        left_pipette = protocol.load_instrument(
            "flex_1channel_1000", "left", tip_racks=[tip_rack]
        )
    ```

## Trash container

OT-2 protocols always have a [`fixed_trash`][opentrons.protocol_api.ProtocolContext.fixed_trash] in slot 12. In Flex protocols specifying API version 2.16 or later, you need to [load a trash bin](deck-slots.md#trash-bin-api). Put it in slot A3 to match the physical position of the OT-2 fixed trash:

```python
trash = protocol.load_trash_bin("A3")
```

## Deck slot labels

It's good practice to update numeric labels for [deck slots](deck-slots.md) (which match the labels on an OT-2) to coordinate ones (which match the labels on Flex). This is an optional step, since the two formats are interchangeable.

For example, the code in the previous section changed the location of the tip rack from `1` to `"D1"`.

## Module load names

If your OT-2 protocol uses older generations of the Temperature Module or Thermocycler Module, update the load names you pass to [`load_module()`][opentrons.protocol_api.ProtocolContext.load_module] to ones compatible with Flex:

- `temperature module gen2`
- `thermocycler module gen2` or `thermocyclerModuleV2`

The Heater-Shaker Module only has one generation, `heaterShakerModuleV1`, which is compatible with Flex and OT-2.

The Magnetic Module is not compatible with Flex. For protocols that load `magnetic module`, `magdeck`, or `magnetic module gen2`, you will need to make further modifications to use the [Magnetic Block](modules/magnetic-block.md) and Flex Gripper instead. This will require reworking some of your protocol steps, and you should verify that your new protocol design achieves similar results.

This simplified example, taken from a DNA extraction protocol, shows how using the Flex Gripper and the Magnetic Block can save time. Instead of pipetting an entire plate's worth of liquid from the Heater-Shaker to the Magnetic Module and then engaging the module, the gripper moves the plate to the Magnetic Block in one step.

=== "Original OT-2 code"
    ```python
    hs_mod.set_and_wait_for_shake_speed(2000)
    protocol.delay(minutes=5)
    hs_mod.deactivate_shaker()

    for i in sample_plate.wells():
        # mix, transfer, and blow-out all samples
        pipette.pick_up_tip()
        pipette.aspirate(100,hs_plate[i])
        pipette.dispense(100,hs_plate[i])
        pipette.aspirate(100,hs_plate[i])
        pipette.air_gap(10)
        pipette.dispense(pipette.current_volume,mag_plate[i])
        pipette.aspirate(50,hs_plate[i])
        pipette.air_gap(10)
        pipette.dispense(pipette.current_volume,mag_plate[i])
        pipette.blow_out(mag_plate[i].bottom(0.5))
        pipette.drop_tip()

    mag_mod.engage()

    # perform elution steps
    ```

=== "Updated Flex code"
    ```python
    hs_mod.set_and_wait_for_shake_speed(2000)
    protocol.delay(minutes=5)
    hs_mod.deactivate_shaker()

    # move entire plate
    # no pipetting from Heater-Shaker needed
    hs_mod.open_labware_latch()
    protocol.move_labware(sample_plate, mag_block, use_gripper=True)

    # perform elution steps
    ```
