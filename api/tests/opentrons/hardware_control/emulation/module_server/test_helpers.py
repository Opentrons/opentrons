from typing import List

import pytest
from mock import AsyncMock
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.module_server import (
    helpers,
    ModuleStatusClient,
)
from opentrons.hardware_control.emulation.module_server import models
from opentrons.hardware_control.modules import ModuleAtPort


@pytest.fixture
def mock_callback() -> AsyncMock:
    """Callback mock."""
    return AsyncMock(spec=helpers.NotifyMethod)


@pytest.fixture
def mock_client() -> AsyncMock:
    """Mock client."""
    return AsyncMock(spec=ModuleStatusClient)


@pytest.fixture
def subject(mock_callback: AsyncMock, mock_client: AsyncMock) -> helpers.ModuleListener:
    """Test subject."""
    return helpers.ModuleListener(client=mock_client, notify_method=mock_callback)


@pytest.fixture
def connections() -> List[models.ModuleConnection]:
    """Connection models."""
    return [
        models.ModuleConnection(
            url=f"url{i}", module_type=f"module_type{i}", identifier=f"identifier{i}"
        )
        for i in range(5)
    ]


@pytest.fixture
def modules_at_port() -> List[ModuleAtPort]:
    """Connection models."""
    return [
        ModuleAtPort(
            port=f"url{i}",
            name=f"module_type{i}",
            usb_port=USBPort(
                name=f"identifier{i}", port_number=0, hub=True, hub_port=i + 1
            ),
        )
        for i in range(5)
    ]


async def test_handle_message_connected_empty(
    subject: helpers.ModuleListener, mock_callback: AsyncMock
) -> None:
    """It should call the call back with the correct modules to add."""
    message = models.Message(status="connected", connections=[])
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with([], [])


async def test_handle_message_connected_one(
    subject: helpers.ModuleListener,
    mock_callback: AsyncMock,
    connections: List[models.ModuleConnection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to add."""
    message = models.Message(status="connected", connections=connections[:1])
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with(modules_at_port[:1], [])


async def test_handle_message_connected_many(
    subject: helpers.ModuleListener,
    mock_callback: AsyncMock,
    connections: List[models.ModuleConnection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to add."""
    message = models.Message(status="connected", connections=connections)
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with(modules_at_port, [])


async def test_handle_message_disconnected_empty(
    subject: helpers.ModuleListener, mock_callback: AsyncMock
) -> None:
    """It should call the call back with the correct modules to remove."""
    message = models.Message(status="disconnected", connections=[])
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with([], [])


async def test_handle_message_disconnected_one(
    subject: helpers.ModuleListener,
    mock_callback: AsyncMock,
    connections: List[models.ModuleConnection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to remove."""
    message = models.Message(status="disconnected", connections=connections[:1])
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with([], modules_at_port[:1])


async def test_handle_message_disconnected_many(
    subject: helpers.ModuleListener,
    mock_callback: AsyncMock,
    connections: List[models.ModuleConnection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to remove."""
    message = models.Message(status="disconnected", connections=connections)
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with([], modules_at_port)


async def test_handle_message_dump_empty(
    subject: helpers.ModuleListener, mock_callback: AsyncMock
) -> None:
    """It should call the call back with the correct modules to load."""
    message = models.Message(status="dump", connections=[])
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with([], [])


async def test_handle_message_dump_one(
    subject: helpers.ModuleListener,
    mock_callback: AsyncMock,
    connections: List[models.ModuleConnection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to load."""
    message = models.Message(status="dump", connections=connections[:1])
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with(modules_at_port[:1], [])


async def test_handle_message_dump_many(
    subject: helpers.ModuleListener,
    mock_callback: AsyncMock,
    connections: List[models.ModuleConnection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to load."""
    message = models.Message(status="dump", connections=connections)
    await subject.handle_message(message=message)
    mock_callback.assert_called_once_with(modules_at_port, [])
