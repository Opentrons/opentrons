from typing import List
from opentrons import protocol_api
from opentrons.protocol_api.labware import Labware, Well


PIPETTE_MOUNT = "right"
PIPETTE_NAME = "p20_single_gen2"
TIPRACK_SLOT = "11"
TIPRACK_LOADNAME = "opentrons_96_tiprack_20ul"

metadata = {
    "protocolName": "Two Custom Labware",
    "author": "Opentrons <engineering@opentrons.com>",
    "source": "CPX Test",
    "apiLevel": "2.12",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    tiprack = ctx.load_labware(TIPRACK_LOADNAME, TIPRACK_SLOT)
    pipette = ctx.load_instrument(PIPETTE_NAME, PIPETTE_MOUNT, tip_racks=[tiprack])

    dye_container: Labware = ctx.load_labware(
        load_name="agilent_1_reservoir_290ml",
        location="5",
        label="dye container",
    )

    four_tubes: Labware = ctx.load_labware(
        "cpx_4_tuberack_100ul",
        "9",
        "4 tubes",
        "custom_beta",
    )

    six_tubes: Labware = ctx.load_labware(
        "cpx_6_tuberack_100ul",
        "3",
        "6 tubes",
        "custom_beta",
    )

    four_tubes_destination_wells: List[Well] = [
        four_tubes.wells_by_name()["A1"],
        four_tubes.wells_by_name()["A2"],
        four_tubes.wells_by_name()["B1"],
        four_tubes.wells_by_name()["B2"],
    ]

    six_tubes_destination_wells: List[Well] = [
        six_tubes.wells_by_name()["A1"],
        six_tubes.wells_by_name()["A2"],
        six_tubes.wells_by_name()["A3"],
        six_tubes.wells_by_name()["B1"],
        six_tubes.wells_by_name()["B2"],
        six_tubes.wells_by_name()["B3"],
    ]

    pipette.pick_up_tip()
    pipette.distribute(
        volume=10,
        source=dye_container.wells_by_name()["A1"],
        dest=four_tubes_destination_wells,
        new_tip="never",
    )

    pipette.drop_tip()

    pipette.pick_up_tip()
    pipette.distribute(
        volume=10,
        source=dye_container.wells_by_name()["A1"],
        dest=six_tubes_destination_wells,
        new_tip="never",
    )
