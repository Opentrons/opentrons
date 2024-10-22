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


metadata = {"protocolName": "Tough Auto Seal Lid to Thermocycler - with z offset change"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="num_of_stack_ups",
        display_name="Number of Stack Ups",
        choices=[
            {"display_name": "1", "value": 1},
            {"display_name": "5", "value": 5},
            {"display_name": "20", "value": 20},
            {"display_name": "30", "value": 30},
            {"display_name": "40", "value": 40},
        ],
        default=20,
    )
    parameters.add_int(
        variable_name="z_offset",
        display_name="Z Offset",
        choices=[
            {"display_name": "-1", "value": -1},
            {"display_name": "-0.5", "value": -0.5},
            {"display_name": "0.5", "value": 0.5},
            {"display_name": "1", "value": 1},
            {"display_name": "1.5", "value": 1.5},
            {"display_name": "2", "value": 2.5},
            {"display_name": "2.5", "value": 2.5},
            {"display_name": "3", "value": 3},
        ],
        default=-1,
    )


def run(protocol: ProtocolContext) -> None:
    """Runs protocol that moves lids and stacks them."""
    # Load Parameters
    iterations = protocol.params.num_of_stack_ups  # type: ignore[attr-defined]
    z_offset = protocol.params.z_offset # type: ignore[attr-defined]
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
        loc = 0
        for lid in lids:
            protocol.comment(f"Stack up {iteration}")
            # move lid to plate in thermocycler
            protocol.move_labware(lid, plate_in_cycler, use_gripper=True)
            # move lid to deck slot
            if loc == 0:
                protocol.move_labware(lid, stack_locations[slot], use_gripper=True, drop_offset = {"x": 0, "y":0, "z": z_offset})
                prev_moved_lid: Labware = lid
            else:
                protocol.move_labware(lid, prev_moved_lid, use_gripper=True)
                prev_moved_lid = lid
            loc += 1
        slot = (slot + 1) % 2  # Switch between 0 and 1 to rotate stack locations
        lids.reverse()