from typing import List

import pytest
from mock import AsyncMock
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.module_server import helpers
from opentrons.hardware_control.emulation.module_server import models
from opentrons.hardware_control.modules import ModuleAtPort


@pytest.fixture
def mock_callback() -> AsyncMock:
    """Callback mock."""
    return AsyncMock(spec=helpers.NotifyMethod)


@pytest.fixture
def connections() -> List[models.Connection]:
    """Connection models."""
    return [
        models.Connection(
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
            usb_port=USBPort(name=f"identifier{i}", sub_names=[]),
        )
        for i in range(5)
    ]


async def test_message_to_notify_connected_empty(mock_callback: AsyncMock) -> None:
    """It should call the call back with the correct modules to add."""
    message = models.Message(status="connected", connections=[])
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with([], [])


async def test_message_to_notify_connected_one(
    mock_callback: AsyncMock,
    connections: List[models.Connection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to add."""
    message = models.Message(status="connected", connections=connections[:1])
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with(modules_at_port[:1], [])


async def test_message_to_notify_connected_many(
    mock_callback: AsyncMock,
    connections: List[models.Connection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to add."""
    message = models.Message(status="connected", connections=connections)
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with(modules_at_port, [])


async def test_message_to_notify_disconnected_empty(mock_callback: AsyncMock) -> None:
    """It should call the call back with the correct modules to remove."""
    message = models.Message(status="disconnected", connections=[])
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with([], [])


async def test_message_to_notify_disconnected_one(
    mock_callback: AsyncMock,
    connections: List[models.Connection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to remove."""
    message = models.Message(status="disconnected", connections=connections[:1])
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with([], modules_at_port[:1])


async def test_message_to_notify_disconnected_many(
    mock_callback: AsyncMock,
    connections: List[models.Connection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to remove."""
    message = models.Message(status="disconnected", connections=connections)
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with([], modules_at_port)


async def test_message_to_notify_dump_empty(mock_callback: AsyncMock) -> None:
    """It should call the call back with the correct modules to load."""
    message = models.Message(status="dump", connections=[])
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with([], [])


async def test_message_to_notify_dump_one(
    mock_callback: AsyncMock,
    connections: List[models.Connection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to load."""
    message = models.Message(status="dump", connections=connections[:1])
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with(modules_at_port[:1], [])


async def test_message_to_notify_dump_many(
    mock_callback: AsyncMock,
    connections: List[models.Connection],
    modules_at_port: List[ModuleAtPort],
) -> None:
    """It should call the call back with the correct modules to load."""
    message = models.Message(status="dump", connections=connections)
    await helpers.ModuleListener.message_to_notify(
        message=message, notify_method=mock_callback
    )
    mock_callback.assert_called_once_with(modules_at_port, [])
