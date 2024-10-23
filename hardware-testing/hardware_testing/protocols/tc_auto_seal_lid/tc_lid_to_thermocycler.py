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


metadata = {"protocolName": "Tough Auto Seal Lid to Thermocycler with offset params"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="num_of_stack_ups",
        display_name="Number of Stack Ups",
        choices=[
            {"display_name": "1", "value": 2},
            {"display_name": "5", "value": 5},
            {"display_name": "20", "value": 20},
            {"display_name": "30", "value": 30},
            {"display_name": "40", "value": 40},
        ],
        default=20,
    )
    parameters.add_int(
        variable_name="max_offset",
        display_name="Max Offset (+)",
        minimum=0,
        maximum=10,
        default=0,
    )
    parameters.add_int(
        variable_name="min_offset",
        display_name="Max Offset (-)",
        minimum=0,
        maximum=10,
        default=0,
    )
    parameters.add_str(
        variable_name="axis_to_test",
        display_name="Axis to Test",
        choices=[
            {"display_name": "X", "value": "x"},
            {"display_name": "Y", "value": "y"},
            {"display_name": "Z", "value": "z"},
        ],
        default="x",
    )


def run(protocol: ProtocolContext) -> None:
    """Runs protocol that moves lids and stacks them."""
    # Load Parameters
    iterations = protocol.params.num_of_stack_ups  # type: ignore[attr-defined]
    axis_for_offset = protocol.params.axis_to_test  # type: ignore[attr-defined]
    min_offset = protocol.params.min_offset  # type: ignore[attr-defined]
    neg_min_offset = int(min_offset) * -1
    max_offset = protocol.params.max_offset  # type: ignore[attr-defined]
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
    offsets = [neg_min_offset, neg_min_offset + 1, max_offset - 1, max_offset]

    for iteration in range(iterations - 1):
        for offset in offsets:
            offset_dict = {
                "x": {"x": offset, "y": 0, "z": 0},
                "y": {"x": 0, "y": offset, "z": 0},
                "z": {"x": 0, "y": 0, "z": offset},
            }
            offset_to_use = offset_dict[axis_for_offset]
            loc = 0
            for lid in lids:
                protocol.comment(
                    f"Stack up {iteration}. Offset {offset_to_use}, Lid # {loc+1}"
                )
                # move lid to plate in thermocycler
                protocol.move_labware(
                    lid, plate_in_cycler, use_gripper=True, drop_offset=offset_to_use
                )
                # move lid to deck slot
                if loc == 0:
                    protocol.move_labware(lid, stack_locations[slot], use_gripper=True)
                    prev_moved_lid: Labware = lid
                else:
                    protocol.move_labware(lid, prev_moved_lid, use_gripper=True)
                    prev_moved_lid = lid
                loc += 1
            slot = (slot + 1) % 2  # Switch between 0 and 1 to rotate stack locations
            lids.reverse()
