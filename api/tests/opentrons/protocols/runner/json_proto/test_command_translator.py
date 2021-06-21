import pytest
from typing import Any, List

from opentrons.types import DeckSlotName, MountType
from opentrons.protocols import models
from opentrons.protocols.runner.json_proto.command_translator import CommandTranslator
from opentrons.protocol_engine import (
    commands as pe_commands,
    DeckSlotLocation,
    PipetteName,
    WellLocation,
    WellOrigin,
)

# todo(mc & mm, 2021-06-17):
#
# There are two big problems with these tests:
#
# 1. I copy-pasted the big JSON protocol fixture from opentrons.file_runner tests.
# 2. The command translation tests use the internal implementation detail
#    _translate_command().
#
# We should fix both of these by:
#
# * Writing a helper function, possibly specific to this test file, to return a minimal
#   JSON protocol with some given commands, given labware, etc., filling in boring
#   stuff like metadata.
# * Making every test here use that helper function with its own hard-coded choice of
#   commands. (So we don't have to pull expected details out of a fixture to assert
#   against.)
# * Consistently testing CommandTranslator as a black box here.


@pytest.fixture
def json_protocol(json_protocol_dict: dict) -> models.JsonProtocol:
    """Get a parsed JSON protocol model fixture."""
    return models.JsonProtocol.parse_obj(json_protocol_dict)


@pytest.fixture
def json_protocol_dict(minimal_labware_def: dict, minimal_labware_def2: dict) -> dict:
    """Get a JSON protocol dictionary fixture."""
    return {
        "schemaVersion": 3,
        "metadata": {},
        "robot": {"model": "OT-2 Standard"},
        "pipettes": {"leftPipetteId": {"mount": "left", "name": "p300_single"}},
        "labware": {
            "trashId": {
                "slot": "12",
                "displayName": "Trash",
                "definitionId": "opentrons/opentrons_1_trash_1100ml_fixed/1",
            },
            "tiprack1Id": {
                "slot": "1",
                "displayName": "Opentrons 96 Tip Rack 300 µL",
                "definitionId": "opentrons/opentrons_96_tiprack_300ul/1",
            },
            "wellplate1Id": {
                "slot": "10",
                "displayName": "Corning 96 Well Plate 360 µL Flat",
                "definitionId": "opentrons/corning_96_wellplate_360ul_flat/1",
            },
        },
        "labwareDefinitions": {
            "opentrons/opentrons_1_trash_1100ml_fixed/1": minimal_labware_def,
            "opentrons/opentrons_96_tiprack_300ul/1": minimal_labware_def,
            "opentrons/corning_96_wellplate_360ul_flat/1": minimal_labware_def2,
        },
        "commands": [
            {
                "command": "pickUpTip",
                "params": {
                    "pipette": "leftPipetteId",
                    "labware": "tiprack1Id",
                    "well": "A1",
                },
            },
            {
                "command": "aspirate",
                "params": {
                    "pipette": "leftPipetteId",
                    "volume": 51,
                    "labware": "wellplate1Id",
                    "well": "B1",
                    "offsetFromBottomMm": 10,
                    "flowRate": 10,
                },
            },
            {
                "command": "dispense",
                "params": {
                    "pipette": "leftPipetteId",
                    "volume": 50,
                    "labware": "wellplate1Id",
                    "well": "H1",
                    "offsetFromBottomMm": 1,
                    "flowRate": 50,
                },
            },
        ],
    }


@pytest.fixture
def subject() -> CommandTranslator:
    return CommandTranslator()


def _assert_appear_in_order(elements: List[Any], source: List[Any]) -> None:
    """
    Assert all elements appear in source, in the given order relative to each other.

    Example:

        _assert_appear_in_order(
            elements=["a", "c"]
            source=["a", "b", "c", "d"]
        )  # Pass.

        _assert_appear_in_order(
            elements=["c", "a"]
            source=["a", "b", "c", "d"]
        )  # Fail.
    """
    element_indexes = [source.index(element) for element in elements]
    assert sorted(element_indexes) == element_indexes


def test_labware(
    subject: CommandTranslator,
    json_protocol: models.JsonProtocol,
    minimal_labware_def: dict,
    minimal_labware_def2: dict,
) -> None:
    result = subject.translate(json_protocol)

    expected_add_definition_request_1 = pe_commands.AddLabwareDefinitionRequest(
        data=pe_commands.AddLabwareDefinitionData(
            definition=models.LabwareDefinition.parse_obj(minimal_labware_def)
        )
    )
    expected_load_request_1 = pe_commands.LoadLabwareRequest(
        data=pe_commands.LoadLabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            loadName=minimal_labware_def["parameters"]["loadName"],
            namespace=minimal_labware_def["namespace"],
            version=minimal_labware_def["version"],
            labwareId="tiprack1Id",
        )
    )

    expected_add_definition_request_2 = pe_commands.AddLabwareDefinitionRequest(
        data=pe_commands.AddLabwareDefinitionData(
            definition=models.LabwareDefinition.parse_obj(minimal_labware_def2)
        )
    )
    expected_load_request_2 = pe_commands.LoadLabwareRequest(
        data=pe_commands.LoadLabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_10),
            loadName=minimal_labware_def2["parameters"]["loadName"],
            namespace=minimal_labware_def2["namespace"],
            version=minimal_labware_def2["version"],
            labwareId="wellplate1Id",
        )
    )

    _assert_appear_in_order(
        elements=[expected_add_definition_request_1, expected_load_request_1],
        source=result,
    )

    _assert_appear_in_order(
        elements=[expected_add_definition_request_2, expected_load_request_2],
        source=result,
    )


def test_pipettes(
    subject: CommandTranslator,
    json_protocol: models.JsonProtocol,
) -> None:
    result = subject.translate(json_protocol)

    expected_request = pe_commands.LoadPipetteRequest(
        data=pe_commands.LoadPipetteData(
            pipetteName=PipetteName.P300_SINGLE,
            mount=MountType.LEFT,
            pipetteId="leftPipetteId",
        )
    )

    assert expected_request in result


def test_aspirate(
    subject: CommandTranslator, aspirate_command: models.json_protocol.LiquidCommand
) -> None:
    """It should translate a JSON aspirate command to a Protocol Engine
    aspirate request."""
    request = subject._translate_command(aspirate_command)

    assert request == pe_commands.AspirateRequest(
        data=pe_commands.AspirateData(
            pipetteId=aspirate_command.params.pipette,
            labwareId=aspirate_command.params.labware,
            wellName=aspirate_command.params.well,
            volume=aspirate_command.params.volume,
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=(0, 0, aspirate_command.params.offsetFromBottomMm),
            ),
        )
    )


def test_dispense(
    subject: CommandTranslator, dispense_command: models.json_protocol.LiquidCommand
) -> None:
    """It should translate a JSON dispense command to a Protocol Engine
    dispense request."""
    request = subject._translate_command(dispense_command)

    assert request == pe_commands.DispenseRequest(
        data=pe_commands.DispenseData(
            pipetteId=dispense_command.params.pipette,
            labwareId=dispense_command.params.labware,
            wellName=dispense_command.params.well,
            volume=dispense_command.params.volume,
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=(0, 0, dispense_command.params.offsetFromBottomMm),
            ),
        )
    )


def test_drop_tip(
    subject: CommandTranslator,
    drop_tip_command: models.json_protocol.PickUpDropTipCommand,
) -> None:
    """It should translate a JSON drop tip command to a Protocol Engine
    drop tip request."""
    request = subject._translate_command(drop_tip_command)

    assert request == pe_commands.DropTipRequest(
        data=pe_commands.DropTipData(
            pipetteId=drop_tip_command.params.pipette,
            labwareId=drop_tip_command.params.labware,
            wellName=drop_tip_command.params.well,
        )
    )


def test_pick_up_tip(
    subject, pick_up_command: models.json_protocol.PickUpDropTipCommand
) -> None:
    """
    It should translate a JSON pick up tip command to a Protocol Engine
    PickUpTip request.
    """
    request = subject._translate_command(pick_up_command)

    assert request == pe_commands.PickUpTipRequest(
        data=pe_commands.PickUpTipData(
            pipetteId=pick_up_command.params.pipette,
            labwareId=pick_up_command.params.labware,
            wellName=pick_up_command.params.well,
        )
    )
