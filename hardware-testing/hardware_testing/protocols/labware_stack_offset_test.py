"""Test Stacking Offsets of Labware on Deck and in Stacker."""
from opentrons.protocol_api import ProtocolContext, ParameterContext, Labware
from opentrons.protocol_api.module_contexts import FlexStackerContext
from typing import List

metadata = {
    "protocolName": "Labware Stack Offset Test",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    from hardware_testing import protocols

    protocols.create_labware_parameters(parameters)
    parameters.add_int(
        variable_name="number_of_labware",
        display_name="Number of Labware on Deck",
        default=1,
        minimum=1,
        maximum=100,
    )
    parameters.add_str(
        variable_name="stacker_location",
        display_name="Stacker Location",
        default="D4",
        choices=[
            {"display_name": "D4", "value": "D4"},
            {"display_name": "C4", "value": "C4"},
            {"display_name": "B4", "value": "B4"},
            {"display_name": "A4", "value": "A4"},
        ],
    )
    parameters.add_str(
        variable_name="labware_location",
        display_name="Labware Location",
        default="D1",
        choices=[
            {"display_name": "D1", "value": "D1"},
            {"display_name": "C1", "value": "C1"},
            {"display_name": "B1", "value": "B1"},
            {"display_name": "A1", "value": "A1"},
        ],
    )


def run(protocol: ProtocolContext) -> None:
    """Run the labware stack offset test."""
    labware_type = protocol.params.labware_type  # type: ignore[attr-defined]
    num_of_labware = protocol.params.number_of_labware  # type: ignore[attr-defined]
    stacker_location = protocol.params.stacker_location  # type: ignore[attr-defined]
    labware_location = protocol.params.labware_location  # type: ignore[attr-defined]
    # Load first labware on deck
    initial_labware = protocol.load_labware(labware_type, location=labware_location)
    list_of_labware: List[Labware] = [initial_labware]

    # Load additional labware stacked on top
    if num_of_labware > 1:
        for _ in range(num_of_labware - 1):
            next_labware = list_of_labware[-1].load_labware(labware_type)
            list_of_labware.append(next_labware)

    # Load stacker module
    stacker: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", stacker_location
    )  # type: ignore[assignment]
    stacker.set_stored_labware(load_name=labware_type, count=0)
    # Store all labware into the stacker
    for labware in list_of_labware:
        protocol.move_labware(labware, stacker, use_gripper=True)
        stacker.store()

    # Retrieve all labware and return them to their original location
    moved_labware: List[Labware] = []
    for labware in list_of_labware:
        stacker.retrieve()
        dest = labware_location if len(moved_labware) == 0 else moved_labware[-1]
        protocol.move_labware(labware, dest, use_gripper=True)
        moved_labware.append(labware)
