import pytest

from opentrons import protocol_engine

from opentrons.protocol_engine import WellLocation, WellOrigin
from opentrons.protocol_engine.commands import (
    AddLabwareDefinitionRequest,
    LoadLabwareRequest,
    AspirateRequest,
    DispenseRequest,
    PickUpTipRequest,
    DropTipRequest,
)

# To do: Redundant imports
from opentrons.protocols.models import json_protocol as models
from opentrons.protocols.models import LabwareDefinition


from opentrons.protocols.runner.json_proto.command_translator import (
    CommandTranslator
)


# Fix before merge: This gross-ass copy-paste


from opentrons.protocols.models import JsonProtocol


@pytest.fixture
def json_protocol(json_protocol_dict: dict) -> JsonProtocol:
    """Get a parsed JSON protocol model fixture."""
    return JsonProtocol.parse_obj(json_protocol_dict)


@pytest.fixture
def json_protocol_dict(
    minimal_labware_def: dict,
    minimal_labware_def2: dict
) -> dict:
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


# Fix before merge: Fix subject._translate_command to use a fixture
# and go through top-level translate(), or something like that


@pytest.fixture
def subject() -> CommandTranslator:
    return CommandTranslator()


def test_translates_labware_commands(
    subject: CommandTranslator,
    json_protocol: JsonProtocol,
    minimal_labware_def: dict,  # To do: Uhhh something
    minimal_labware_def2: dict,
) -> None:
    result = subject.translate(json_protocol)

    # To do: More correct ordering constraints
    assert AddLabwareDefinitionRequest(
        definition=LabwareDefinition.parse_obj(minimal_labware_def)
    ) in result
    assert AddLabwareDefinitionRequest(
        definition=LabwareDefinition.parse_obj(minimal_labware_def2)
    ) in result

    assert LoadLabwareRequest(
        location=protocol_engine.DeckSlotLocation(slot=1),
        loadName=minimal_labware_def["parameters"]["loadName"],
        namespace=minimal_labware_def["namespace"],
        version=minimal_labware_def["version"],
        labwareId="tiprack1Id"
    ) in result

    assert LoadLabwareRequest(
        location=protocol_engine.DeckSlotLocation(slot=10),
        loadName=minimal_labware_def2["parameters"]["loadName"],
        namespace=minimal_labware_def2["namespace"],
        version=minimal_labware_def2["version"],
        labwareId="wellplate1Id"
    ) in result


def test_aspirate(
        subject: CommandTranslator, aspirate_command: models.LiquidCommand
) -> None:
    """It should translate a JSON aspirate command to a Protocol Engine
     aspirate request."""
    request = subject._translate_command(aspirate_command)

    assert request == [
        AspirateRequest(
            pipetteId=aspirate_command.params.pipette,
            labwareId=aspirate_command.params.labware,
            wellName=aspirate_command.params.well,
            volume=aspirate_command.params.volume,
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=(0, 0, aspirate_command.params.offsetFromBottomMm)
            )
        )
    ]


def test_dispense(
        subject: CommandTranslator,
        dispense_command: models.LiquidCommand
) -> None:
    """It should translate a JSON dispense command to a Protocol Engine
     dispense request."""
    request = subject._translate_command(dispense_command)

    assert request == [
        DispenseRequest(
            pipetteId=dispense_command.params.pipette,
            labwareId=dispense_command.params.labware,
            wellName=dispense_command.params.well,
            volume=dispense_command.params.volume,
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=(0, 0, dispense_command.params.offsetFromBottomMm)
            )
        )
    ]


def test_drop_tip(
        subject: CommandTranslator,
        drop_tip_command: models.PickUpDropTipCommand
) -> None:
    """It should translate a JSON drop tip command to a Protocol Engine
     drop tip request."""
    request = subject._translate_command(drop_tip_command)

    assert request == [
        DropTipRequest(
            pipetteId=drop_tip_command.params.pipette,
            labwareId=drop_tip_command.params.labware,
            wellName=drop_tip_command.params.well
        )
    ]


def test_pick_up_tip(subject, pick_up_command: models.PickUpDropTipCommand) -> None:
    """
    It should translate a JSON pick up tip command to a Protocol Engine
    PickUpTip request.
    """
    request = subject._translate_command(pick_up_command)

    assert request == [
        PickUpTipRequest(
            pipetteId=pick_up_command.params.pipette,
            labwareId=pick_up_command.params.labware,
            wellName=pick_up_command.params.well,

        )
    ]
