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
                "display_name": "Nest 8 Reservoir 22 mL",
                "value": "nest_8_reservoir_22ml",
            },
            {
                "display_name": "Nest 12 Reservoir 22 mL",
                "value": "nest_12_reservoir_22ml",
            },
            {
                "display_name": "Nest 24 Reservoir 10.4 mL", 
                "value": "nest_24_reservoir_10.4ml"
            },
        ],
        default="nest_8_reservoir_22ml"
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
    if labware_type == "corning_96_wellplate_360ul_lid":
        protocol.load_lid_stack(labware_type, "C3", 1)
        labware = protocol.load_labware("ibidi_96_square_well_plate_300ul", "D3")
        for _ in range(3):
            protocol.move_lid("C3", labware, use_gripper=True)
            protocol.move_lid(labware, "C3", use_gripper=True)
    else:
        labware = protocol.load_labware(labware_type, "D3")
        # load pipette and tip rack
        tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D2")
        pipette = protocol.load_instrument(
            "flex_1channel_50", "left", tip_racks=[tip_rack]
        )

        # pick up tip
        pipette.pick_up_tip()

        # move tip to positions
        pipette.move_to(labware["A1"].top(z=1))
        protocol.pause("Check top height with shim")
        pipette.move_to(labware["A1"].bottom(z=1))
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

            pipette.move_to(labware["A1"].top(z=1))
            protocol.pause("Check top height with shim")

        pipette.return_tip()
