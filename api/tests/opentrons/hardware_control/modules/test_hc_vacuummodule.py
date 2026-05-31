import asyncio
from typing import AsyncGenerator, List, Optional, Union

import pytest
from decoy import Decoy

from opentrons.drivers.rpi_drivers.types import USBPort
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
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    VacuumModuleCycle,
    VacuumModulePowerStep,
    VacuumModulePressureStep,
)
from opentrons.hardware_control.modules.vacuum_module import (
    SIMULATING_POLL_PERIOD,
    VacuumModuleReader,
)
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent


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
