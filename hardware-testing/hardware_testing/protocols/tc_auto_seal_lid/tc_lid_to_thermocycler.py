"""Protocol to Test the Stacking and Movement of Tough Auto Seal Lid."""
from typing import List, Union
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    Labware,
)
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
)


metadata = {"protocolName": "Tough Auto Seal Lid to Thermocycler - with x offset change"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="num_of_stack_ups",
        display_name="Number of Stack Ups",
        choices=[
            {"display_name": "1", "value": 1},
            {"display_name": "10", "value": 10},
            {"display_name": "20", "value": 20},
            {"display_name": "30", "value": 30},
            {"display_name": "40", "value": 40},
        ],
        default=20,
    )


def run(protocol: ProtocolContext) -> None:
    """Runs protocol that moves lids and stacks them."""
    # Load Parameters
    iterations = protocol.params.num_of_stack_ups  # type: ignore[attr-defined]
    # Thermocycler
    thermocycler: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2"
    )  # type: ignore[assignment]
    plate_in_cycler = thermocycler.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt"
    )
    thermocycler.open_lid()

    lids: List[Labware] = [
        protocol.load_labware("opentrons_tough_pcr_auto_sealing_lid", "D2")
    ]
    for i in range(4):
        lids.append(lids[-1].load_labware("opentrons_tough_pcr_auto_sealing_lid"))
    lids.reverse()
    top_lid = lids[0]
    second_from_top = lids[1]
    
    slot = 0
    x_offset = [-1, 0, 1]
    for iteration in range(iterations - 1):
        for offset in x_offset:
            OFFSET_GUIDES = {
                "drop": {"x": offset, "y": 0, "z": -1},
            }
            protocol.comment(f"Stack up {iteration}, x offset {offset}")
            # move lid to plate in thermocycler
            protocol.move_labware(top_lid, plate_in_cycler, use_gripper=True, drop_offset=OFFSET_GUIDES["drop"])
            # move lid to deck slot
            thermocycler.close_lid()
            thermocycler.open_lid()
            # move lid back to stack
            protocol.move_labware(top_lid, second_from_top, use_gripper=True)
