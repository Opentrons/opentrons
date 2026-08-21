import asyncio
from typing import AsyncGenerator, List, Optional, Union
from unittest import mock

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import (
    VacuumModulePressureNotReachedError,
    VacuumModuleWasteFullError,
)

from . import require_live_data_real_string
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.vacuum_module.errors import (
    PressureNotReached,
    WasteContainerFull,
)
from opentrons.drivers.vacuum_module.simulator import SimulatingDriver
from opentrons.drivers.vacuum_module.types import (
    HardwareRevision,
    LEDColor,
    LEDPattern,
    PumpState,
    VacuumState,
    VentState,
)
from opentrons.hardware_control import ExecutionManager, modules
from opentrons.hardware_control.modules.types import (
    ModuleDataValidator,
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    VacuumModuleCycle,
    VacuumModulePowerStep,
    VacuumModulePressureStep,
    VacuumModuleStep,
    VacuumOperationMode,
    VentStatus,
)
from opentrons.hardware_control.modules.vacuum_module import (
    DEFAULT_PRESSURE_CONTROL_TUNINGS,
    DEFAULT_WASTE_CONFIG,
    POWER_COMPARISON_WINDOW_SIZE,
    PRESSURE_COMPARISON_WINDOW_SIZE,
    SIMULATING_POLL_PERIOD,
    VacuumModuleReader,
)
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent


def _set_reader_async_error_context(
    reader: VacuumModuleReader,
    *,
    mode: VacuumOperationMode,
    target: float,
    current: float,
) -> None:
    """Seed reader state the way async error enumeration reads it."""
    reader.set_operation_mode(mode)
    reader.vacuum_state = VacuumState(
        target_gauge_pressure=target,
        current_gauge_pressure=current,
        pressure_abs_a=0,
        pressure_abs_b=0,
        pressure_atm=0,
        vacuum_enabled=True,
        vacuum_duration=0,
        vent_state=VentState.CLOSED,
    )
    if mode == VacuumOperationMode.POWER:
        reader.pump_state = PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=target,
            current_pwm=current,
            pump_running=True,
            manual_control=True,
        )


@pytest.fixture
def usb_port() -> USBPort:
    """Token USB port."""
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_vacuummodule0",
    )


@pytest.fixture
def mock_driver(decoy: Decoy) -> SimulatingDriver:
    """Mocked simulating driver."""
    return decoy.mock(cls=SimulatingDriver)


@pytest.fixture
async def test_wait_for_target_subject(
    usb_port: USBPort,
    mock_driver: SimulatingDriver,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
    decoy: Decoy,
) -> AsyncGenerator[modules.VacuumModule, None]:
    """Test subject with mocked vm state updates."""
    reader = VacuumModuleReader(driver=mock_driver)
    poller = Poller(reader=reader, interval=SIMULATING_POLL_PERIOD)
    vacuum = modules.VacuumModule(
        port="/dev/ot_module_sim_vacuummodule0",
        usb_port=usb_port,
        driver=mock_driver,
        reader=reader,
        poller=poller,
        device_info={
            "serial": "dummySerialFS",
            "model": "nff",
            "version": "vacuum-fw",
            "reset_reason": "0",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    decoy.when(await mock_driver.get_device_info()).then_return(
        {
            "serial": "vacuum-fw",
            "model": HardwareRevision.NFF.value,
            "version": "dummySerialFS",
            "reset_reason": "0",
        }
    )

    decoy.when(await mock_driver.get_vacuum_state()).then_return(
        VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=0,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=True,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    )
    decoy.when(await mock_driver.get_pump_state()).then_return(
        PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=True,
            manual_control=True,
        )
    )

    await poller.start()
    try:
        yield vacuum
    finally:
        await vacuum.cleanup()


@pytest.fixture
async def subject(
    usb_port: USBPort,
    mock_driver: SimulatingDriver,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
    decoy: Decoy,
) -> AsyncGenerator[modules.VacuumModule, None]:
    """Test subject with mocked driver."""
    reader = VacuumModuleReader(driver=mock_driver)
    poller = Poller(reader=reader, interval=SIMULATING_POLL_PERIOD)
    vacuum = modules.VacuumModule(
        port="/dev/ot_module_sim_vacuummodule0",
        usb_port=usb_port,
        driver=mock_driver,
        reader=reader,
        poller=poller,
        device_info={
            "serial": "dummySerialFS",
            "model": "nff",
            "version": "vacuum-fw",
            "reset_reason": "0",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    decoy.when(await mock_driver.get_device_info()).then_return(
        {
            "serial": "vacuum-fw",
            "model": HardwareRevision.NFF.value,
            "version": "dummySerialFS",
            "reset_reason": "0",
        }
    )

    await poller.start()
    try:
        yield vacuum
    finally:
        await vacuum.cleanup()


async def test_sim_state(subject: modules.VacuumModule) -> None:
    """It should forward state."""
    status = subject.device_info
    assert status["serial"] == "dummySerialFS"
    assert status["model"] == "nff"
    assert status["version"] == "vacuum-fw"


async def test_get_target_power_falls_back_to_firmware_target_pwm(
    subject: modules.VacuumModule,
) -> None:
    """Target power should remain available from firmware after reader state is cleared."""
    subject._reader.set_operation_mode(VacuumOperationMode.POWER)
    subject._reader.set_target_power(80.0)
    subject._reader.reset_power_target()
    subject._reader.pump_state = PumpState(
        target_rpm=0,
        current_rpm=0,
        target_pwm=80,
        current_pwm=75,
        pump_running=True,
        manual_control=True,
    )

    assert subject._reader.get_target_power() == 80.0


async def test_live_data_includes_target_power_after_set_pump_state(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Live data should expose the duty cycle set via set_pump_state."""
    decoy.when(await mock_driver.get_pump_state()).then_return(
        PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=65,
            current_pwm=60,
            pump_running=True,
            manual_control=True,
        )
    )

    await subject.set_pump_state(start_pump=True, duty_cycle=65)
    subject._reader.vacuum_state = VacuumState(
        target_gauge_pressure=0,
        current_gauge_pressure=0,
        pressure_abs_a=1013.0,
        pressure_abs_b=1013.0,
        pressure_atm=1013.0,
        vacuum_enabled=False,
        vacuum_duration=0,
        vent_state=VentState.CLOSED,
    )
    subject._reader.pump_state = PumpState(
        target_rpm=0,
        current_rpm=0,
        target_pwm=65,
        current_pwm=60,
        pump_running=True,
        manual_control=True,
    )

    live_data = subject.live_data["data"]
    assert ModuleDataValidator.is_vacuum_module_data(live_data)
    assert live_data["targetPower"] == 65.0
    assert live_data["modeType"] == VacuumOperationMode.POWER
    assert live_data["ventStatus"] == VentStatus.CLOSED
    require_live_data_real_string(subject)


@pytest.mark.parametrize(
    (
        "pressure_abs_a",
        "pressure_abs_b",
        "pressure_atm",
        "firmware_gauge_pressure",
        "expected_gauge_pressure",
        "expected_pressure_equalized",
    ),
    [
        (700.0, 700.0, 1013.0, 0.0, -313.0, False),
        (1013.0, 1013.0, 1013.0, 0.0, 0.0, True),
        (750.0, 700.0, 1013.0, -250.0, -288.0, False),
        # Small basal offsets when open/vented should count as equalized.
        (1009.5, 1007.0, 1012.2, -5.2, -3.95, True),
        (1006.75, 1006.75, 1013.0, -6.25, -6.25, True),
        # Outside EQUALIZE_PRESSURE_TOL (10 mbar) is still under vacuum.
        (1000.0, 1000.0, 1013.0, -13.0, -13.0, False),
    ],
)
async def test_current_gauge_pressure_mbar_and_pressure_equalized(
    subject: modules.VacuumModule,
    pressure_abs_a: float,
    pressure_abs_b: float,
    pressure_atm: float,
    firmware_gauge_pressure: float,
    expected_gauge_pressure: float,
    expected_pressure_equalized: bool,
) -> None:
    """Gauge pressure and pressure_equalized should be derived from sensor readings."""
    subject._reader.vacuum_state = VacuumState(
        target_gauge_pressure=-300.0,
        current_gauge_pressure=firmware_gauge_pressure,
        pressure_abs_a=pressure_abs_a,
        pressure_abs_b=pressure_abs_b,
        pressure_atm=pressure_atm,
        vacuum_enabled=False,
        vacuum_duration=0,
        vent_state=VentState.CLOSED,
    )

    assert subject.current_gauge_pressure_mbar == expected_gauge_pressure
    assert subject.pressure_equalized is expected_pressure_equalized


async def test_wait_for_pressure_equalization_returns_when_already_equalized(
    subject: modules.VacuumModule,
) -> None:
    """It should return immediately when pressure is already equalized."""
    subject._reader.vacuum_state = VacuumState(
        target_gauge_pressure=0.0,
        current_gauge_pressure=0.0,
        pressure_abs_a=1013.0,
        pressure_abs_b=1013.0,
        pressure_atm=1013.0,
        vacuum_enabled=False,
        vacuum_duration=0,
        vent_state=VentState.OPENED,
    )

    await subject.wait_for_pressure_equalization()


async def test_wait_for_pressure_equalization_waits_until_equalized(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """It should poll until chamber pressure equalizes."""
    subject._reader.vacuum_state = VacuumState(
        target_gauge_pressure=0.0,
        current_gauge_pressure=-300.0,
        pressure_abs_a=700.0,
        pressure_abs_b=700.0,
        pressure_atm=1013.0,
        vacuum_enabled=False,
        vacuum_duration=0,
        vent_state=VentState.OPENED,
    )
    unequalized_states = [
        VacuumState(
            target_gauge_pressure=0.0,
            current_gauge_pressure=-300.0,
            pressure_abs_a=700.0,
            pressure_abs_b=700.0,
            pressure_atm=1013.0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.OPENED,
        ),
        VacuumState(
            target_gauge_pressure=0.0,
            current_gauge_pressure=-50.0,
            pressure_abs_a=950.0,
            pressure_abs_b=950.0,
            pressure_atm=1013.0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.OPENED,
        ),
    ]
    equalized_state = VacuumState(
        target_gauge_pressure=0.0,
        current_gauge_pressure=0.0,
        pressure_abs_a=1013.0,
        pressure_abs_b=1013.0,
        pressure_atm=1013.0,
        vacuum_enabled=False,
        vacuum_duration=0,
        vent_state=VentState.OPENED,
    )
    read_calls = 0

    async def _vacuum_state_side_effect() -> VacuumState:
        nonlocal read_calls
        read_calls += 1
        if read_calls <= len(unequalized_states):
            return unequalized_states[read_calls - 1]
        return equalized_state

    decoy.when(await mock_driver.get_vacuum_state()).then_do(_vacuum_state_side_effect)

    await subject.wait_for_pressure_equalization(timeout_s=5.0)

    assert read_calls >= len(unequalized_states)


@pytest.mark.parametrize(
    ("should_identify", "event", "result_params"),
    [
        (  # running
            False,
            StatusBarUpdateEvent(state=StatusBarState.RUNNING, enabled=True),
            (0.5, LEDColor.GREEN, LEDPattern.STATIC, None),
        ),
        (  # paused - should identify
            True,
            StatusBarUpdateEvent(state=StatusBarState.PAUSED, enabled=True),
            (0.5, LEDColor.BLUE, LEDPattern.PULSE, 2000),
        ),
        (  # paused - door closed not identified
            False,
            StatusBarUpdateEvent(state=StatusBarState.PAUSED, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # idle - door closed
            False,
            StatusBarUpdateEvent(state=StatusBarState.IDLE, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # hardware error - identified
            True,
            StatusBarUpdateEvent(state=StatusBarState.HARDWARE_ERROR, enabled=True),
            (0.5, LEDColor.RED, LEDPattern.FLASH, 300),
        ),
        (  # hardware error - not identified
            False,
            StatusBarUpdateEvent(state=StatusBarState.HARDWARE_ERROR, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # software error
            False,
            StatusBarUpdateEvent(state=StatusBarState.SOFTWARE_ERROR, enabled=True),
            (0.5, LEDColor.YELLOW, LEDPattern.STATIC, None),
        ),
        (  # error recovery - should identify
            True,
            StatusBarUpdateEvent(state=StatusBarState.ERROR_RECOVERY, enabled=True),
            (0.5, LEDColor.YELLOW, LEDPattern.PULSE, 2000),
        ),
        (  # error recovery - door closed
            False,
            StatusBarUpdateEvent(state=StatusBarState.ERROR_RECOVERY, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # run complete
            False,
            StatusBarUpdateEvent(state=StatusBarState.RUN_COMPLETED, enabled=True),
            (0.5, LEDColor.GREEN, LEDPattern.PULSE, None),
        ),
        (  # updating
            False,
            StatusBarUpdateEvent(state=StatusBarState.UPDATING, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.PULSE, None),
        ),
    ],
)
async def test_statusbar_event_handler(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    should_identify: bool,
    event: StatusBarUpdateEvent,
    result_params: tuple[float, LEDColor, LEDPattern, int | None],
    decoy: Decoy,
) -> None:
    """It should handle LED lights."""
    subject.set_statusbar_identify(should_identify)
    await subject._handle_status_bar_event(event)
    decoy.verify(
        await mock_driver.set_led(
            result_params[0],
            color=result_params[1],
            pattern=result_params[2],
            duration=result_params[3],
            reps=None,
        )
    )


@pytest.mark.parametrize(
    ("vent_state"),
    [(VentState.OPENED), (VentState.CLOSED)],
)
async def test_set_vent_state(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
    vent_state: VentState,
) -> None:
    """Ensure that the hardware controller calls the driver method w the correct arguments."""
    await subject.set_vent_state(vent_state=vent_state)
    decoy.verify(await mock_driver.set_vent_state(state=vent_state))


@pytest.mark.parametrize(
    (
        "enable_vacuum",
        "gauge_pressure_mbar",
        "duration",
        "timeout",
        "rate",
        "vent_after",
    ),
    [
        (True, 100.0, 67, 30, 55.5, False),
        (False, 99.8, 45, 30, 54, None),
    ],
)
async def test_set_vacuum_state(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    enable_vacuum: bool,
    gauge_pressure_mbar: Optional[float],
    duration: Optional[int],
    timeout: Optional[int],
    rate: Optional[float],
    vent_after: Optional[bool],
    decoy: Decoy,
) -> None:
    """Ensure that the hardware controller calls the driver method w the correct arguments."""
    await subject.set_vacuum_state(
        enable_vacuum=enable_vacuum,
        gauge_pressure_mbar=gauge_pressure_mbar,
        duration_s=duration,
        timeout_s=timeout,
        rate=rate,
        vent_after=vent_after,
    )
    decoy.verify(
        await mock_driver.set_vacuum_state(
            enable_vacuum=enable_vacuum,
            gauge_pressure_mbar=gauge_pressure_mbar,
            duration_s=duration,
            timeout_s=timeout,
            rate=rate,
            vent_after=vent_after,
        )
    )


@pytest.mark.parametrize(
    (
        "start_pump",
        "target_rpm",
        "duty_cycle",
        "duration_s",
        "timeout_s",
        "rate",
        "vent_after",
    ),
    [(True, 60, 75, 99, 89, None, False), (False, 0, 90, None, None, 22.2, None)],
)
async def test_set_pump_state(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
    start_pump: bool,
    target_rpm: int,
    duty_cycle: int,
    timeout_s: Optional[int],
    duration_s: Optional[int],
    rate: Optional[float],
    vent_after: Optional[bool],
) -> None:
    """Ensure that the hardware controller calls the driver method w the correct arguments."""
    await subject.set_pump_state(
        start_pump=start_pump,
        target_rpm=target_rpm,
        duty_cycle=duty_cycle,
        duration_s=duration_s,
        timeout_s=timeout_s,
        rate=rate,
        vent_after=vent_after,
    )
    decoy.verify(
        await mock_driver.set_pump_state(
            start_pump=start_pump,
            target_rpm=target_rpm,
            duty_cycle=duty_cycle,
            duration_s=duration_s,
            timeout_s=timeout_s,
            rate=rate,
            vent_after=vent_after,
        )
    )


@pytest.mark.parametrize(
    "pump_state",
    [
        PumpState(
            target_rpm=90,
            current_rpm=80,
            target_pwm=70,
            current_pwm=60,
            pump_running=False,
            manual_control=True,
        )
    ],
)
async def test_update_pump_state(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
    pump_state: PumpState,
) -> None:
    """Ensure that the module pump state gets update with the value the driver returns."""
    decoy.when(await mock_driver.get_pump_state()).then_return(pump_state)

    await subject._reader.update_pump_state()
    assert subject._reader.pump_state == pump_state


@pytest.mark.parametrize(
    "vacuum_state",
    [
        VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=0,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    ],
)
async def test_update_vacuum_state(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
    vacuum_state: VacuumState,
) -> None:
    """Ensure that the module vacuum state gets update with the value the driver returns."""
    decoy.when(await mock_driver.get_vacuum_state()).then_return(vacuum_state)

    await subject._reader.update_vacuum_state()
    assert subject._reader.vacuum_state == vacuum_state


@pytest.mark.parametrize(
    ("pressure_readings", "power_readings"),
    [
        (
            [0, 0, -100, -200, -300, -275, -300],
            [0, 0, 30, 66, 67, 68, 75],
        )
    ],
)
async def test_wait_for_target(
    test_wait_for_target_subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
    pressure_readings: List[float],
    power_readings: List[int],
) -> None:
    """Ensure that the hc function reads the correct state and returns."""
    subject = test_wait_for_target_subject

    target_pwm = power_readings[-1]
    target_gauge_pressure = pressure_readings[-1]

    vacuum_states = [
        VacuumState(
            target_gauge_pressure=target_gauge_pressure,
            current_gauge_pressure=_pressure,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=True,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
        for _pressure in pressure_readings
    ]
    pump_states = [
        PumpState(
            target_rpm=90,
            current_rpm=80,
            target_pwm=target_pwm,
            current_pwm=_pwm,
            pump_running=True,
            manual_control=True,
        )
        for _pwm in power_readings
    ]

    pressure_read_calls = 0

    async def _pressure_reading_side_effect() -> VacuumState:
        nonlocal pressure_read_calls
        pressure_read_calls += 1
        if pressure_read_calls < len(pressure_readings):
            return vacuum_states[pressure_read_calls - 1]
        else:
            return vacuum_states[-1]

    power_read_calls = 0

    async def _power_reading_side_effect() -> PumpState:
        nonlocal power_read_calls
        power_read_calls += 1
        if power_read_calls < len(power_readings):
            return pump_states[power_read_calls - 1]
        else:
            return pump_states[-1]

    decoy.when(await mock_driver.get_vacuum_state()).then_do(
        _pressure_reading_side_effect
    )
    decoy.when(await mock_driver.get_pump_state()).then_do(_power_reading_side_effect)

    # Stop the background poller so only wait_for_target state reads are counted.
    # Otherwise parallel poller reads race and flake under CI load.
    await subject._poller.stop()

    with mock.patch(
        "opentrons.hardware_control.modules.vacuum_module.TARGET_REACHED_POLL_PERIOD",
        0.0,
    ):
        power_read_calls = 0
        await subject.set_pump_state(start_pump=True, duty_cycle=target_pwm)
        await subject.wait_for_target()
        power_reads_while_waiting = power_read_calls

        pressure_read_calls = 0
        await subject.set_vacuum_state(
            enable_vacuum=True, gauge_pressure_mbar=target_gauge_pressure
        )
        await subject.wait_for_target()
        pressure_reads_while_waiting = pressure_read_calls

    assert len(pressure_readings) == len(power_readings)

    expected_pressure_reads = len(pressure_readings) + PRESSURE_COMPARISON_WINDOW_SIZE
    expected_power_reads = len(power_readings) + POWER_COMPARISON_WINDOW_SIZE - 1

    assert expected_pressure_reads >= pressure_reads_while_waiting
    assert expected_power_reads >= power_reads_while_waiting


async def test_execute_profile(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Ensure that execute_profile calls down to the correct hardware control functions in the right quantity."""
    profile: List[
        Union[VacuumModuleCycle, VacuumModulePowerStep, VacuumModulePressureStep]
    ] = [
        {
            "enable_pump": True,
            "hold_time_seconds": 43,
            "hold_time_minutes": 5,
            "ramp_rate": 1.3,
            "timeout_seconds": 1101,
            "vent_after": True,
            "gauge_pressure_mbar": -300,
        },
        {
            "enable_pump": True,
            "hold_time_seconds": 50,
            "hold_time_minutes": 1,
            "ramp_rate": 1.4,
            "timeout_seconds": 1101,
            "vent_after": False,
            "percent_power": 61,
        },
        {
            "steps": [
                {
                    "enable_pump": True,
                    "hold_time_seconds": 9,
                    "hold_time_minutes": 2,
                    "ramp_rate": 0.9,
                    "timeout_seconds": 1101,
                    "vent_after": False,
                    "percent_power": 99,
                },
                {
                    "enable_pump": True,
                    "hold_time_seconds": 99,
                    "hold_time_minutes": 9,
                    "ramp_rate": 1.8,
                    "timeout_seconds": 1101,
                    "vent_after": True,
                    "gauge_pressure_mbar": -99,
                },
                {
                    "enable_pump": True,
                    "hold_time_seconds": 9,
                    "hold_time_minutes": 2,
                    "ramp_rate": 0.9,
                    "timeout_seconds": 1101,
                    "vent_after": False,
                    "percent_power": 11,
                },
            ],
            "repetitions": 9,
            "vent_after": True,
        },
        {
            "enable_pump": False,
            "hold_time_seconds": None,
            "hold_time_minutes": 12,
            "ramp_rate": 5.5,
            "timeout_seconds": 1101,
            "vent_after": False,
            "gauge_pressure_mbar": -111,
        },
    ]

    decoy.when(await mock_driver.get_vacuum_state()).then_return(
        VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=0,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=True,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    )
    decoy.when(await mock_driver.get_pump_state()).then_return(
        PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=True,
            manual_control=True,
        )
    )

    async def _fake_wait_for_target() -> None:
        return

    subject.wait_for_target = _fake_wait_for_target  # type: ignore[method-assign]

    await subject.execute_profile(profile)

    decoy.verify(
        await mock_driver.set_vacuum_state(
            enable_vacuum=True,
            gauge_pressure_mbar=-300,
            duration_s=343,
            timeout_s=1101,
            rate=1.3,
            vent_after=True,
        ),
    )
    decoy.verify(
        await mock_driver.set_pump_state(
            start_pump=True,
            target_rpm=None,
            duty_cycle=61,
            duration_s=110,
            timeout_s=1101,
            rate=1.4,
            vent_after=False,
        )
    )
    decoy.verify(
        await mock_driver.set_vacuum_state(
            enable_vacuum=False
        ),  # there should be a call to disable pressure control for every set_pump_state call
    )
    for i in range(9):
        decoy.verify(
            await mock_driver.set_pump_state(
                start_pump=True,
                target_rpm=None,
                duty_cycle=99,
                duration_s=129,
                timeout_s=1101,
                rate=0.9,
                vent_after=False,
            )
        )
        decoy.verify(await mock_driver.set_vacuum_state(enable_vacuum=False))
        decoy.verify(
            await mock_driver.set_vacuum_state(
                enable_vacuum=True,
                gauge_pressure_mbar=-99,
                duration_s=639,
                timeout_s=1101,
                rate=1.8,
                vent_after=True,
            )
        )

        decoy.verify(
            await mock_driver.set_pump_state(
                start_pump=True,
                target_rpm=None,
                duty_cycle=11,
                duration_s=129,
                timeout_s=1101,
                rate=0.9,
                vent_after=False,
            )
        )
        decoy.verify(await mock_driver.set_vacuum_state(enable_vacuum=False))

    decoy.verify(await mock_driver.set_vent_state(state=VentState.OPENED))
    decoy.verify(
        await mock_driver.set_vacuum_state(
            enable_vacuum=False,
            gauge_pressure_mbar=-111,
            duration_s=720,
            timeout_s=1101,
            rate=5.5,
            vent_after=False,
        )
    )


async def test_configure_device_applies_waste_and_pressure_defaults(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Connect-time configuration should apply waste and PID defaults."""
    await subject._configure_device()

    waste = DEFAULT_WASTE_CONFIG
    decoy.verify(
        await mock_driver.set_waste_configs(
            enable_waste_full_detection=waste.waste_detection_enabled,
            p_window_start=waste.p_window_start,
            p_window_end=waste.p_window_end,
            baseline_fast_factor=waste.baseline_fast_factor,
            max_delta_per_tick=waste.max_delta_per_tick,
            max_rise_per_tick=waste.max_rise_per_tick,
            max_cummulative_rise=waste.max_cummulative_rise,
            p_filter_alpha=waste.p_filter_alpha,
            min_window_time=waste.min_window_time,
            max_window_time=waste.max_window_time,
        ),
    )
    pid = DEFAULT_PRESSURE_CONTROL_TUNINGS
    decoy.verify(
        await mock_driver.set_pressure_control_tunings(
            kp=pid.kp,
            ki=pid.ki,
            kd=pid.kd,
            overshoot=pid.overshoot_error,
            k_velocity=pid.k_velocity,
            k_holding=pid.k_holding,
            tolerance=pid.tolerance_error,
            approach_band=pid.approach_band,
            slew_end_fraction=pid.slew_end_fraction,
        ),
    )


async def test_stop_vacuum_stops_pressure_and_pump_and_clears_targets(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """stop_vacuum should disable pressure control, stop the pump, and clear targets."""
    subject._reader.set_target_pressure(-100.0)
    subject._reader.set_target_power(50.0)
    assert subject._profile_stop_requested is False

    await subject.stop_vacuum()

    decoy.verify(await mock_driver.set_vacuum_state(enable_vacuum=False))
    decoy.verify(await mock_driver.set_pump_state(start_pump=False))
    assert subject._reader.target_pressure is None
    assert subject._reader.get_target_power() is None
    assert subject._profile_stop_requested is True


async def test_deactivate_stops_vacuum_and_opens_vent(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Deactivate should stop vacuum control, open the vent, and clear targets."""
    subject._reader.set_target_pressure(-100.0)
    subject._reader.set_target_power(50.0)

    await subject.deactivate(must_be_running=False)

    decoy.verify(await mock_driver.set_vacuum_state(enable_vacuum=False))
    decoy.verify(await mock_driver.set_pump_state(start_pump=False))
    decoy.verify(await mock_driver.set_vent_state(VentState.OPENED))
    assert subject._reader.target_pressure is None
    assert subject._reader.get_target_power() is None


async def test_move_port_updates_port_and_calls_driver(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """It should update the module's port and forward the new port to the driver."""
    new_usb_port = USBPort(
        name="b",
        port_number=5,
        device_path="/dev/ot_module_vacuummodule6",
    )
    await subject.move_port(port="/dev/ot_module_vacuummodule6", usb_port=new_usb_port)

    assert subject.port == "/dev/ot_module_vacuummodule6"
    assert subject.usb_port == new_usb_port
    decoy.verify(await mock_driver.move_port("/dev/ot_module_vacuummodule6"))


async def test_attempt_reconnect_skipped_off_robot(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """It should no-op the reconnect attempt when not running on a robot."""
    with mock.patch("opentrons.hardware_control.modules.vacuum_module.IS_ROBOT", False):
        await subject.attempt_reconnect()

    decoy.verify(await mock_driver.is_connected(), times=0)


async def test_attempt_reconnect_rebuilds_driver_when_disconnected(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """It should rebuild the driver when the connection is down."""
    decoy.when(await mock_driver.is_connected()).then_return(False)
    new_driver = decoy.mock(cls=SimulatingDriver)
    decoy.when(await new_driver.get_vacuum_state()).then_return(
        VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=0,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    )
    decoy.when(await new_driver.get_pump_state()).then_return(
        PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=False,
            manual_control=False,
        )
    )

    with (
        mock.patch("opentrons.hardware_control.modules.vacuum_module.IS_ROBOT", True),
        mock.patch(
            "opentrons.hardware_control.modules.vacuum_module.VacuumModuleDriver.create",
            mock.AsyncMock(return_value=new_driver),
        ) as create_mock,
    ):
        await subject.attempt_reconnect()

    create_mock.assert_called_once_with(port=subject.port, loop=subject.loop)
    assert subject._reader._driver is new_driver


async def test_attempt_reconnect_keeps_driver_when_still_connected(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """It should not rebuild the driver if the existing connection is still up."""
    decoy.when(await mock_driver.is_connected()).then_return(True)
    decoy.when(await mock_driver.get_vacuum_state()).then_return(
        VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=0,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    )
    decoy.when(await mock_driver.get_pump_state()).then_return(
        PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=False,
            manual_control=False,
        )
    )

    with (
        mock.patch("opentrons.hardware_control.modules.vacuum_module.IS_ROBOT", True),
        mock.patch(
            "opentrons.hardware_control.modules.vacuum_module.VacuumModuleDriver.create"
        ) as create_mock,
    ):
        await subject.attempt_reconnect()

    create_mock.assert_not_called()
    assert subject._reader._driver is mock_driver


async def test_attempt_reconnect_swallows_factory_failure(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """It should not raise if reconnect cannot reestablish the connection."""
    decoy.when(await mock_driver.is_connected()).then_return(False)
    with (
        mock.patch("opentrons.hardware_control.modules.vacuum_module.IS_ROBOT", True),
        mock.patch(
            "opentrons.hardware_control.modules.vacuum_module.VacuumModuleDriver.create",
            mock.AsyncMock(side_effect=OSError("port gone")),
        ),
    ):
        await subject.attempt_reconnect()


async def test_execute_profile_aborts_when_stopped(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Stopping vacuum during a profile should abort remaining steps and vent_after."""
    profile: List[
        Union[VacuumModuleCycle, VacuumModulePowerStep, VacuumModulePressureStep]
    ] = [
        {
            "enable_pump": True,
            "hold_time_seconds": 10,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": None,
            "gauge_pressure_mbar": -100,
        },
        {
            "enable_pump": True,
            "hold_time_seconds": 10,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": None,
            "gauge_pressure_mbar": -200,
        },
    ]

    decoy.when(await mock_driver.get_vacuum_state()).then_return(
        VacuumState(
            target_gauge_pressure=-100,
            current_gauge_pressure=-100,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=True,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    )

    execute_step_count = 0
    original_execute_cycle_step = subject._execute_cycle_step

    async def counting_execute_cycle_step(step: VacuumModuleStep) -> None:
        nonlocal execute_step_count
        execute_step_count += 1
        await original_execute_cycle_step(step)

    async def stop_on_first_wait() -> None:
        # Host-requested stop (not firmware natural duration end).
        await subject.stop_vacuum()

    subject._execute_cycle_step = counting_execute_cycle_step  # type: ignore[method-assign]
    subject.wait_for_command_duration = stop_on_first_wait  # type: ignore[method-assign]

    await subject.execute_profile(profile, vent_after=True)

    assert execute_step_count == 1
    assert subject._profile_stop_requested is True
    decoy.verify(
        await mock_driver.set_vacuum_state(
            enable_vacuum=True,
            gauge_pressure_mbar=-100,
            duration_s=10,
            timeout_s=None,
            rate=None,
            vent_after=None,
        ),
    )
    decoy.verify(await mock_driver.set_vent_state(state=VentState.OPENED), times=0)


async def test_execute_profile_aborts_on_stop_during_pump_disabled_step(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """stop_vacuum during enable_pump=False must still abort remaining steps.

    Abort is driven only by _profile_stop_requested, not the current step's
    enable_pump value.
    """
    profile: List[
        Union[VacuumModuleCycle, VacuumModulePowerStep, VacuumModulePressureStep]
    ] = [
        {
            "enable_pump": False,
            "hold_time_seconds": 10,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": None,
            "gauge_pressure_mbar": None,
        },
        {
            "enable_pump": True,
            "hold_time_seconds": 10,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": None,
            "gauge_pressure_mbar": -200,
        },
    ]

    execute_step_count = 0
    original_execute_cycle_step = subject._execute_cycle_step

    async def counting_execute_cycle_step(step: VacuumModuleStep) -> None:
        nonlocal execute_step_count
        execute_step_count += 1
        await original_execute_cycle_step(step)

    async def stop_on_first_wait() -> None:
        await subject.stop_vacuum()

    subject._execute_cycle_step = counting_execute_cycle_step  # type: ignore[method-assign]
    subject.wait_for_command_duration = stop_on_first_wait  # type: ignore[method-assign]

    await subject.execute_profile(profile, vent_after=True)

    assert execute_step_count == 1
    assert subject._profile_stop_requested is True
    decoy.verify(await mock_driver.set_vent_state(state=VentState.OPENED), times=0)


async def test_execute_profile_continues_after_natural_duration_end(
    subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Firmware clears running flags when duration ends; profile must continue.

    Mirrors vacuum firmware vacuum_timer_end_callback, which sets
    enable_vacuum=false and then stop_vacuum() (pump stopped). Without an
    explicit host stop_vacuum, remaining pressure/power steps must still run.
    """
    profile: List[
        Union[VacuumModuleCycle, VacuumModulePowerStep, VacuumModulePressureStep]
    ] = [
        {
            "enable_pump": True,
            "hold_time_seconds": 5,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": False,
            "gauge_pressure_mbar": -200,
        },
        {
            "enable_pump": True,
            "hold_time_seconds": 5,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": False,
            "gauge_pressure_mbar": -400,
        },
        {
            "enable_pump": True,
            "hold_time_seconds": 5,
            "hold_time_minutes": None,
            "ramp_rate": None,
            "timeout_seconds": None,
            "vent_after": False,
            "percent_power": 30,
        },
    ]

    # After each timed step, firmware reports duration complete and idle.
    decoy.when(await mock_driver.get_vacuum_state()).then_return(
        VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=-200,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
    )
    decoy.when(await mock_driver.get_pump_state()).then_return(
        PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=False,
            manual_control=False,
        )
    )

    execute_step_count = 0
    original_execute_cycle_step = subject._execute_cycle_step

    async def counting_execute_cycle_step(step: VacuumModuleStep) -> None:
        nonlocal execute_step_count
        execute_step_count += 1
        await original_execute_cycle_step(step)

    async def _fake_wait_for_command_duration() -> None:
        # Simulate natural duration end without host stop_vacuum.
        subject._reader.vacuum_state = VacuumState(
            target_gauge_pressure=0,
            current_gauge_pressure=-200,
            pressure_abs_a=0,
            pressure_abs_b=0,
            pressure_atm=0,
            vacuum_enabled=False,
            vacuum_duration=0,
            vent_state=VentState.CLOSED,
        )
        subject._reader.pump_state = PumpState(
            target_rpm=0,
            current_rpm=0,
            target_pwm=0,
            current_pwm=0,
            pump_running=False,
            manual_control=False,
        )

    subject._execute_cycle_step = counting_execute_cycle_step  # type: ignore[method-assign]
    subject.wait_for_command_duration = (  # type: ignore[method-assign]
        _fake_wait_for_command_duration
    )

    await subject.execute_profile(profile, vent_after=False)

    assert execute_step_count == 3
    # Natural duration end leaves hardware idle, but does not set the host flag.
    assert subject._profile_stop_requested is False
    decoy.verify(
        await mock_driver.set_vacuum_state(
            enable_vacuum=True,
            gauge_pressure_mbar=-200,
            duration_s=5,
            timeout_s=None,
            rate=None,
            vent_after=False,
        ),
        await mock_driver.set_vacuum_state(
            enable_vacuum=True,
            gauge_pressure_mbar=-400,
            duration_s=5,
            timeout_s=None,
            rate=None,
            vent_after=False,
        ),
        await mock_driver.set_vacuum_state(False),
        await mock_driver.set_pump_state(
            start_pump=True,
            target_rpm=None,
            duty_cycle=30,
            duration_s=5,
            timeout_s=None,
            rate=None,
            vent_after=False,
        ),
    )


def test_async_error_callback_does_not_escalate_parse_errors(
    subject: modules.VacuumModule,
    module_error_callback: ModuleErrorCallback,
    decoy: Decoy,
) -> None:
    """A poll parse miss must not become an asynchronous module error."""
    parse_error = ValueError(
        "Incorrect Response for get pump state: "
        "M121 T:0.0 C:-5.7 A:1008.6 B:1007.4 H:1013.1 E:0 D:0 V:1"
    )

    subject._reader.on_error(parse_error)

    decoy.verify(
        module_error_callback(
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
        ),
        times=0,
    )
    assert subject._reader.error is not None
    assert "Incorrect Response for get pump state" in subject._reader.error


def test_reader_on_error_still_escalates_firmware_errors(
    subject: modules.VacuumModule,
    module_error_callback: ModuleErrorCallback,
    decoy: Decoy,
) -> None:
    """Firmware poll errors should still reach the module error callback."""
    _set_reader_async_error_context(
        subject._reader,
        mode=VacuumOperationMode.PRESSURE,
        target=-500.0,
        current=-300.0,
    )
    subject._reader.on_error(
        WasteContainerFull("port", "async ERR401:waste full", "M121")
    )
    decoy.verify(
        module_error_callback(
            VacuumModuleWasteFullError("dummySerialFS", "pressure", -500.0, -300.0),
            "vacuumModuleV1",
            "/dev/ot_module_sim_vacuummodule0",
            "dummySerialFS",
        )
    )


@pytest.mark.parametrize(
    ("driver_error", "expected_error"),
    [
        (
            PressureNotReached("port", "response", "command"),
            VacuumModulePressureNotReachedError(
                "dummySerialFS", "pressure", -500.0, -300.0
            ),
        ),
        (
            WasteContainerFull("port", "response", "command"),
            VacuumModuleWasteFullError("dummySerialFS", "pressure", -500.0, -300.0),
        ),
    ],
)
def test_async_error_callback_maps_driver_errors(
    subject: modules.VacuumModule,
    module_error_callback: ModuleErrorCallback,
    decoy: Decoy,
    driver_error: Exception,
    expected_error: Exception,
) -> None:
    """It should map vacuum module driver async errors to enumerated errors."""
    _set_reader_async_error_context(
        subject._reader,
        mode=VacuumOperationMode.PRESSURE,
        target=-500.0,
        current=-300.0,
    )
    subject._async_error_callback(driver_error)
    decoy.verify(
        module_error_callback(
            expected_error,
            "vacuumModuleV1",
            "/dev/ot_module_sim_vacuummodule0",
            "dummySerialFS",
        )
    )


def test_async_error_callback_includes_operation_mode_in_pressure_error_detail(
    subject: modules.VacuumModule,
    module_error_callback: ModuleErrorCallback,
    decoy: Decoy,
) -> None:
    """Pressure-not-reached async errors should include the active operation mode."""
    _set_reader_async_error_context(
        subject._reader,
        mode=VacuumOperationMode.PRESSURE,
        target=-500.0,
        current=-300.0,
    )
    subject._async_error_callback(
        PressureNotReached("port", "async ERR400:pressure not reached", "M121")
    )
    decoy.verify(
        module_error_callback(
            VacuumModulePressureNotReachedError(
                "dummySerialFS", "pressure", -500.0, -300.0
            ),
            "vacuumModuleV1",
            "/dev/ot_module_sim_vacuummodule0",
            "dummySerialFS",
        )
    )


@pytest.fixture
async def sim_vacuum_with_injected_error(
    usb_port: USBPort,
    mock_execution_manager: ExecutionManager,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> AsyncGenerator[tuple[modules.VacuumModule, List[Exception]], None]:
    """Build a sim vacuum module wired to capture async errors from polling."""
    driver = SimulatingDriver(serial_number="dummySerialFS")
    reader = VacuumModuleReader(driver=driver)
    poller = Poller(reader=reader, interval=SIMULATING_POLL_PERIOD)
    received_errors: List[Exception] = []

    def error_callback(
        exc: Exception,
        model: str,
        port: str,
        serial: str | None,
    ) -> None:
        received_errors.append(exc)

    vacuum = modules.VacuumModule(
        port="/dev/ot_module_sim_vacuummodule0",
        usb_port=usb_port,
        driver=driver,
        reader=reader,
        poller=poller,
        device_info={
            "serial": "dummySerialFS",
            "model": "nff",
            "version": "vacuum-fw",
            "reset_reason": "0",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=error_callback,
        disconnected_callback=module_disconnected_callback,
    )

    await poller.start()
    try:
        yield vacuum, received_errors
    finally:
        await vacuum.cleanup()


async def test_wait_for_target_reraises_waste_full_as_enumerated_error(
    test_wait_for_target_subject: modules.VacuumModule,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Background wait paths must raise recoverable enumerated vacuum errors.

    Protocol engine associates recovery via FinishTaskAction error codes. Raw
    driver WasteContainerFull becomes GENERAL_ERROR and waitForTasks fails the
    run; VacuumModuleWasteFullError enters associated-command recovery instead.
    """
    subject = test_wait_for_target_subject
    await subject._poller.stop()
    subject._reader.set_operation_mode(VacuumOperationMode.PRESSURE)
    subject._reader.set_target_pressure(-300.0)
    subject._reader.vacuum_state = VacuumState(
        target_gauge_pressure=-300.0,
        current_gauge_pressure=-50.0,
        pressure_abs_a=0,
        pressure_abs_b=0,
        pressure_atm=0,
        vacuum_enabled=True,
        vacuum_duration=0,
        vent_state=VentState.CLOSED,
    )

    decoy.when(await mock_driver.get_vacuum_state()).then_raise(
        WasteContainerFull("port", "async ERR401:waste full", "M121")
    )

    with mock.patch(
        "opentrons.hardware_control.modules.vacuum_module.TARGET_REACHED_POLL_PERIOD",
        0.0,
    ):
        with pytest.raises(VacuumModuleWasteFullError) as exc_info:
            await subject.wait_for_target()

    assert exc_info.value.serial == subject.serial_number


async def test_injected_async_error_reaches_module_error_callback(
    sim_vacuum_with_injected_error: tuple[modules.VacuumModule, List[Exception]],
) -> None:
    """Injected driver errors should bubble through the poller to the module callback."""
    vacuum, received_errors = sim_vacuum_with_injected_error
    driver = vacuum._driver
    assert isinstance(driver, SimulatingDriver)

    driver.inject_async_error(
        WasteContainerFull("port", "async ERR401:waste full", "M121")
    )

    # The poller surfaces read failures to waiters; sleep for a background poll cycle.
    await asyncio.sleep(SIMULATING_POLL_PERIOD * 3)

    assert len(received_errors) == 1
    assert isinstance(received_errors[0], VacuumModuleWasteFullError)
    assert received_errors[0].serial == "dummySerialFS"


async def test_inject_async_gcode_response_reaches_module_error_callback(
    sim_vacuum_with_injected_error: tuple[modules.VacuumModule, List[Exception]],
) -> None:
    """G-code injection should parse ERR401 and reach the module error callback."""
    vacuum, received_errors = sim_vacuum_with_injected_error

    vacuum.inject_async_gcode_response("async ERR401:waste container full")

    await asyncio.sleep(SIMULATING_POLL_PERIOD * 3)

    assert len(received_errors) == 1
    assert isinstance(received_errors[0], VacuumModuleWasteFullError)
