requirements = {
    "robotType": "Flex",
    "apiLevel": "2.29"
}

metadata = {
    "protocolName": "Volume modes: Test volume splits in transfer with liquid class (20ul tips)",
}


def run(protocol_context):
    trash = protocol_context.load_trash_bin("A3")
    tiprack = protocol_context.load_labware(
        "opentrons_flex_96_tiprack_20ul", "D1"
    )
    pipette_50 = protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = protocol_context.get_liquid_class("water")

    pipette_50.pick_up_tip()
    # Make the pipette use low volume mode
    pipette_50.configure_for_volume(3)

    # Transfer 14uL of water from source to destination.
    # The transfer method should ignore the above volume mode and instead, understand that 14uL of liquid
    # can be transferred in a single Source->Destination move.
    # So this transfer should have only two (aspirate-dispense) actions: one for each well.
    pipette_50.transfer_with_liquid_class(
        liquid_class=water,
        volume=14,
        source=nest_plate.rows()[0][:2],
        dest=arma_plate.rows()[0][:2],
        new_tip="never",
        trash_location=trash,
    )

    # Similar to above, the transfer method should ignore the above volume mode and understand that
    # max volume for a 20uL tip is 20uL. So this transfer should split each volume into two transfers of 10.5uL each.
    pipette_50.transfer_with_liquid_class(
        liquid_class=water,
        volume=21,
        source=nest_plate.rows()[0][:2],
        dest=arma_plate.rows()[0][:2],
        new_tip="never",
        trash_location=trash,
    )

    # The volume mode should be reset to low volume after the transfers.
    # This is pipette max volume and does not take tip volume into consideration. Update this if/when attached tip also determines pipette max volume.
    assert pipette_50.max_volume == 30

    # Make the pipette use default volume mode
    pipette_50.configure_for_volume(20)

    # It should configure the pipette for low volume only during the transfer
    pipette_50.transfer_with_liquid_class(
        liquid_class=water,
        volume=4,
        source=nest_plate.rows()[0][:2],
        dest=arma_plate.rows()[0][:2],
        new_tip="never",
        trash_location=trash,
    )

    # The volume mode should be reset to default after the transfer.
    # This is pipette max volume and does not take tip volume into consideration. Update this if/when attached tip also determines pipette max volume.
    assert pipette_50.max_volume == 50
    pipette_50.drop_tip()
