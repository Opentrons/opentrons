from unittest.mock import MagicMock
import pytest

from robot_server.service.legacy.models.control import Mount
from robot_server.service.session.command_execution.command import \
    CommandContent
from robot_server.service.session.session_types.live_protocol.command_executor\
    import LiveProtocolCommandExecutor
from robot_server.service.session import models
from robot_server.service.session.command_execution import Command, \
    CompletedCommand
from robot_server.service.session.session_types.live_protocol.command_interface import \
    CommandInterface


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
def command_executor(mock_command_interface) -> LiveProtocolCommandExecutor:
    return LiveProtocolCommandExecutor(mock_command_interface)


async def test_load_labware(command_executor, mock_command_interface):
    expected_response = models.LoadLabwareResponse(labwareId="your labware")

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

    command = models.LoadInstrumentRequest(instrumentName="instrument name",
                                           mount=Mount.left)
    result = await command_executor.execute(
        Command(content=CommandContent(
            name=models.EquipmentCommand.load_instrument,
            data=command))
    )

    mock_command_interface.handle_load_instrument.assert_called_once_with(command)

    assert result.result.data == expected_response
    assert result.content == CommandContent(
            name=models.EquipmentCommand.load_instrument,
            data=command)


@pytest.mark.parametrize(argnames=['handler_name', 'command_type'],
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

    getattr(mock_command_interface, handler_name).assert_called_once_with(command_data)

    assert result.result.data is None
    assert result.content == CommandContent(
            name=command_type,
            data=command_data)


@pytest.mark.parametrize(argnames=['handler_name', 'command_type'],
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

    getattr(mock_command_interface, handler_name).assert_called_once_with(command_data)

    assert result.result.data is None
    assert result.content == CommandContent(
            name=command_type,
            data=command_data)

