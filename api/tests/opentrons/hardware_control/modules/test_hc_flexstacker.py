import asyncio
import pytest
import mock
from typing import AsyncGenerator
from opentrons.drivers.flex_stacker.simulator import SimulatingDriver
from opentrons.drivers.flex_stacker.types import (
    Direction,
    LimitSwitchStatus,
    PlatformStatus,
    StackerAxis,
    LEDColor,
    LEDPattern,
)
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.modules.flex_stacker import (
    LATCH_CLEARANCE,
    MAX_TRAVEL,
    HOME_OFFSET_MD,
    HOME_OFFSET_SM,
    PLATFORM_OFFSET,
    SIMULATING_POLL_PERIOD,
    STACKER_MOTION_CONFIG,
    FlexStackerReader,
)
from opentrons.hardware_control.modules.types import PlatformState
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent


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
    assert subject.platform_state == expected


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
    assert subject.platform_state == expected


@pytest.mark.parametrize(
    ("should_identify", "hopper_door", "event", "result_params"),
    [
        (  # running
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.RUNNING, enabled=True),
            (0.5, LEDColor.GREEN, LEDPattern.STATIC, None),
        ),
        (  # paused - door open
            False,
            False,
            StatusBarUpdateEvent(state=StatusBarState.PAUSED, enabled=True),
            (0.5, LEDColor.BLUE, LEDPattern.PULSE, 2000),
        ),
        (  # paused - should identify
            True,
            True,
            StatusBarUpdateEvent(state=StatusBarState.PAUSED, enabled=True),
            (0.5, LEDColor.BLUE, LEDPattern.PULSE, 2000),
        ),
        (  # paused - door closed not identified
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.PAUSED, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # idle - door open
            False,
            False,
            StatusBarUpdateEvent(state=StatusBarState.IDLE, enabled=True),
            (0.5, LEDColor.BLUE, LEDPattern.PULSE, 2000),
        ),
        (  # idle - door closed
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.IDLE, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # hardware error - identified
            True,
            True,
            StatusBarUpdateEvent(state=StatusBarState.HARDWARE_ERROR, enabled=True),
            (0.5, LEDColor.RED, LEDPattern.FLASH, 300),
        ),
        (  # hardware error - not identified
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.HARDWARE_ERROR, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # software error
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.SOFTWARE_ERROR, enabled=True),
            (0.5, LEDColor.YELLOW, LEDPattern.STATIC, None),
        ),
        (  # error recovery - door open
            False,
            False,
            StatusBarUpdateEvent(state=StatusBarState.ERROR_RECOVERY, enabled=True),
            (0.5, LEDColor.BLUE, LEDPattern.PULSE, 2000),
        ),
        (  # error recovery - should identify
            True,
            True,
            StatusBarUpdateEvent(state=StatusBarState.ERROR_RECOVERY, enabled=True),
            (0.5, LEDColor.YELLOW, LEDPattern.PULSE, 2000),
        ),
        (  # error recovery - door closed
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.ERROR_RECOVERY, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.STATIC, None),
        ),
        (  # run complete
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.RUN_COMPLETED, enabled=True),
            (0.5, LEDColor.GREEN, LEDPattern.PULSE, None),
        ),
        (  # updating
            False,
            True,
            StatusBarUpdateEvent(state=StatusBarState.UPDATING, enabled=True),
            (0.5, LEDColor.WHITE, LEDPattern.PULSE, None),
        ),
    ],
)
async def test_stacker_status_bar_event_handler(
    subject: modules.FlexStacker,
    mock_driver: mock.AsyncMock,
    should_identify: bool,
    hopper_door: bool,
    event: StatusBarUpdateEvent,
    result_params: tuple[float, LEDColor, LEDPattern, int | None],
) -> None:
    mock_driver.get_hopper_door_closed.return_value = hopper_door
    subject.set_stacker_identify(should_identify)
    await subject._reader.get_door_closed()
    await subject._handle_status_bar_event(event)
    mock_driver.set_led.assert_called_with(
        result_params[0],
        color=result_params[1],
        pattern=result_params[2],
        duration=result_params[3],
        reps=None,
    )


@pytest.mark.parametrize(
    ("labware_height"),
    [(16), (100)],
)
async def test_store_labware_motion_sequence(
    subject: modules.FlexStacker,
    labware_height: float,
) -> None:
    """
    Test successful storage labware with labware sensing enforced.
    """
    with (
        mock.patch.object(
            subject, "_prepare_for_action", mock.AsyncMock()
        ) as _prepare_for_action,
        mock.patch.object(
            subject, "_move_and_home_axis", mock.AsyncMock()
        ) as _move_and_home_axis,
        mock.patch.object(
            subject, "verify_shuttle_labware_presence", mock.AsyncMock()
        ) as verify_shuttle_labware_presence,
        mock.patch.object(subject, "move_axis", mock.AsyncMock()) as move_axis,
        mock.patch.object(subject, "home_axis", mock.AsyncMock()) as home_axis,
        mock.patch.object(subject, "open_latch", mock.AsyncMock()) as open_latch,
        mock.patch.object(subject, "close_latch", mock.AsyncMock()) as close_latch,
    ):
        # Test valid labware height
        await subject.store_labware(
            labware_height=labware_height,
            enforce_shuttle_lw_sensing=True,
        )

        # We need to verify the move sequence
        _prepare_for_action.assert_called()
        _move_and_home_axis.assert_any_call(
            StackerAxis.X, Direction.RETRACT, HOME_OFFSET_MD
        )
        verify_shuttle_labware_presence.assert_any_call(Direction.RETRACT, True)

        # Assertions for offset calculation and move_axis
        latch_clear_distance = labware_height + PLATFORM_OFFSET + LATCH_CLEARANCE
        distance = MAX_TRAVEL[StackerAxis.Z] - latch_clear_distance
        move_axis.assert_any_call(StackerAxis.Z, Direction.EXTEND, distance)

        # Verify labware transfer
        open_latch.assert_called_once()
        z_distance = latch_clear_distance - HOME_OFFSET_SM
        z_speed = STACKER_MOTION_CONFIG[StackerAxis.Z]["move"].move_params.max_speed / 2
        move_axis.assert_any_call(StackerAxis.Z, Direction.EXTEND, z_distance, z_speed)
        home_axis.assert_any_call(StackerAxis.Z, Direction.EXTEND, z_speed)
        close_latch.assert_called_once()

        # Now the z can be moved down and verify no labware is detected
        _move_and_home_axis.assert_any_call(
            StackerAxis.Z, Direction.RETRACT, HOME_OFFSET_MD
        )
        verify_shuttle_labware_presence.assert_any_call(Direction.RETRACT, False)

        # Then finally the x is moved to the gripper position
        _move_and_home_axis.assert_any_call(
            StackerAxis.X, Direction.EXTEND, HOME_OFFSET_MD
        )


@pytest.mark.parametrize(
    ("labware_height"),
    [(16), (100)],
)
async def test_dispense_labware_motion_sequence(
    subject: modules.FlexStacker,
    labware_height: float,
) -> None:
    """
    Test successful dispense labware with labware sensing enforced.
    """
    with (
        mock.patch.object(
            subject, "_prepare_for_action", mock.AsyncMock()
        ) as _prepare_for_action,
        mock.patch.object(
            subject, "_move_and_home_axis", mock.AsyncMock()
        ) as _move_and_home_axis,
        mock.patch.object(
            subject, "verify_shuttle_labware_presence", mock.AsyncMock()
        ) as verify_shuttle_labware_presence,
        mock.patch.object(
            subject, "verify_hopper_labware_presence", mock.AsyncMock()
        ) as verify_hopper_labware_presence,
        mock.patch.object(subject, "move_axis", mock.AsyncMock()) as move_axis,
        mock.patch.object(subject, "home_axis", mock.AsyncMock()) as home_axis,
        mock.patch.object(subject, "open_latch", mock.AsyncMock()) as open_latch,
        mock.patch.object(subject, "close_latch", mock.AsyncMock()) as close_latch,
    ):
        # Test valid labware height
        await subject.dispense_labware(
            labware_height=labware_height,
        )

        # We need to verify the move sequence
        verify_hopper_labware_presence.assert_called_once_with(Direction.RETRACT, True)
        _prepare_for_action.assert_called()
        _move_and_home_axis.assert_any_call(
            StackerAxis.X, Direction.RETRACT, HOME_OFFSET_MD
        )
        _move_and_home_axis.assert_any_call(
            StackerAxis.Z, Direction.EXTEND, HOME_OFFSET_SM
        )

        # Verify labware transfer
        open_latch.assert_called_once()
        latch_clear_distance = labware_height + PLATFORM_OFFSET - LATCH_CLEARANCE
        move_axis.assert_any_call(
            StackerAxis.Z, Direction.RETRACT, latch_clear_distance
        )
        close_latch.assert_called_once()

        # Assertions for offset calculation and move_axis/home_axis
        z_distance = MAX_TRAVEL[StackerAxis.Z] - latch_clear_distance - HOME_OFFSET_SM
        move_axis.assert_any_call(StackerAxis.Z, Direction.RETRACT, z_distance)
        home_axis.assert_any_call(StackerAxis.Z, Direction.RETRACT)

        # Verify labware presence
        verify_shuttle_labware_presence.assert_called_once_with(Direction.RETRACT, True)

        # Then finally the x is moved to the gripper position
        _move_and_home_axis.assert_any_call(
            StackerAxis.X, Direction.EXTEND, HOME_OFFSET_MD
        )


@pytest.mark.parametrize(
    ("labware_height"),
    [(0), (-10), (200)],
)
async def test_invalid_labware_height(
    subject: modules.FlexStacker,
    labware_height: float,
) -> None:
    """Raise a ValueError if the labware_height is invalid"""
    with (
        mock.patch.object(
            subject, "_prepare_for_action", mock.AsyncMock()
        ) as _prepare_for_action
    ):
        # Test invalid labware height
        with pytest.raises(ValueError):
            await subject.store_labware(
                labware_height=labware_height,
                enforce_shuttle_lw_sensing=True,
            )
        _prepare_for_action.assert_not_called()
