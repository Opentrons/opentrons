from unittest.mock import MagicMock
import pytest

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
    async def handler(command):
        return models.LoadLabwareResponse(labwareId="your labware")

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

    assert result.result.data == models.LoadLabwareResponse(
        labwareId="your labware"
    )
    assert result.content == CommandContent(
            name=models.EquipmentCommand.load_labware,
            data=command)

