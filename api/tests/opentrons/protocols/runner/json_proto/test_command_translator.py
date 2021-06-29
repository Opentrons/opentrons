import pytest
from typing import Any, Dict, List

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


def _make_json_protocol(
    commands: List[models.json_protocol.AllCommands] = [],
    pipettes: Dict[str, models.json_protocol.Pipettes] = {},
) -> models.JsonProtocol:
    """Return a minimal JsonProtocol with the given elements, to use as test input."""
    return models.JsonProtocol.parse_obj(
        {
            # Arbitrary schemaVersion. Currently (2021-06-28), JsonProtocol.parse_obj()
            # isn't smart enough to validate differently depending on this field.
            "schemaVersion": 5,
            "metadata": {},
            "robot": {"model": "OT-2 Standard"},
            "pipettes": pipettes,
            "labware": {},
            "labwareDefinitions": {},
            "commands": commands,
        }
    )


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


def test_pipettes(subject: CommandTranslator) -> None:
    json_pipettes = {
        "abc123": models.json_protocol.Pipettes(mount="left", name="p20_single_gen2"),
        "def456": models.json_protocol.Pipettes(mount="right", name="p300_multi"),
    }

    expected_request_1 = pe_commands.LoadPipetteRequest(
        data=pe_commands.LoadPipetteData(
            pipetteId="abc123",
            mount=MountType.LEFT,
            pipetteName=PipetteName.P20_SINGLE_GEN2,
        )
    )

    expected_request_2 = pe_commands.LoadPipetteRequest(
        data=pe_commands.LoadPipetteData(
            pipetteId="def456",
            mount=MountType.RIGHT,
            pipetteName=PipetteName.P300_MULTI,
        )
    )

    result = subject.translate(_make_json_protocol(pipettes=json_pipettes))

    assert expected_request_1 in result
    assert expected_request_2 in result


# todo(mm, 2021-06-28): Instead of pulling details out of fixtures, should each of
# these command translation tests create its own hard-coded command input, and hard-code
# its own matching output to assert against?


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
    result = subject.translate(_make_json_protocol(commands=[dispense_command]))

    assert result == [
        pe_commands.DispenseRequest(
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
    ]


def test_drop_tip(
    subject: CommandTranslator,
    drop_tip_command: models.json_protocol.PickUpDropTipCommand,
) -> None:
    """It should translate a JSON drop tip command to a Protocol Engine
    drop tip request."""
    result = subject.translate(_make_json_protocol(commands=[drop_tip_command]))

    assert result == [
        pe_commands.DropTipRequest(
            data=pe_commands.DropTipData(
                pipetteId=drop_tip_command.params.pipette,
                labwareId=drop_tip_command.params.labware,
                wellName=drop_tip_command.params.well,
            )
        )
    ]


def test_pick_up_tip(
    subject, pick_up_command: models.json_protocol.PickUpDropTipCommand
) -> None:
    """
    It should translate a JSON pick up tip command to a Protocol Engine
    PickUpTip request.
    """
    result = subject.translate(_make_json_protocol(commands=[pick_up_command]))

    assert result == [
        pe_commands.PickUpTipRequest(
            data=pe_commands.PickUpTipData(
                pipetteId=pick_up_command.params.pipette,
                labwareId=pick_up_command.params.labware,
                wellName=pick_up_command.params.well,
            )
        )
    ]
