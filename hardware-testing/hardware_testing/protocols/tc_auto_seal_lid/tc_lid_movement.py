"""Protocol to Test the Stacking and Movement of Tough Auto Seal Lid."""
from typing import List, Union
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    Labware,
)
from opentrons.protocol_api.module_contexts import ThermocyclerContext


metadata = {"protocolName": "Tough Auto Seal Lid Stacking Test"}
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
    stack_locations = ["C2", "D2"]
    slot = 0
    for iteration in range(iterations - 1):
        protocol.comment(f"Stack up {iteration}")
        locations_for_lid = ["D1", "C1", "C3", "B2", "B3"]
        loc = 0
        for lid in lids:
            # move lid to plate in thermocycler
            protocol.move_labware(lid, plate_in_cycler, use_gripper=True)
            # move lid to deck slot
            location_to_move: Union[int, str] = locations_for_lid[loc]
            protocol.move_labware(lid, location_to_move, use_gripper=True)
            # move lid to lid stack
            if loc == 0:
                protocol.move_labware(lid, stack_locations[slot], use_gripper=True)
                prev_moved_lid: Labware = lid
            else:
                protocol.move_labware(lid, prev_moved_lid, use_gripper=True)
                prev_moved_lid = lid
            loc += 1
        slot = (slot + 1) % 2  # Switch between 0 and 1 to rotate stack locations

        # reverse lid list to restart stacking exercise
        lids.reverse()
