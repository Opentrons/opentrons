# flake8: noqa

from opentrons import protocol_api
from opentrons import types
import random

metadata = {
    "protocolName": "96CH_LV_FILL_LIQUID_RevA1.3",
    "author": "Andy Hu <andy.hu@opentrons.com>",
}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Add test parameters."""
    parameters.add_int(
        display_name="volume of dipensation",
        variable_name="dispension_volume",
        default=149,
        minimum=1,
        maximum=200,
        description="Set the liquid volume",
    )


def run(protocol: protocol_api.ProtocolContext):

    volume = protocol.params.dispension_volume  # type: ignore [attr-defined]

    # DECK SETUP AND LABWARE
    pcr_plate1 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D1"
    )
    pcr_plate2 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D2"
    )
    pcr_plate3 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D3"
    )
    pcr_plate4 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    pcr_plate5 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C3"
    )
    pcrs = [pcr_plate1, pcr_plate2, pcr_plate3, pcr_plate4, pcr_plate5]

    reservoir = protocol.load_labware("nest_1_reservoir_195ml", "C1")

    tiprack_1000 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        location="B1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )

    trash_labware = protocol.load_trash_bin("A3")

    # LOAD PIPETTES
    p1000 = protocol.load_instrument("flex_96channel_1000", "left")
    p1000.trash_container = trash_labware
    # COMMANDS

    p1000.pick_up_tip(tiprack_1000.wells_by_name()["A1"])

    for pcr in pcrs:
        p1000.aspirate(volume, reservoir.wells_by_name()["A1"])
        p1000.dispense(volume, pcr.wells_by_name()["A1"])
        p1000.blow_out()

    p1000.return_tip()
