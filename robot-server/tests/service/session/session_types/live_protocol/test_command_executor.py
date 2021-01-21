from datetime import datetime
from unittest.mock import MagicMock
from mock import AsyncMock
import pytest
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine import commands as pe_commands
from opentrons.protocol_engine.errors import ProtocolEngineError
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.types import DeckSlotName, MountType

from robot_server.service.session.command_execution.command import CommandMeta, \
    CompletedCommand
from robot_server.service.session.errors import UnsupportedCommandException, \
    CommandExecutionException
from robot_server.service.session.models import command_definitions
from robot_server.service.session.models import command as command_models
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.session_types.live_protocol.command_executor\
    import LiveProtocolCommandExecutor
from robot_server.service.session.command_execution import Command, CommandResult


@pytest.fixture
def mock_protocol_engine() -> MagicMock:
    m = AsyncMock(spec=ProtocolEngine)
    return m


@pytest.fixture
def command_executor(mock_protocol_engine)\
        -> LiveProtocolCommandExecutor:
    return LiveProtocolCommandExecutor(protocol_engine=mock_protocol_engine)


@pytest.mark.parametrize(
    argnames="command_type",
    argvalues=[
        command_definitions.CalibrationCommand.pick_up_tip,
        command_definitions.ProtocolCommand.start_run,
        command_definitions.CheckCalibrationCommand.compare_point
    ])
async def test_unsupported_commands(command_type,
                                    command_executor,
                                    mock_protocol_engine):
    """Test that non live protocol commands are rejected."""
    command_object = Command(
        meta=CommandMeta(identifier="1234"),
        request=command_models.SimpleCommandRequest(
            command=command_type,
            data=EmptyModel()))

    with pytest.raises(UnsupportedCommandException, match="is not supported"):
        await command_executor.execute(command_object)


async def test_failed_command(command_executor, mock_protocol_engine):
    """Test that protocol engine failures are caught."""
    request_body = pe_commands.LoadLabwareRequest(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
        loadName="hello",
        version=1,
        namespace="test"
    )

    command_object = Command(
        meta=CommandMeta(identifier="1234"),
        request=command_models.LoadLabwareRequest(
            command=command_definitions.EquipmentCommand.load_labware,
            data=request_body))

    protocol_engine_response = pe_commands.FailedCommand(
        request=request_body,
        created_at=datetime(2000, 1, 1),
        started_at=datetime(2000, 1, 2),
        failed_at=datetime(2000, 1, 3),
        error=ProtocolEngineError("failure"),
    )

    mock_protocol_engine.execute_command.return_value = protocol_engine_response

    with pytest.raises(CommandExecutionException):
        await command_executor.execute(command_object)


async def test_load_labware(command_executor, mock_protocol_engine):
    """Test that load labware command is executed."""
    request_body = pe_commands.LoadLabwareRequest(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
        loadName="hello",
        version=1,
        namespace="test"
    )

    protocol_engine_response = pe_commands.CompletedCommand(
        result=pe_commands.LoadLabwareResult(
            labwareId="your labware",
            definition={},
            calibration=(1, 2, 3)),
        request=request_body,
        created_at=datetime(2000, 1, 1),
        started_at=datetime(2000, 1, 2),
        completed_at=datetime(2000, 1, 3)
    )

    mock_protocol_engine.execute_command.return_value = protocol_engine_response

    command_object = Command(
        meta=CommandMeta(identifier="1234"),
        request=command_models.LoadLabwareRequest(
            command=command_definitions.EquipmentCommand.load_labware,
            data=request_body))

    result = await command_executor.execute(command_object)

    mock_protocol_engine.execute_command.assert_called_once_with(
        request=request_body,
        command_id="1234"
    )

    assert result == CompletedCommand(
        request=command_object.request,
        meta=command_object.meta,
        result=CommandResult(
            started_at=protocol_engine_response.started_at,
            completed_at=protocol_engine_response.completed_at,
            data=protocol_engine_response.result
        )
    )


async def test_load_instrument(command_executor, mock_protocol_engine):
    """Test that load pipette command is executed."""
    request_body = pe_commands.LoadPipetteRequest(
        pipetteName="p10_single",
        mount=MountType.LEFT,
    )

    protocol_engine_response = pe_commands.CompletedCommand(
        result=pe_commands.LoadPipetteResult(
            pipetteId="4321"
        ),
        request=request_body,
        created_at=datetime(2000, 1, 1),
        started_at=datetime(2000, 1, 2),
        completed_at=datetime(2000, 1, 3)
    )

    mock_protocol_engine.execute_command.return_value = protocol_engine_response

    command_object = Command(
        meta=CommandMeta(identifier="1234"),
        request=command_models.LoadInstrumentRequest(
            command=command_definitions.EquipmentCommand.load_instrument,
            data=request_body))

    result = await command_executor.execute(command_object)

    mock_protocol_engine.execute_command.assert_called_once_with(
        request=request_body,
        command_id="1234"
    )

    assert result == CompletedCommand(
        request=command_object.request,
        meta=command_object.meta,
        result=CommandResult(
            started_at=protocol_engine_response.started_at,
            completed_at=protocol_engine_response.completed_at,
            data=protocol_engine_response.result
        )
    )
