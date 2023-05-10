"""Smoke Test 6.2.0"""

from opentrons import protocol_api

metadata = {
    "protocolName": "🛠 Logo-Modules-CustomLabware 🛠",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("Description of the protocol that is longish \n has \n returns and \n emoji 😊 ⬆️ "),
    "apiLevel": "2.13",
}

CUSTOM = True


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""

    # deck positions
    tips_300ul_position = "1"
    dye_source_position = "2"
    logo_position = "3"
    temperature_position = "4"
    tips_20ul_position = "5"
    custom_lw_position = "6"
    magnetic_position = "9"
    # Thermocycler has a default position that covers Slots 7, 8, 10, and 11.
    # This is the only valid location for the Thermocycler on the OT-2 deck.
    # This position is a default parameter when declaring the TC so you do not need to specify.

    # 300ul tips
    tips_300ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location=tips_300ul_position,
            label="300ul tips",
        )
    ]

    # 20ul tips
    tips_20ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_20ul",
            location=tips_20ul_position,
            label="20ul tips",
        )
    ]

    # pipettes
    pipette_right = ctx.load_instrument(instrument_name="p20_single_gen2", mount="right", tip_racks=tips_20ul)

    pipette_left = ctx.load_instrument(instrument_name="p300_multi_gen2", mount="left", tip_racks=tips_300ul)

    # modules
    magnetic_module = ctx.load_module("magnetic module gen2", magnetic_position)
    temperature_module = ctx.load_module("temperature module", temperature_position)
    thermocycler_module = ctx.load_module("thermocycler module gen2")

    # module labware
    temp_plate = temperature_module.load_labware(
        "opentrons_96_aluminumblock_nest_wellplate_100ul",
        label="Temperature-Controlled plate",
    )
    mag_plate = magnetic_module.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tc_plate = thermocycler_module.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")

    custom_labware = None

    if CUSTOM:
        # load the custom labware
        custom_labware = ctx.load_labware(
            "cpx_4_tuberack_100ul",
            custom_lw_position,
            "4 tubes",
            "custom_beta",
        )

    # create plates and pattern list
    logo_destination_plate = ctx.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        location=logo_position,
        label="logo destination",
    )

    dye_container = ctx.load_labware(
        load_name="nest_12_reservoir_15ml",
        location=dye_source_position,
        label="dye container",
    )

    dye1_source = dye_container.wells_by_name()["A1"]
    dye2_source = dye_container.wells_by_name()["A2"]

    # Well Location set-up
    dye1_destination_wells = [
        logo_destination_plate.wells_by_name()["A5"],
        logo_destination_plate.wells_by_name()["A6"],
        logo_destination_plate.wells_by_name()["A8"],
        logo_destination_plate.wells_by_name()["A9"],
        logo_destination_plate.wells_by_name()["B4"],
        logo_destination_plate.wells_by_name()["B10"],
        logo_destination_plate.wells_by_name()["C3"],
        logo_destination_plate.wells_by_name()["C11"],
        logo_destination_plate.wells_by_name()["D3"],
        logo_destination_plate.wells_by_name()["D11"],
        logo_destination_plate.wells_by_name()["E3"],
        logo_destination_plate.wells_by_name()["E11"],
        logo_destination_plate.wells_by_name()["F3"],
        logo_destination_plate.wells_by_name()["F11"],
        logo_destination_plate.wells_by_name()["G4"],
        logo_destination_plate.wells_by_name()["G10"],
        logo_destination_plate.wells_by_name()["H5"],
        logo_destination_plate.wells_by_name()["H6"],
        logo_destination_plate.wells_by_name()["H7"],
        logo_destination_plate.wells_by_name()["H8"],
        logo_destination_plate.wells_by_name()["H9"],
    ]

    dye2_destination_wells = [
        logo_destination_plate.wells_by_name()["C7"],
        logo_destination_plate.wells_by_name()["D6"],
        logo_destination_plate.wells_by_name()["D7"],
        logo_destination_plate.wells_by_name()["D8"],
        logo_destination_plate.wells_by_name()["E5"],
        logo_destination_plate.wells_by_name()["E6"],
        logo_destination_plate.wells_by_name()["E7"],
        logo_destination_plate.wells_by_name()["E8"],
        logo_destination_plate.wells_by_name()["E9"],
        logo_destination_plate.wells_by_name()["F5"],
        logo_destination_plate.wells_by_name()["F6"],
        logo_destination_plate.wells_by_name()["F7"],
        logo_destination_plate.wells_by_name()["F8"],
        logo_destination_plate.wells_by_name()["F9"],
        logo_destination_plate.wells_by_name()["G6"],
        logo_destination_plate.wells_by_name()["G7"],
        logo_destination_plate.wells_by_name()["G8"],
    ]

    # Don't use dye1 to shorten protocol
    # # Distribute dye 1
    # pipette_right.pick_up_tip()
    # pipette_right.distribute(
    #     volume=18,
    #     source=dye1_source,
    #     dest=dye1_destination_wells,
    #     new_tip="never",
    # )
    # Drop the tip used for dye 1
    # pipette_right.drop_tip()

    # Distribute dye 2
    pipette_right.pick_up_tip()
    pipette_right.distribute(
        volume=18,
        source=dye2_source,
        dest=dye2_destination_wells,
        new_tip="never",
    )
    pipette_right.drop_tip()

    # Play with the modules
    temperature_module.await_temperature(25)

    for height in range(0, 9):  # 0-8
        magnetic_module.engage(height=height)
        ctx.delay(0.3)
    for height in range(7, -1, -1):  # 7-0
        magnetic_module.engage(height=height)
        ctx.delay(0.3)
    magnetic_module.disengage()

    thermocycler_module.open_lid()
    thermocycler_module.close_lid()
    thermocycler_module.set_lid_temperature(38)  # 37 is the minimum
    thermocycler_module.set_block_temperature(temperature=28, hold_time_seconds=5)
    thermocycler_module.deactivate_block()
    thermocycler_module.deactivate_lid()
    thermocycler_module.open_lid()

    # dispense to modules
    # to magnetic module
    pipette_right.pick_up_tip()
    pipette_right.aspirate(volume=18, location=dye2_source)
    pipette_right.dispense(volume=18, location=mag_plate.well(0))
    pipette_right.drop_tip()

    # to temperature module
    pipette_right.pick_up_tip()
    pipette_right.aspirate(volume=15, location=dye2_source)
    pipette_right.dispense(volume=15, location=temp_plate.well(0))
    pipette_right.drop_tip()

    if CUSTOM:
        # to custom labware
        # This labware does not EXIST!!!! so...
        # Use tip rack lid to catch dye on wet run
        pipette_right.pick_up_tip()
        pipette_right.aspirate(volume=10, location=dye2_source, rate=2.0)
        pipette_right.dispense(volume=10, location=custom_labware.well(3), rate=1.5)
        pipette_right.drop_tip()

    # to thermocycler
    pipette_left.pick_up_tip()  # should get from A1
    pipette_left.aspirate(volume=75, location=dye2_source)
    pipette_left.dispense(volume=60, location=tc_plate.wells_by_name()["A6"])
    pipette_left.drop_tip()
