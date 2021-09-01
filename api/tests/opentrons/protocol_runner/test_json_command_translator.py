"""Tests for the JSON JsonCommandTranslator interface."""
import pytest
from typing import Any, List

from opentrons.types import DeckSlotName, MountType
from opentrons.protocols import models
from opentrons.protocol_runner.json_command_translator import JsonCommandTranslator
from opentrons.protocol_engine import (
    commands as pe_commands,
    DeckSlotLocation,
    PipetteName,
    WellLocation,
    WellOrigin,
)


@pytest.fixture
def subject() -> JsonCommandTranslator:
    """Get a JsonCommandTranslator test subject."""
    return JsonCommandTranslator()


def _assert_appear_in_order(elements: List[Any], source: List[Any]) -> None:
    """Assert all elements appear in source, in the given order relative to each other.

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
    for element in elements:
        # .index() will check this, but asserting separately lets PyTest show better
        # error details.
        assert element in source
    element_indexes = [source.index(element) for element in elements]
    assert sorted(element_indexes) == element_indexes


def test_labware(
    subject: JsonCommandTranslator,
    minimal_labware_def: dict,
    minimal_labware_def2: dict,
) -> None:
    """It should emit AddLabwareDefinitionRequest and LoadLabwareRequest objects.

    A LoadLabwareRequest should always come after the AddLabwareDefinitionRequest
    that it depends on.
    """
    definition_1 = models.LabwareDefinition.parse_obj(minimal_labware_def)
    definition_2 = models.LabwareDefinition.parse_obj(minimal_labware_def2)

    definition_map = {
        "definition-id-abc123": definition_1,
        "definition-id-def456": definition_2,
    }

    labware_map = {
        "labware-id-abc123": models.json_protocol.Labware(
            slot="1", definitionId="definition-id-abc123"
        ),
        "labware-id-def456": models.json_protocol.Labware(
            slot="2", definitionId="definition-id-def456"
        ),
    }

    # todo(mm, 2021-06-30): This test pulls internal details out of fixtures, like
    # definition_1.parameters.loadName. This makes it hard to read and follow. Instead,
    # it should created its own labware definitions with hard-coded values like
    # "my-load-name", and then assert that the hard-coded string "my-load-name" is
    # what's used in the output Protocol Engine command.

    expected_add_definition_request_1 = pe_commands.AddLabwareDefinitionRequest(
        data=pe_commands.AddLabwareDefinitionData(definition=definition_1)
    )
    expected_load_request_1 = pe_commands.LoadLabwareRequest(
        data=pe_commands.LoadLabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            loadName=definition_1.parameters.loadName,
            namespace=definition_1.namespace,
            version=definition_1.version,
            labwareId="labware-id-abc123",
        )
    )

    expected_add_definition_request_2 = pe_commands.AddLabwareDefinitionRequest(
        data=pe_commands.AddLabwareDefinitionData(definition=definition_2)
    )
    expected_load_request_2 = pe_commands.LoadLabwareRequest(
        data=pe_commands.LoadLabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
            loadName=definition_2.parameters.loadName,
            namespace=definition_2.namespace,
            version=definition_2.version,
            labwareId="labware-id-def456",
        )
    )

    result = subject.translate(
        models.json_protocol.make_minimal(
            labware_definitions=definition_map, labware=labware_map
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

    assert len(result) == 4


def test_pipettes(subject: JsonCommandTranslator) -> None:
    """It should translate pipette specs into LoadPipetteRequest objects."""
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

    result = subject.translate(
        models.json_protocol.make_minimal(pipettes=json_pipettes)
    )

    # set() would be a nicer way to write this, but our Pydantic models aren't hashable.
    assert expected_request_1 in result
    assert expected_request_2 in result
    assert len(result) == 2


def test_aspirate(subject: JsonCommandTranslator) -> None:
    """It should translate a JSON aspirate to a Protocol Engine AspirateRequest."""
    input_json_command = models.json_protocol.LiquidCommand(
        command="aspirate",
        params=models.json_protocol.Params(
            pipette="pipette-id-abc123",
            labware="labware-id-def456",
            volume=1.23,
            flowRate=4.56,
            well="A1",
            offsetFromBottomMm=7.89,
        ),
    )
    expected_output = [
        pe_commands.AspirateRequest(
            data=pe_commands.AspirateData(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=(0, 0, 7.89),
                ),
            )
        )
    ]

    output = subject.translate(
        models.json_protocol.make_minimal(commands=[input_json_command])
    )
    assert output == expected_output


def test_dispense(subject: JsonCommandTranslator) -> None:
    """It should translate a JSON dispense to a ProtocolEngine DispenseRequest."""
    input_json_command = models.json_protocol.LiquidCommand(
        command="dispense",
        params=models.json_protocol.Params(
            pipette="pipette-id-abc123",
            labware="labware-id-def456",
            volume=1.23,
            flowRate=4.56,
            well="A1",
            offsetFromBottomMm=7.89,
        ),
    )
    expected_output = [
        pe_commands.DispenseRequest(
            data=pe_commands.DispenseData(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=(0, 0, 7.89),
                ),
            )
        )
    ]

    output = subject.translate(
        models.json_protocol.make_minimal(commands=[input_json_command])
    )
    assert output == expected_output


def test_drop_tip(subject: JsonCommandTranslator) -> None:
    """It should translate a JSON drop tip to a ProtocolEngine DropTipRequest."""
    input_json_command = models.json_protocol.PickUpDropTipCommand(
        command="dropTip",
        params=models.json_protocol.PipetteAccessParams(
            pipette="pipette-id-abc123", labware="labware-id-def456", well="A1"
        ),
    )
    expected_output = [
        pe_commands.DropTipRequest(
            data=pe_commands.DropTipData(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
            )
        )
    ]

    output = subject.translate(
        models.json_protocol.make_minimal(commands=[input_json_command])
    )
    assert output == expected_output


def test_pick_up_tip(subject: JsonCommandTranslator) -> None:
    """It should translate a JSON pick up tip to a ProtocolEngine PickUpTipRequest."""
    input_json_command = models.json_protocol.PickUpDropTipCommand(
        command="pickUpTip",
        params=models.json_protocol.PipetteAccessParams(
            pipette="pipette-id-abc123", labware="labware-id-def456", well="A1"
        ),
    )
    expected_output = [
        pe_commands.PickUpTipRequest(
            data=pe_commands.PickUpTipData(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
            )
        )
    ]

    output = subject.translate(
        models.json_protocol.make_minimal(commands=[input_json_command])
    )
    assert output == expected_output


def test_pause(subject: JsonCommandTranslator) -> None:
    """It should translate delay with wait=True to a PauseRequest."""
    input_command = models.json_protocol.DelayCommand(
        command="delay",
        params=models.json_protocol.DelayCommandParams(
            wait=True,
            message="hello world",
        ),
    )
    input_protocol = models.json_protocol.make_minimal(commands=[input_command])

    result = subject.translate(input_protocol)

    assert result == [
        pe_commands.PauseRequest(data=pe_commands.PauseData(message="hello world"))
    ]
