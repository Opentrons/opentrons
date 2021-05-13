from mock import AsyncMock
import pytest

from opentrons.drivers.asyncio.communication.serial_connection import \
    SerialConnection
from opentrons.drivers.asyncio.magdeck.driver import (
    MagDeckDriver, MAG_DECK_COMMAND_TERMINATOR, GCODE_ROUNDING_PRECISION
)
from opentrons.drivers.command_builder import CommandBuilder


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

    expected = CommandBuilder(
        terminator=MAG_DECK_COMMAND_TERMINATOR
    ).add_gcode(gcode="G28.2")

    connection.send_command.assert_called_once_with(command=expected, retries=3)


async def test_probe_plate(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a probe plate command"""
    await driver.probe_plate()

    expected = CommandBuilder(
        terminator=MAG_DECK_COMMAND_TERMINATOR
    ).add_gcode(gcode="G38.2")

    connection.send_command.assert_called_once_with(command=expected, retries=3)


async def test_get_plate_height(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a get plate height command and parse response"""
    connection.send_command.return_value = "height:12.34"

    response = await driver.get_plate_height()

    expected = CommandBuilder(
        terminator=MAG_DECK_COMMAND_TERMINATOR
    ).add_gcode(gcode="M836")

    connection.send_command.assert_called_once_with(command=expected, retries=3)

    assert response == 12.34


async def test_get_mag_position(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a get mag position command and parse response"""
    connection.send_command.return_value = "Z:12.34"

    response = await driver.get_mag_position()

    expected = CommandBuilder(
        terminator=MAG_DECK_COMMAND_TERMINATOR
    ).add_gcode(gcode="M114.2")

    connection.send_command.assert_called_once_with(command=expected, retries=3)

    assert response == 12.34


async def test_move(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a move command"""
    await driver.move(321.2214)

    expected = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
        gcode="G0"
    ).add_float(prefix="Z", value=321.2214, precision=GCODE_ROUNDING_PRECISION)

    connection.send_command.assert_called_once_with(
        command=expected, retries=3
    )


async def test_get_device_info(driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send a get device info command and parse response"""
    connection.send_command.return_value = "serial:s model:m version:v"

    response = await driver.get_device_info()

    expected = CommandBuilder(
        terminator=MAG_DECK_COMMAND_TERMINATOR
    ).add_gcode(gcode="M115")

    connection.send_command.assert_called_once_with(command=expected, retries=3)

    assert response == {"serial": "s", "model": "m", "version": "v"}


async def test_enter_programming_mode(
        driver: MagDeckDriver, connection: AsyncMock) -> None:
    """It should send an enter programming mode command"""
    await driver.enter_programming_mode()

    expected = CommandBuilder(
        terminator=MAG_DECK_COMMAND_TERMINATOR
    ).add_gcode(gcode="dfu")

    connection.send_command.assert_called_once_with(command=expected, retries=3)
