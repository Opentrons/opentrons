from typing import Optional

import pytest
from mock import AsyncMock
from opentrons.drivers.asyncio.communication.serial_connection import \
    SerialConnection
from opentrons.drivers.asyncio.thermocycler import driver
from opentrons.drivers.types import Temperature, PlateTemperature, LidStatus


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=SerialConnection)


@pytest.fixture
def subject(connection: AsyncMock) -> driver.Thermocycler:
    connection.send_command.return_value = ""
    return driver.Thermocycler(connection)


async def test_open_lid(subject: driver.Thermocycler,
                        connection: AsyncMock) -> None:
    """It should send an open lid command."""
    await subject.open_lid()

    connection.send_command.assert_called_once_with(data="M126 \r\n", retries=3)


async def test_close_lid(subject: driver.Thermocycler,
                         connection: AsyncMock) -> None:
    """It should send a close lid command."""
    await subject.close_lid()

    connection.send_command.assert_called_once_with(data="M127 \r\n", retries=3)


async def test_get_lid_status(subject: driver.Thermocycler,
                              connection: AsyncMock) -> None:
    """It should send a get lid status command and parse response."""
    connection.send_command.return_value = f'Lid:open\r\nok\r\nok\r\n'

    response = await subject.get_lid_status()

    connection.send_command.assert_called_once_with(data="M119 \r\n", retries=3)
    assert response == LidStatus.OPEN


@pytest.mark.parametrize(
    argnames=["requested_temp", "actual_temp"],
    argvalues=[
        [driver.LID_TARGET_MIN + 5, driver.LID_TARGET_MIN + 5],
        [driver.LID_TARGET_MIN - 5, driver.LID_TARGET_MIN],
        [driver.LID_TARGET_MAX + 5, driver.LID_TARGET_MAX]
    ]
)
async def test_set_lid_temp(subject: driver.Thermocycler,
                            connection: AsyncMock,
                            requested_temp: float,
                            actual_temp: float) -> None:
    """It should send a set lid temperature command honoring the min/max."""
    await subject.set_lid_temperature(temp=requested_temp)

    expected = f"M140 S{actual_temp} \r\n"

    connection.send_command.assert_called_once_with(data=expected, retries=3)


async def test_get_lid_temp(subject: driver.Thermocycler,
                            connection: AsyncMock) -> None:
    """It should send a get lid temperate command and parse response."""
    connection.send_command.return_value = "T:100.000 C:22.041\r\nok\r\nok\r\n'"

    response = await subject.get_lid_temperature()

    connection.send_command.assert_called_once_with(data="M141 \r\n", retries=3)
    assert response == Temperature(target=100, current=22.04)


@pytest.mark.parametrize(
    argnames=["temp", "hold_time", "volume", "expected_body"],
    argvalues=[
        [50, 2, 32, "S50 H2 V32"],
        [50, None, None, "S50"],
        [50, 2, None, "S50 H2"],
        [50, None, 32, "S50 V32"],
        [-5, 2, 32, "S0 H2 V32"],
        [102, 2, 32, "S99 H2 V32"],
    ]
)
async def test_set_plate_temp(
        subject: driver.Thermocycler, connection: AsyncMock,
        temp: float, hold_time: Optional[float], volume: Optional[float],
        expected_body: str) -> None:
    """It should send a set plate temperature command."""
    await subject.set_plate_temperature(temp=temp, hold_time=hold_time, volume=volume)

    connection.send_command.assert_called_once_with(data=f"M104 {expected_body} \r\n", retries=3)


async def test_get_plate_temp(subject: driver.Thermocycler,
                              connection: AsyncMock) -> None:
    """It should send a command to get the plate temperature and parse the response."""
    connection.send_command.return_value = "T:30.000 C:23.317 H:120\r\nok\r\nok\r\n"

    response = await subject.get_plate_temperature()

    connection.send_command.assert_called_once_with(data="M105 \r\n", retries=3)
    assert response == PlateTemperature(
        target=30, current=23.32, hold=120
    )


async def test_set_ramp_rate(subject: driver.Thermocycler,
                             connection: AsyncMock) -> None:
    """It should send a set ramp rate command."""
    await subject.set_ramp_rate(ramp_rate=22)

    connection.send_command.assert_called_once_with(data="M566 S22 \r\n", retries=3)


async def test_deactivate_all(subject: driver.Thermocycler,
                              connection: AsyncMock) -> None:
    """It should send a deactivate all command."""
    await subject.deactivate_all()

    connection.send_command.assert_called_once_with(data="M18 \r\n", retries=3)


async def test_deactivate_lid(subject: driver.Thermocycler,
                              connection: AsyncMock) -> None:
    """It should send a deactivate lid command."""
    await subject.deactivate_lid()

    connection.send_command.assert_called_once_with(data="M108 \r\n", retries=3)


async def test_deactivate_block(subject: driver.Thermocycler,
                                connection: AsyncMock) -> None:
    """It should send a deactivate block command."""
    await subject.deactivate_block()

    connection.send_command.assert_called_once_with(data="M14 \r\n", retries=3)


async def test_device_info(subject: driver.Thermocycler,
                           connection: AsyncMock) -> None:
    """It should send a get device info command and parse response."""
    connection.send_command.return_value = "serial:s model:m version:v"

    device_info = await subject.get_device_info()

    connection.send_command.assert_called_once_with(data="M115 \r\n", retries=3)

    assert device_info == {"serial": "s", "model": "m", "version": "v"}
