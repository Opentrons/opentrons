import asyncio
from typing import AsyncGenerator

import pytest
from decoy import Decoy

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.vacuum_module.simulator import SimulatingDriver
from opentrons.drivers.vacuum_module.types import (
    HardwareRevision,
    LEDColor,
    LEDPattern,
    VacuumModuleInfo,
)
from opentrons.hardware_control import ExecutionManager, modules
from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
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
            "model": "a1",
            "version": "vacuum-fw",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    decoy.when(await mock_driver.get_device_info()).then_return(
        VacuumModuleInfo(fw="vacuum-fw", hw=HardwareRevision.NFF, sn="dummySerialFS")
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
    assert status["model"] == "a1"
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
