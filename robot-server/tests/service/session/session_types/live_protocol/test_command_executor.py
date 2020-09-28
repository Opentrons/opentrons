from unittest.mock import MagicMock
import pytest

from robot_server.service.legacy.models.control import Mount
from robot_server.service.session.command_execution.command import \
    CommandContent, CommandResult
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.session_types.live_protocol.command_executor\
    import LiveProtocolCommandExecutor
from robot_server.service.session.models import command as models
from robot_server.service.session.command_execution import Command
from robot_server.service.session.session_types.live_protocol.command_interface import CommandInterface  # noqa: E501
from robot_server.service.session.session_types.live_protocol.state_store import StateStore  # noqa: E501


@pytest.fixture
def mock_command_interface() -> MagicMock:
    m = MagicMock(spec=CommandInterface)

    async def handler(command):
        pass

    m.handle_load_labware.side_effect = handler
    m.handle_load_instrument.side_effect = handler
    m.handle_aspirate.side_effect = handler
    m.handle_dispense.side_effect = handler
    m.handle_pick_up_tip.side_effect = handler
    m.handle_drop_tip.side_effect = handler

    return m


@pytest.fixture
def mock_state_store() -> StateStore:
    s = StateStore()
    s.handle_command_request = MagicMock()
    s.handle_command_result = MagicMock()
    return s


@pytest.fixture
def command_executor(mock_command_interface, mock_state_store)\
        -> LiveProtocolCommandExecutor:
    return LiveProtocolCommandExecutor(
        command_interface=mock_command_interface,
        state_store=mock_state_store)


async def test_load_labware(command_executor, mock_command_interface):
    expected_response = models.LoadLabwareResponse(labwareId="your labware",
                                                   definition={},
                                                   calibration=(1, 2, 3))

    async def handler(command):
        return expected_response

    mock_command_interface.handle_load_labware.side_effect = handler

    command = models.LoadLabwareRequest(location=1,
                                        loadName="hello",
                                        displayName="niceName",
                                        version=1,
                                        namespace="test")
    result = await command_executor.execute(
        Command(content=CommandContent(
            name=models.EquipmentCommand.load_labware,
            data=command))
    )

    mock_command_interface.handle_load_labware.assert_called_once_with(command)

    assert result.result.data == expected_response
    assert result.content == CommandContent(
            name=models.EquipmentCommand.load_labware,
            data=command)


async def test_load_instrument(command_executor, mock_command_interface):
    expected_response = models.LoadInstrumentResponse(
        instrumentId="your instrument")

    async def handler(command):
        return expected_response

    mock_command_interface.handle_load_instrument.side_effect = handler

    command = models.LoadInstrumentRequest(instrumentName="p1000_single",
                                           mount=Mount.left)
    result = await command_executor.execute(
        Command(content=CommandContent(
            name=models.EquipmentCommand.load_instrument,
            data=command))
    )

    mock_command_interface.handle_load_instrument.assert_called_once_with(
        command)

    assert result.result.data == expected_response
    assert result.content == CommandContent(
            name=models.EquipmentCommand.load_instrument,
            data=command)


@pytest.mark.parametrize(
    argnames=['handler_name', 'command_type'],
    argvalues=[
        ['handle_aspirate', models.PipetteCommand.aspirate],
        ['handle_dispense', models.PipetteCommand.dispense]
    ])
async def test_liquid_commands(command_executor, mock_command_interface,
                               handler_name, command_type):
    async def handler(command):
        return None

    command_data = models.LiquidRequest(
        pipetteId="", labwareId="", wellId="",
        flowRate=2, volume=1, offsetFromBottom=2)

    mock_command_interface.handle_aspirate.side_effect = handler
    mock_command_interface.handle_dispense.side_effect = handler

    result = await command_executor.execute(
        Command(content=CommandContent(
            name=command_type,
            data=command_data))
    )

    getattr(mock_command_interface, handler_name).assert_called_once_with(
        command_data)

    assert result.result.data is None
    assert result.content == CommandContent(
            name=command_type,
            data=command_data)


@pytest.mark.parametrize(
    argnames=['handler_name', 'command_type'],
    argvalues=[
        ['handle_pick_up_tip', models.PipetteCommand.pick_up_tip],
        ['handle_drop_tip', models.PipetteCommand.drop_tip]
    ])
async def test_tip_commands(command_executor, mock_command_interface,
                            handler_name, command_type):
    async def handler(command):
        return None

    command_data = models.PipetteRequestBase(
        pipetteId="", labwareId="", wellId="")

    mock_command_interface.handle_pick_up_tip.side_effect = handler
    mock_command_interface.handle_drop_tip.side_effect = handler

    result = await command_executor.execute(
        Command(content=CommandContent(
            name=command_type,
            data=command_data))
    )

    getattr(mock_command_interface, handler_name).assert_called_once_with(
        command_data)

    assert result.result.data is None
    assert result.content == CommandContent(
            name=command_type,
            data=command_data)


@pytest.fixture
def state_store_command_executor(command_executor) \
        -> LiveProtocolCommandExecutor:
    """A fixture for use with testing state store calls"""
    async def handle_command(c):
        return 23

    # Mock out the command handler map
    command_executor._handler_map = {"test_command": handle_command}
    return command_executor


async def test_create_command_in_state_store(state_store_command_executor,
                                             mock_state_store):
    c = Command(content=CommandContent(
        name="test_command",
        data=EmptyModel()
    ))
    await state_store_command_executor.execute(c)

    mock_state_store.handle_command_request.assert_called_once_with(c)


async def test_command_result_in_state_store(state_store_command_executor,
                                             mock_state_store):
    c = Command(content=CommandContent(
        name="test_command",
        data=EmptyModel()
    ))
    await state_store_command_executor.execute(c)

    mock_state_store.handle_command_result.assert_called()
    assert mock_state_store.handle_command_result.call_args[0][0] == c
    # Check that the result is the correct type
    assert isinstance(mock_state_store.handle_command_result.call_args[0][1],
                      CommandResult)
    # Check that the data field in CommandResult is what was returned from
    # the handler
    assert mock_state_store.handle_command_result.call_args[0][1].data == 23
