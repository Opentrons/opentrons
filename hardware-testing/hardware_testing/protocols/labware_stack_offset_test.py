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
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {
                "display_name": "Opentrons 96 200µl PCR",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {
                "display_name": "Nest 96 100µl PCR",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {"display_name": "Nest 96 2ml Deep", "value": "nest_96_wellplate_2ml_deep"},
            {
                "display_name": "Nest 96 200µl Flat",
                "value": "nest_96_wellplate_200ul_flat",
            },
            {
                "display_name": "Corning 12 6.9ml Flat",
                "value": "corning_12_wellplate_6.9ml_flat",
            },
            {
                "display_name": "Corning 24 3.4ml Flat",
                "value": "corning_24_wellplate_3.4ml_flat",
            },
            {
                "display_name": "Corning 384 112µl Flat",
                "value": "corning_384_wellplate_112ul_flat",
            },
            {
                "display_name": "Corning 48 1.6ml Flat",
                "value": "corning_48_wellplate_1.6ml_flat",
            },
            {
                "display_name": "Corning 6 16.8ml Flat",
                "value": "corning_6_wellplate_16.8ml_flat",
            },
            {
                "display_name": "Corning 96 360µl Flat",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {"display_name": "Bio-Rad 384 50µl", "value": "biorad_384_wellplate_50ul"},
            {
                "display_name": "Bio-Rad 96 200µl PCR",
                "value": "biorad_96_wellplate_200ul_pcr",
            },
            {
                "display_name": "ABI MicroAmp 384 40µl",
                "value": "appliedbiosystemsmicroamp_384_wellplate_40ul",
            },
            {
                "display_name": "Nunc 96 1300µl",
                "value": "thermoscientificnunc_96_wellplate_1300ul",
            },
            {
                "display_name": "Nunc 96 2000µl",
                "value": "thermoscientificnunc_96_wellplate_2000ul",
            },
            {
                "display_name": "USA Scientific 96 2.4ml Deep",
                "value": "usascientific_96_wellplate_2.4ml_deep",
            },
        ],
        default="opentrons_96_wellplate_200ul_pcr_full_skirt",
    )
    parameters.add_int(
        variable_name="number_of_labware",
        display_name="Number of Labware on Deck",
        default=2,
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
    parameters.add_bool(
        variable_name="no_gripper",
        display_name="Only Test Stacker",
        default=True,
        description="If True, the protocol will only store and retrieve.",
    )
    parameters.add_float(
        variable_name="offset",
        display_name="Stack Offset",
        default=0.0,
        minimum=-10.0,
        maximum=10.0,
        description="The offset to apply to the Z position of stacked labware.",
    )


def run(protocol: ProtocolContext) -> None:
    """Run the labware stack offset test."""
    labware_type = protocol.params.labware_type  # type: ignore[attr-defined]
    num_of_labware = protocol.params.number_of_labware  # type: ignore[attr-defined]
    stacker_location = protocol.params.stacker_location  # type: ignore[attr-defined]
    labware_location = protocol.params.labware_location  # type: ignore[attr-defined]
    no_gripper = protocol.params.no_gripper  # type: ignore[attr-defined]
    offset = protocol.params.offset  # type: ignore[attr-defined]
    # Load first labware on deck
    initial_labware = protocol.load_labware(
        labware_type, location=labware_location, version=2
    )
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
    if no_gripper:
        if offset > 0:
            stacker.set_stored_labware(
                load_name=labware_type,
                count=num_of_labware,
                stacking_offset_z=offset,
            )
        else:
            stacker.set_stored_labware(load_name=labware_type, count=num_of_labware)
        if not no_gripper:
            # Store all labware into the stacker
            for labware in reversed(list_of_labware):
                protocol.move_labware(labware, stacker, use_gripper=True)
                stacker.store()
            # Retrieve all labware and return them to their original location
            moved_labware: List[Labware] = []
            for labware in list_of_labware:
                stacker.retrieve()
                dest = (
                    labware_location if len(moved_labware) == 0 else moved_labware[-1]
                )
                protocol.move_labware(labware, dest, use_gripper=True)
                moved_labware.append(labware)
        for i in range(10):
            stacker.retrieve()
            stacker.store()
    letter = labware_location[0]
    location_2 = letter + "2"
    deck_locations: List[str | Labware] = [labware_location, location_2]
    if not no_gripper:
        original_order = list(list_of_labware)
        reversed_order = list(reversed(original_order))
        top_labware: Labware = reversed_order[0]
        for i in range(3):
            n = 1  # toggle between 0 and 1
            for i, labware in enumerate(reversed_order):
                if i == 0:
                    protocol.move_labware(labware, deck_locations[n], use_gripper=True)
                else:
                    protocol.move_labware(labware, top_labware, use_gripper=True)
                top_labware = labware
            for i, labware in enumerate(original_order):
                if i == 0:
                    protocol.move_labware(labware, deck_locations[n - 1], use_gripper=True)
                else:
                    protocol.move_labware(labware, top_labware, use_gripper=True)
                top_labware = labware
