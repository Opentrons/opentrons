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
    for element in elements:
        # .index() will check this, but asserting separately lets PyTest show better
        # error details.
        assert element in source
    element_indexes = [source.index(element) for element in elements]
    assert sorted(element_indexes) == element_indexes


def _make_json_protocol(
    *,
    pipettes: Dict[str, models.json_protocol.Pipettes] = {},
    labware_definitions: Dict[str, models.LabwareDefinition] = {},
    labware: Dict[str, models.json_protocol.Labware] = {},
    commands: List[models.json_protocol.AllCommands] = [],
) -> models.JsonProtocol:
    """Return a minimal JsonProtocol with the given elements, to use as test input."""
    return models.JsonProtocol(
        # schemaVersion is arbitrary. Currently (2021-06-28), JsonProtocol.parse_obj()
        # isn't smart enough to validate differently depending on this field.
        schemaVersion=5,
        metadata=models.json_protocol.Metadata(),
        robot=models.json_protocol.Robot(model="OT-2 Standard"),
        pipettes=pipettes,
        labwareDefinitions=labware_definitions,
        labware=labware,
        commands=commands,
    )


def test_labware(
    subject: CommandTranslator,
    minimal_labware_def: dict,
    minimal_labware_def2: dict,
) -> None:
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
        _make_json_protocol(labware_definitions=definition_map, labware=labware_map)
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
