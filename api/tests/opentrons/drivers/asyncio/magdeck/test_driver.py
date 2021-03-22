from mock import AsyncMock
import pytest

from opentrons.drivers.asyncio.communication.serial_connection import \
    SerialConnection
from opentrons.drivers.asyncio.magdeck.driver import MagDeckDriver


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=SerialConnection)


@pytest.fixture
def driver(connection: AsyncMock) -> MagDeckDriver:
    connection.send_command.return_value = ""
    return MagDeckDriver(connection)


async def test_home(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a home command"""
    await driver.home()

    connection.send_command.assert_called_once_with(data="G28.2 \r\n\r\n", retries=3)


async def test_probe_plate(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a probe plate command"""
    await driver.probe_plate()

    connection.send_command.assert_called_once_with(data="G38.2 \r\n\r\n", retries=3)


async def test_get_plate_height(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a get plate height command and parse response"""
    connection.send_command.return_value = "height:12.34"

    response = await driver.get_plate_height()

    connection.send_command.assert_called_once_with(data="M836 \r\n\r\n", retries=3)

    assert response == 12.34


async def test_get_mag_position(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a get mag position command and parse response"""
    connection.send_command.return_value = "Z:12.34"

    response = await driver.get_mag_position()

    connection.send_command.assert_called_once_with(data="M114.2 \r\n\r\n", retries=3)

    assert response == 12.34


async def test_move(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a move command"""
    await driver.move(321.2214)
    connection.send_command.assert_called_once_with(data="G0 Z321.221 \r\n\r\n", retries=3)


async def test_get_device_info(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a get device info command and parse response"""
    connection.send_command.return_value = "serial:s model:m version:v"

    response = await driver.get_device_info()

    connection.send_command.assert_called_once_with(data="M115 \r\n\r\n", retries=3)

    assert response == {"serial": "s", "model": "m", "version": "v"}


async def test_enter_programming_mode(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send an enter programming mode command"""
    await driver.enter_programming_mode()

    connection.send_command.assert_called_once_with(data="dfu \r\n\r\n", retries=3)
