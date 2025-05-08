import asyncio
import pytest
import mock
from typing import AsyncGenerator
from opentrons.drivers.flex_stacker.driver import (
    STACKER_MOTION_CONFIG,
)
from opentrons.drivers.flex_stacker.simulator import SimulatingDriver
from opentrons.drivers.flex_stacker.types import (
    Direction,
    LimitSwitchStatus,
    PlatformStatus,
    StackerAxis,
)
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.modules.flex_stacker import (
    SIMULATING_POLL_PERIOD,
    FlexStackerReader,
)
from opentrons.hardware_control.modules.types import PlatformState
from opentrons.hardware_control.poller import Poller


@pytest.fixture
def usb_port() -> USBPort:
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_flexstacker0",
    )


@pytest.fixture
def mock_driver() -> mock.AsyncMock:
    return mock.AsyncMock(spec=SimulatingDriver)


@pytest.fixture
async def subject(
    usb_port: USBPort,
    mock_driver: mock.AsyncMock,
) -> AsyncGenerator[modules.FlexStacker, None]:
    """Test subject with mocked driver"""
    reader = FlexStackerReader(driver=mock_driver)
    poller = Poller(reader=reader, interval=SIMULATING_POLL_PERIOD)
    stacker = modules.FlexStacker(
        port="/dev/ot_module_sim_flexstacker0",
        usb_port=usb_port,
        driver=mock_driver,
        reader=reader,
        poller=poller,
        device_info={
            "serial": "dummySerialFS",
            "model": "a1",
            "version": "stacker-fw",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    await poller.start()
    try:
        yield stacker
    finally:
        await stacker.cleanup()


async def test_sim_state(subject: modules.FlexStacker) -> None:
    status = subject.device_info
    assert status["serial"] == "dummySerialFS"
    assert status["model"] == "a1"
    assert status["version"] == "stacker-fw"


async def test_set_run_hold_current(
    subject: modules.FlexStacker, mock_driver: mock.AsyncMock
) -> None:
    mock_driver.get_platform_status.side_effect = [
        PlatformStatus(True, False),
        PlatformStatus(False, True),
    ]
    mock_driver.get_limit_switches_status.side_effect = [
        LimitSwitchStatus(False, True, False, False, False),
        LimitSwitchStatus(True, True, False, False, False),
    ]

    # Test move_axis

    # run and hold current are 0 by default
    assert subject._reader.motion_params[StackerAxis.X].run_current == 0
    assert subject._reader.motion_params[StackerAxis.X].hold_current == 0
    default = STACKER_MOTION_CONFIG[StackerAxis.X]["move"]

    # Call the move_axis function with default current
    await subject.move_axis(StackerAxis.X, Direction.EXTEND, 44)
    # set_run_current should be called and run_current recorded
    mock_driver.set_run_current.assert_called_with(StackerAxis.X, default.run_current)
    mock_driver.set_ihold_current.assert_called_with(
        StackerAxis.X, default.hold_current
    )
    motion_params = subject._reader.motion_params[StackerAxis.X]
    assert motion_params.run_current == default.run_current
    assert motion_params.hold_current == default.hold_current
    mock_driver.set_run_current.reset_mock()
    mock_driver.set_ihold_current.reset_mock()

    # Make sure set_run_current and set_ihold_current are not called again
    await subject.move_axis(StackerAxis.X, Direction.EXTEND, 44)
    mock_driver.set_run_current.assert_not_called()
    mock_driver.set_ihold_current.assert_not_called()
    motion_params = subject._reader.motion_params[StackerAxis.X]
    assert motion_params.run_current == default.run_current
    assert motion_params.hold_current == default.hold_current

    # Test home_axis

    # Reset the run/hold current recorded
    default = STACKER_MOTION_CONFIG[StackerAxis.X]["home"]
    subject._reader.motion_params[StackerAxis.X].run_current = 0
    subject._reader.motion_params[StackerAxis.X].hold_current = 0

    # Call the home_axis function with default current
    await subject.home_axis(StackerAxis.X, Direction.EXTEND)
    mock_driver.set_run_current.assert_called_with(StackerAxis.X, default.run_current)
    mock_driver.set_ihold_current.assert_called_with(
        StackerAxis.X, default.hold_current
    )
    motion_params = subject._reader.motion_params[StackerAxis.X]
    assert motion_params.run_current == default.run_current
    assert motion_params.hold_current == default.hold_current
    mock_driver.set_run_current.reset_mock()
    mock_driver.set_ihold_current.reset_mock()

    # Make sure set_run_current and set_ihold_current are not called again
    await subject.home_axis(StackerAxis.X, Direction.EXTEND, 44)
    mock_driver.set_run_current.assert_not_called()
    mock_driver.set_ihold_current.assert_not_called()

    # The recorded run/hold current should stay the same
    motion_params = subject._reader.motion_params[StackerAxis.X]
    assert motion_params.run_current == default.run_current
    assert motion_params.hold_current == default.hold_current
    mock_driver.set_run_current.reset_mock()
    mock_driver.set_ihold_current.reset_mock()


PLATFORM_STATUS_UNKNOWN = PlatformStatus(False, False)
PLATFORM_STATUS_EXTENDED = PlatformStatus(True, False)
PLATFORM_STATUS_RETRACTED = PlatformStatus(False, True)

X_UNKNOWN = LimitSwitchStatus(False, False, False, False, False)
X_EXTENDED = LimitSwitchStatus(True, False, False, False, False)
X_RETRACTED = LimitSwitchStatus(False, True, False, False, False)


@pytest.mark.parametrize("x_status", [X_EXTENDED, X_RETRACTED, X_UNKNOWN])
@pytest.mark.parametrize(
    "platform_status,expected",
    [
        (PLATFORM_STATUS_RETRACTED, PlatformState.RETRACTED),
        (PLATFORM_STATUS_EXTENDED, PlatformState.EXTENDED),
    ],
)
async def test_platform_state(
    subject: modules.FlexStacker,
    mock_driver: mock.AsyncMock,
    x_status: LimitSwitchStatus,
    platform_status: PlatformStatus,
    expected: PlatformState,
) -> None:
    """Test that the platform state is correctly determined."""
    mock_driver.get_platform_status.return_value = platform_status
    mock_driver.get_limit_switches_status.return_value = x_status

    # update the cached value
    await subject._reader.get_limit_switch_status()
    await subject._reader.get_platform_sensor_state()
    assert subject._get_platform_live_data() == expected


@pytest.mark.parametrize(
    "x_status,expected",
    [
        (X_EXTENDED, PlatformState.MISSING),
        (X_RETRACTED, PlatformState.MISSING),
        (X_UNKNOWN, PlatformState.UNKNOWN),
    ],
)
async def test_platform_state_unknown(
    subject: modules.FlexStacker,
    mock_driver: mock.AsyncMock,
    x_status: LimitSwitchStatus,
    expected: PlatformState,
) -> None:
    """Test that the platform state is correctly determined."""
    mock_driver.get_platform_status.return_value = PLATFORM_STATUS_UNKNOWN
    mock_driver.get_limit_switches_status.return_value = x_status

    # update the value
    await subject._reader.get_limit_switch_status()
    await subject._reader.get_platform_sensor_state()
    assert subject._get_platform_live_data() == expected
