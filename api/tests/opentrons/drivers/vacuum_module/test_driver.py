import pytest
from mock import AsyncMock, MagicMock
from opentrons.drivers.asyncio.communication.serial_connection import (
    AsyncResponseSerialConnection,
)
from opentrons.drivers.vacuum_module.driver import (
    VacuumModuleDriver,
)
from opentrons.drivers.vacuum_module import types


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=AsyncResponseSerialConnection)


@pytest.fixture
def subject(connection: AsyncMock) -> VacuumModuleDriver:
    connection.send_command.return_value = ""
    connection._serial = MagicMock()
    return VacuumModuleDriver(connection)


async def test_get_device_info(
    subject: VacuumModuleDriver, connection: AsyncMock
) -> None:
    """It should send a get device info command"""
    connection.send_command.side_effect = [
        "M115 FW:0.0.1 HW:Opentrons-vacuum-module-nff SerialNo:VMA120230605001",
        "M114 R:0",
    ]
    response = await subject.get_device_info()
    assert response == types.VacuumModuleInfo(
        fw="0.0.1",
        hw=types.HardwareRevision.NFF,
        sn="VMA120230605001",
        rr=0,
    )

    device_info = types.GCODE.GET_DEVICE_INFO.build_command()
    reset_reason = types.GCODE.GET_RESET_REASON.build_command()
    connection.send_command.assert_any_call(device_info)
    connection.send_command.assert_called_with(reset_reason)
    connection.reset_mock()

    # Test invalid response
    connection.send_command.side_effect = [
        "M115 FW:0.0.1 SerialNo:VMA120230605001",
        "M114 R:0",
    ]

    # This should raise ValueError
    with pytest.raises(ValueError):
        response = await subject.get_device_info()

    device_info = types.GCODE.GET_DEVICE_INFO.build_command()
    connection.send_command.assert_any_call(device_info)
    # M115 response is invalid, so we dont send M114.
    connection.send_command.assert_called_once()


async def test_set_serial_number(
    subject: VacuumModuleDriver, connection: AsyncMock
) -> None:
    """It should send a set serial number command"""
    connection.send_command.return_value = "M996"

    serial_number = "VMA1020250119001"
    await subject.set_serial_number(serial_number)

    set_serial_number = types.GCODE.SET_SERIAL_NUMBER.build_command().add_element(
        serial_number
    )
    connection.send_command.assert_any_call(set_serial_number)
    connection.reset_mock()

    # Test invalid response
    connection.send_command.return_value = "M9nn"
    with pytest.raises(ValueError):
        await subject.set_serial_number(serial_number)

    set_serial_number = types.GCODE.SET_SERIAL_NUMBER.build_command().add_element(
        serial_number
    )
    connection.send_command.assert_any_call(set_serial_number)
    connection.reset_mock()

    # Test invalid serial number
    with pytest.raises(ValueError):
        await subject.set_serial_number("invalid")

    connection.send_command.assert_not_called()
    connection.reset_mock()


async def test_set_led(subject: VacuumModuleDriver, connection: AsyncMock) -> None:
    """It should send a set led command"""
    connection.send_command.return_value = "M200"
    await subject.set_led(1, types.LEDColor.RED)

    set_led = types.GCODE.SET_LED.build_command().add_float("P", 1).add_int("C", 1)
    connection.send_command.assert_any_call(set_led)
    connection.reset_mock()

    # test setting only external leds
    await subject.set_led(1, types.LEDColor.RED, external=True)

    set_led = (
        types.GCODE.SET_LED.build_command()
        .add_float("P", 1)
        .add_int("C", 1)
        .add_int("K", 1)
    )
    connection.send_command.assert_any_call(set_led)
    connection.reset_mock()
