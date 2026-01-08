import pytest
from mock import AsyncMock, MagicMock

from opentrons.drivers.asyncio.communication.serial_connection import (
    AsyncResponseSerialConnection,
)
from opentrons.drivers.vacuum_module import types
from opentrons.drivers.vacuum_module.driver import (
    VacuumModuleDriver,
)


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


async def test_set_vacuum_state(
    subject: VacuumModuleDriver, connection: AsyncMock
) -> None:
    """It should send a set pressure command"""
    connection.send_command.return_value = "M120"

    await subject.set_vacuum_state(True, -600)

    set_pressure = (
        types.GCODE.SET_PRESSURE_STATE.build_command()
        .add_int("S", 1)
        .add_float("P", -600)
    )

    connection.send_command.assert_any_call(set_pressure)
    connection.reset_mock()

    # With duration and rate
    connection.send_command.return_value = "M120"

    await subject.set_vacuum_state(True, -600, 500, rate=-10)

    set_pressure = (
        types.GCODE.SET_PRESSURE_STATE.build_command()
        .add_int("S", 1)
        .add_float("P", -600)
        .add_int("D", 500)
        .add_float("R", -10)
    )

    connection.send_command.assert_any_call(set_pressure)
    connection.reset_mock()

    # With vent_after
    connection.send_command.return_value = "M120"

    await subject.set_vacuum_state(True, -600, 500, vent_after=True)

    set_pressure = (
        types.GCODE.SET_PRESSURE_STATE.build_command()
        .add_int("S", 1)
        .add_float("P", -600)
        .add_int("D", 500)
        .add_int("V", 1)
    )

    connection.send_command.assert_any_call(set_pressure)
    connection.reset_mock()

    # vacuum off
    connection.send_command.return_value = "M120"

    await subject.set_vacuum_state(False)

    set_pressure = types.GCODE.SET_PRESSURE_STATE.build_command().add_int("S", 0)

    connection.send_command.assert_any_call(set_pressure)
    connection.reset_mock()


async def test_get_vacuum_state(
    subject: VacuumModuleDriver, connection: AsyncMock
) -> None:
    """It should send a get pressure command"""
    connection.send_command.return_value = (
        "M121 T:400.0 C:988.0 A:989.3 B:988.6 H:992.5 E:1 V:1"
    )

    pressure_state = await subject.get_vacuum_state()

    get_pressure = types.GCODE.GET_PRESSURE_STATE.build_command()
    connection.send_command.assert_any_call(get_pressure)
    connection.reset_mock()

    assert pressure_state == types.PressureState(
        400, 988, 989.3, 988.6, 992.5, True, types.VentState.CLOSED
    )

    # test idle
    connection.send_command.return_value = (
        "M121 T:0.0 C:0.0 A:989.3 B:988.6 H:992.5 E:0 V:0"
    )

    pressure_state = await subject.get_vacuum_state()

    get_pressure = types.GCODE.GET_PRESSURE_STATE.build_command()
    connection.send_command.assert_any_call(get_pressure)
    connection.reset_mock()

    assert pressure_state == types.PressureState(
        0, 0, 989.3, 988.6, 992.5, False, types.VentState.OPENED
    )


async def test_set_pump_state(
    subject: VacuumModuleDriver, connection: AsyncMock
) -> None:
    """It should send a set pump command"""
    connection.send_command.return_value = "M122"

    await subject.set_pump_state(True, 1600)

    set_pump = (
        types.GCODE.SET_PUMP_STATE.build_command().add_int("S", 1).add_float("R", 1600)
    )

    connection.send_command.assert_any_call(set_pump)
    connection.reset_mock()

    # Set Duty cycle directly instead of rpm
    await subject.set_pump_state(True, duty_cycle=30)

    set_pump = (
        types.GCODE.SET_PUMP_STATE.build_command().add_int("S", 1).add_int("D", 30)
    )
    connection.send_command.assert_any_call(set_pump)
    connection.reset_mock()

    # Turn off pump
    await subject.set_pump_state(False)

    set_pump = types.GCODE.SET_PUMP_STATE.build_command().add_int("S", 0)
    connection.send_command.assert_any_call(set_pump)
    connection.reset_mock()


async def test_get_pump_state(
    subject: VacuumModuleDriver, connection: AsyncMock
) -> None:
    """It should send a get pump command"""
    connection.send_command.return_value = "M123 T:1600.0 R:988.0 A:0 D:30 E:1 M:0"

    pump_state = await subject.get_pump_state()

    get_pump = types.GCODE.GET_PUMP_STATE.build_command()
    connection.send_command.assert_any_call(get_pump)
    connection.reset_mock()

    assert pump_state == types.PumpState(1600, 988, 0, 30, True, False)

    # manual mode on
    connection.send_command.return_value = "M123 T:0.0 R:1088.0 A:45 D:30 E:1 M:1"

    pump_state = await subject.get_pump_state()

    get_pump = types.GCODE.GET_PUMP_STATE.build_command()
    connection.send_command.assert_any_call(get_pump)
    connection.reset_mock()

    assert pump_state == types.PumpState(0, 1088, 45, 30, True, True)

    # pump off
    connection.send_command.return_value = "M123 T:0.0 R:0.0 A:0 D:0 E:0 M:1"

    pump_state = await subject.get_pump_state()

    get_pump = types.GCODE.GET_PUMP_STATE.build_command()
    connection.send_command.assert_any_call(get_pump)
    connection.reset_mock()

    assert pump_state == types.PumpState(0, 0, 0, 0, False, True)
