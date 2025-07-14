"""Test labware definition ."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api.module_contexts import HeaterShakerContext


metadata = {
    "protocolName": "labware definition checker ",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


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
            {
                "display_name": "ibidi lid",
                "value": "ibidi_96_square_well_plate_300ul_lid",
            },
        ],
        default="ibidi_96_square_well_plate_300ul_lid",
    )
    parameters.add_bool(
        variable_name="heater_shaker",
        display_name="Heater Shaker Use",
        description="If true, heater shaker is used.",
        default=False,
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    labware_type = protocol.params.labware_type  # type: ignore[attr-defined]
    heater_shaker_enabled = protocol.params.heater_shaker  # type: ignore[attr-defined]

    # Lid loading
    if labware_type == "ibidi_96_square_well_plate_300ul_lid":
        protocol.load_lid_stack(labware_type, "C3", 1)
        labware = protocol.load_labware("ibidi_96_square_well_plate_300ul", "D3")
        for _ in range(3):
            protocol.move_lid("C3", labware, use_gripper=True)
            protocol.move_lid(labware, "C3", use_gripper=True)
    elif labware_type == "corning_96_wellplate_360ul_lid":
        protocol.load_lid_stack(labware_type, "C3", 1)
        labware = protocol.load_labware("corning_96_wellplate_360ul_flat", "D3")
        for _ in range(3):
            protocol.move_lid("C3", labware, use_gripper=True)
            protocol.move_lid(labware, "C3", use_gripper=True)
    else:
        labware = protocol.load_labware(labware_type, "D3")
        # load pipette and tip rack
        tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
        pipette = protocol.load_instrument(
            "flex_8channel_1000", "left", tip_racks=[tip_rack]
        )

        # pick up tip
        pipette.pick_up_tip()

        # move tip to positions
        pipette.move_to(labware["A6"].top(z=1))
        protocol.pause("Check top height with shim")
        pipette.move_to(labware["A6"].bottom(z=1))
        protocol.pause("Check bottom height with shim")

        # Optional heater shaker use
        if heater_shaker_enabled:
            hsh: HeaterShakerContext = protocol.load_module(
                "heaterShakerModuleV1", "D1"
            )  # type: ignore[assignment]
            hsh.close_labware_latch()
            adapter = hsh.load_adapter("opentrons_universal_flat_adapter")
            hsh.open_labware_latch()
            protocol.move_labware(labware, adapter, use_gripper=True)
            hsh.close_labware_latch()

            pipette.move_to(labware["A6"].top(z=1))
            protocol.pause("Check top height with shim")

        pipette.return_tip()
