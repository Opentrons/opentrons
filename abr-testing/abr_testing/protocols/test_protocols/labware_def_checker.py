"""Test labware definition ."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    SINGLE,
    ALL,
    Well,
)
from typing import List, Dict

metadata = {
    "protocolName": "labware definition checker ",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}

positions = ["A1", "H1", "A12", "H12"]


def move_to_corners(pipette, labware, protocol):
    for pos in positions:
        pipette.move_to(labware[pos].top(z=1))  # + 1mm protocol.pause
        protocol.pause("check the top height with shim")
        pipette.move_to(labware[pos].bottom(z=1))
        protocol.pause("check the bottm height with shim")


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        description="Type of Labware",
        choices=[
            {
                "display_name": "Axygen 500 ul Well Plate",
                "value": "axygen_96_wellplate_500ul",
            },
            {
                "display_name": "Corn96Wellplate 360 ul Lid",
                "value": "corning_96_wellplate_360ul_lid",
            },
            {"display_name": "SMC384well Read Plate", "value": "smc_384_read_plate"},
            {
                "display_name": "ibidi96 SqrWellFltBtmPlt300µL",
                "value": "ibidi_96_square_well_plate_300ul",
            },
        ],
        default="axygen_96_wellplate_500ul",
    )
    parameters.add_bool(
        variable_name="heater_shaker",
        display_name="Heater Shaker Use",
        description="If true, heater shaker is used.",
        default=False,
    )


def run(protocol: ProtocolContext) -> None:
    labware_type = protocol.params.labware_type  # type: ignore[attr-defined]
    heater_shaker = protocol.params.heater_shaker  # type: ignore[attr-defined]

    # first load labware
    labware = protocol.load_labware(labware_type, "D3")

    # load pipette and tip rack
    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
    pipette = protocol.load_instrument(
        "flex_8channel_1000", "left", tip_racks=[tip_rack]
    )

    # pick up the tip
    pipette.pick_up_tip()

    # tip movement
    move_to_corners(pipette, labware, protocol)

    # if heater shaker, move to heatershaker and repeat process
    if heater_shaker:
        heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
        heater_shaker.close_labware_latch()
        heater_shaker_adapter = heater_shaker.load_adapter(
            "opentrons_universal_flat_adapter"
        )
        heater_shaker.open_labware_latch()
        protocol.move_labware(labware, heater_shaker_adapter, use_gripper=True)
        heater_shaker.close_labware_latch()
        # repeat tip movement
        move_to_corners(pipette, labware, protocol)
        
