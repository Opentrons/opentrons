"""Tests for the JSON JsonCommandTranslator interface."""
import pytest
from typing import Any, Dict, List, Tuple

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
import opentrons_shared_data.protocol.models as json_v6_models
from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_runner.json_command_translator import JsonCommandTranslator
from opentrons.protocol_engine import (
    commands as pe_commands,
    DeckSlotLocation,
    PipetteName,
    WellLocation,
    WellOrigin,
    WellOffset,
)


@pytest.fixture
def subject() -> JsonCommandTranslator:
    """Get a JsonCommandTranslator test subject."""
    return JsonCommandTranslator()


def _make_json_protocol(
        *,
        pipettes: Dict[str, json_v6_models.Pipette] = {},
        labware_definitions: Dict[str, LabwareDefinition] = {},
        labware: Dict[str, json_v6_models.Labware] = {},
        commands: List[json_v6_models.Command] = [],
) -> json_v6_models.ProtocolSchemaV6:
    """Return a minimal JsonProtocol with the given elements, to use as test input."""
    return json_v6_models.ProtocolSchemaV6(
        # schemaVersion is arbitrary. Currently (2021-06-28), JsonProtocol.parse_obj()
        # isn't smart enough to validate differently depending on this field.
        otSharedSchema="#/protocol/schemas/6",
        schemaVersion=6,
        metadata=json_v6_models.Metadata(),
        robot=json_v6_models.Robot(model="OT-2 Standard", deckId="ot2_standard"),
        pipettes=pipettes,
        labwareDefinitions=labware_definitions,
        labware=labware,
        commands=commands,
    )


# TODO test a protocol with a list of commands (Tamar and Max)
def test_command_list(subject: JsonCommandTranslator) -> None:
    command_list_tuple = load_command_list()
    output = subject.translate(_make_json_protocol(commands=command_list_tuple[0]))
    assert output == command_list_tuple[1]


def load_command_list() -> Tuple[List[json_v6_models.Command], List[pe_commands.CommandCreate]]:
    """It should translate a JSON aspirate to a Protocol Engine AspirateCreate."""
    command_list = [
        json_v6_models.Command(
            commandType="aspirate",
            id="command-id-ddd-666",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                # todo (Max and Tamar 3/17/22): needs to be added to the aspirate command https://github.com/Opentrons/opentrons/issues/8204
                flowRate=4.56,
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(origin="bottom",
                                                         offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89))
            ),
        ),
        json_v6_models.Command(
            id="dispense-command-id-666",
            commandType="dispense",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                flowRate=4.56,
                wellName="A1",
                wellLocation=json_v6_models.WellLocation(origin="bottom",
                                                         offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89))
            )
        ),
        json_v6_models.Command(
            id="dropTip-command-id-666",
            commandType="dropTip",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123", labwareId="labware-id-def456", wellName="A1",
                # added wellLocation - its expected in pe_commands
                wellLocation=json_v6_models.WellLocation(origin="bottom",
                                                         offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89))
            ),
        ),
        json_v6_models.Command(
            id="pickUpTip-command-id-666",
            commandType="pickUpTip",
            params=json_v6_models.Params(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                # added wellLocation - its expected in pe_commands
                wellLocation=json_v6_models.WellLocation(origin="bottom",
                                                         offset=json_v6_models.OffsetVector(x=0, y=0, z=7.89))
            ),
        ),
        json_v6_models.Command(
            id="delay-command-id-666",
            commandType="pause",  # used to be delay but is expecting pause
            params=json_v6_models.Params(
                wait=True,
                message="hello world",
            ),
        )]

    expected_output = [
        pe_commands.AspirateCreate(
            params=pe_commands.AspirateParams(
                # todo: id
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=7.89),
                ),
            )
        ),
        pe_commands.DispenseCreate(
            params=pe_commands.DispenseParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                volume=1.23,
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=7.89),
                ),
            )
        ),
        pe_commands.DropTipCreate(
            params=pe_commands.DropTipParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=7.89))
            )
        ),
        pe_commands.PickUpTipCreate(
            params=pe_commands.PickUpTipParams(
                pipetteId="pipette-id-abc123",
                labwareId="labware-id-def456",
                wellName="A1",
                wellLocation=WellLocation(
                    origin=WellOrigin.BOTTOM,
                    offset=WellOffset(x=0, y=0, z=7.89))
            )
        ),
        pe_commands.PauseCreate(params=pe_commands.PauseParams(message="hello world"))
    ]

    return command_list, expected_output
