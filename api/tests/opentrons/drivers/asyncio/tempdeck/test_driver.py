from mock import AsyncMock
import pytest

from opentrons.drivers.asyncio.communication.serial_connection import \
    SerialConnection
from opentrons.drivers.asyncio.tempdeck.abstract import Temperature
from opentrons.drivers.asyncio.tempdeck.driver import TempDeckDriver


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=SerialConnection)


@pytest.fixture
def driver(connection: AsyncMock) -> TempDeckDriver:
    connection.send_command.return_value = ""
    return TempDeckDriver(connection)


async def test_deactivate(
        driver: TempDeckDriver, connection: AsyncMock) -> None:
    """It should send a deactivate command"""
    await driver.deactivate()

    connection.send_command.assert_called_once_with(
        data="M18 \r\n\r\n", retries=3)


async def test_set_temperature(
        driver: TempDeckDriver, connection: AsyncMock) -> None:
    """It should send a set temperature command"""
    await driver.set_temperature(celsius=123.4444)

    connection.send_command.assert_called_once_with(
        data="M104 S123.0 \r\n\r\n", retries=3)


async def test_get_temperature(
        driver: TempDeckDriver, connection: AsyncMock) -> None:
    """It should send a get temperature command and parse response"""
    connection.send_command.return_value = "T:132 C:25 ok\r\nok\r\n"""

    response = await driver.get_temperature()

    connection.send_command.assert_called_once_with(data="M105 \r\n\r\n", retries=3)

    assert response == Temperature(current=25, target=132)


async def test_get_device_info(
        driver: TempDeckDriver, connection: AsyncMock) -> None:
    """It should send a get device info command and parse response"""
    connection.send_command.return_value = "serial:s model:m version:v"

    response = await driver.get_device_info()

    connection.send_command.assert_called_once_with(data="M115 \r\n\r\n",
                                                    retries=3)

    assert response == {"serial": "s", "model": "m", "version": "v"}


async def test_enter_programming_mode(
        driver: TempDeckDriver, connection: AsyncMock) -> None:
    """It should send an enter programming mode command"""
    await driver.enter_programming_mode()

    connection.send_command.assert_called_once_with(data="dfu \r\n\r\n", retries=3)
