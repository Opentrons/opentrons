from __future__ import annotations

import asyncio
import logging
from typing import (
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    Literal,
    Optional,
    Mapping,
    cast,
)

from opentrons.drivers.flex_stacker.types import (
    AxisParams,
    Direction,
    LEDColor,
    LEDPattern,
    MoveParams,
    MoveResult,
    StackerAxis,
    StallGuardParams,
    TOFDetection,
    TOFMeasurementResult,
    TOFSensor,
    HardwareRevision,
    TOFSensorMode,
    TOFSensorState,
    TOFSensorStatus,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.flex_stacker.driver import (
    FlexStackerDriver,
)
from opentrons.drivers.flex_stacker.abstract import AbstractFlexStackerDriver
from opentrons.drivers.flex_stacker.simulator import SimulatingDriver
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.poller import Reader, Poller
from opentrons.hardware_control.modules import mod_abc, update
from opentrons.hardware_control.modules.types import (
    FlexStackerStatus,
    HopperDoorState,
    LatchState,
    ModuleDisconnectedCallback,
    ModuleType,
    PlatformState,
    StackerAxisState,
    UploadFunction,
    LiveData,
    FlexStackerData,
)
from opentrons.hardware_control.types import StatusBarState, StatusBarUpdateEvent
from opentrons.config import feature_flags as ff

from opentrons_shared_data.errors.exceptions import (
    FlexStackerStallError,
    FlexStackerShuttleMissingError,
    FlexStackerShuttleLabwareError,
    FlexStackerHopperLabwareError,
    FlexStackerShuttleNotEmptyError,
)
from opentrons_shared_data.module import load_tof_baseline_data

log = logging.getLogger(__name__)

POLL_PERIOD = 2.0
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0

DFU_PID = "df11"

# Maximum distance in mm the axis can travel.
MAX_TRAVEL = {
    StackerAxis.X: 194.0,
    StackerAxis.Z: 139.5,
    StackerAxis.L: 22.0,
}

# Min/Max height in mm of labware stack to store/dispense
MIN_LABWARE_HEIGHT = 4.0
MAX_LABWARE_HEIGHT = 102.5

# The offset in mm to subtract from MAX_TRAVEL when moving an axis before we home.
# This lets us use `move_axis` to move fast, leaving the axis OFFSET mm
# from the limit switch. Then we can use `home_axis` to move the axis the rest
# of the way until we trigger the expected limit switch.
HOME_OFFSET_SM = 5.0
HOME_OFFSET_MD = 10.0

# The labware platform will contact the labware this mm before the platform
# touches the +Z endstop.
PLATFORM_OFFSET = 2.25

# Should put the bottom of the plate above this mm above the latch when dispensing.
# Should put the bottom of the plate this mm below the latch when storing.
LATCH_CLEARANCE = 2.5

# TOF Baseline Configs
# These are generated manually with the help of the tof_analysis.py tool
# Which can be found in `hardware_testing/tools/tof-analysis/README.md` where
# it goes over using use the tool.
TOF_DETECTION_CONFIG = {
    TOFSensor.X: {
        Direction.EXTEND: TOFDetection(
            TOFSensor.X,
            zones=[5, 6, 7],
            bins=list(range(30, 40)),
            threshold=1000,
        ),
        Direction.RETRACT: TOFDetection(
            TOFSensor.X,
            zones=[5, 6, 7],
            bins=list(range(17, 30)),
            threshold=1000,
        ),
    },
    TOFSensor.Z: {
        Direction.EXTEND: TOFDetection(
            TOFSensor.Z,
            zones=[1, 2, 3],
            bins=list(range(15, 63)),
            threshold=1000,
        ),
        Direction.RETRACT: TOFDetection(
            TOFSensor.Z,
            zones=[1, 2, 3],
            bins=list(range(15, 63)),
            threshold=1000,
        ),
    },
}


# Stallguard defaults
STALLGUARD_CONFIG = {
    StackerAxis.X: StallGuardParams(StackerAxis.X, True, 0),
    StackerAxis.Z: StallGuardParams(StackerAxis.Z, True, 2),
}

# Motion Parameter defaults
STACKER_MOTION_CONFIG = {
    StackerAxis.X: {
        "home": AxisParams(
            run_current=1.5,  # Amps RMS
            hold_current=0.75,
            move_params=MoveParams(
                max_speed=10.0,  # mm/s
                acceleration=100.0,  # mm/s^2
                max_speed_discont=40.0,  # mm/s
            ),
        ),
        "move": AxisParams(
            run_current=1.2,
            hold_current=0.75,
            move_params=MoveParams(
                max_speed=200.0,
                acceleration=1500.0,
                max_speed_discont=40.0,
            ),
        ),
    },
    StackerAxis.Z: {
        "home": AxisParams(
            run_current=1.5,
            hold_current=1.5,
            move_params=MoveParams(
                max_speed=10.0,
                acceleration=100.0,
                max_speed_discont=25.0,
            ),
        ),
        "move": AxisParams(
            run_current=1.5,
            hold_current=1.5,
            move_params=MoveParams(
                max_speed=150.0,
                acceleration=500.0,
                max_speed_discont=25.0,
            ),
        ),
    },
    StackerAxis.L: {
        "home": AxisParams(
            run_current=1.2,
            hold_current=0.5,
            move_params=MoveParams(
                max_speed=100.0,
                acceleration=800.0,
                max_speed_discont=40.0,
            ),
        ),
        "move": AxisParams(
            run_current=1.2,
            hold_current=0.5,
            move_params=MoveParams(
                max_speed=100.0,
                acceleration=800.0,
                max_speed_discont=40.0,
            ),
        ),
    },
}


class FlexStacker(mod_abc.AbstractModule):
    """Hardware control interface for an attached Flex-Stacker module."""

    MODULE_TYPE = ModuleType.FLEX_STACKER

    @classmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: Optional[ExecutionManager] = None,
        poll_interval_seconds: Optional[float] = None,
        simulating: bool = False,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
        disconnected_callback: ModuleDisconnectedCallback = None,
    ) -> "FlexStacker":
        """
        Build a FlexStacker

        Args:
            port: The port to connect to
            usb_port: USB Port
            execution_manager: Execution manager.
            hw_control_loop: The event loop running in the hardware control thread.
            poll_interval_seconds: Poll interval override.
            simulating: whether to build a simulating driver
            loop: Loop
            sim_model: The model name used by simulator
            disconnected_callback: Callback to inform the module controller that the device was disconnected

        Returns:
            FlexStacker instance
        """
        driver: AbstractFlexStackerDriver
        if not simulating:
            driver = await FlexStackerDriver.create(port=port, loop=hw_control_loop)
            poll_interval_seconds = poll_interval_seconds or POLL_PERIOD
        else:
            driver = SimulatingDriver(serial_number=sim_serial_number)
            poll_interval_seconds = poll_interval_seconds or SIMULATING_POLL_PERIOD

        reader = FlexStackerReader(driver=driver)
        poller = Poller(reader=reader, interval=poll_interval_seconds)
        module = cls(
            port=port,
            usb_port=usb_port,
            driver=driver,
            reader=reader,
            poller=poller,
            device_info=(await driver.get_device_info()).to_dict(),
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
        )

        # Set initialized callback
        reader.set_initialized_callback(module._initialized_callback)

        # Enable stallguard
        for axis, config in STALLGUARD_CONFIG.items():
            await driver.set_stallguard_threshold(
                axis, config.enabled, config.threshold
            )

        try:
            await poller.start()
        except Exception:
            log.exception(f"First read of Flex-Stacker on port {port} failed")

        return module

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        driver: AbstractFlexStackerDriver,
        reader: FlexStackerReader,
        poller: Poller,
        device_info: Mapping[str, str],
        hw_control_loop: asyncio.AbstractEventLoop,
        execution_manager: Optional[ExecutionManager] = None,
        disconnected_callback: ModuleDisconnectedCallback = None,
    ):
        super().__init__(
            port=port,
            usb_port=usb_port,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
        )
        self._device_info = device_info
        self._driver = driver
        self._reader = reader
        self._poller = poller
        self._stall_detected = False
        self._stacker_status = FlexStackerStatus.IDLE
        self._last_status_bar_event: Optional[StatusBarUpdateEvent] = None
        self._should_identify = False

    async def _initialized_callback(self) -> None:
        """Called by the reader once the module is initialized."""
        if self._last_status_bar_event:
            await self._handle_status_bar_event(self._last_status_bar_event)

    async def cleanup(self) -> None:
        """Stop the poller task"""
        await self._poller.stop()
        await self._driver.disconnect()

    @classmethod
    def name(cls) -> str:
        """Used for picking up serial port symlinks"""
        return "flexstacker"

    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        return "flex-stacker"

    @staticmethod
    def _model_from_revision(revision: Optional[str]) -> str:
        """Defines the revision -> model mapping"""
        return "flexStackerModuleV1"

    def model(self) -> str:
        return self._model_from_revision(self._device_info.get("model"))

    @property
    def latch_state(self) -> LatchState:
        """The state of the latch."""
        return LatchState.from_state(self.limit_switch_status[StackerAxis.L])

    @property
    def platform_state(self) -> PlatformState:
        """The state of the platform."""
        return self._reader.platform_state

    @property
    def initialized(self) -> bool:
        """The stacker is ready..."""
        return self._reader.initialized

    @property
    def hopper_door_state(self) -> HopperDoorState:
        """The status of the hopper door."""
        return HopperDoorState.from_state(self._reader.hopper_door_closed)

    @property
    def limit_switch_status(self) -> Dict[StackerAxis, StackerAxisState]:
        """The status of the Limit switches."""
        return self._reader.limit_switch_status

    @property
    def install_detected(self) -> bool:
        """Whether the stacker is installed on Flex."""
        return self._reader.installation_detected

    @property
    def device_info(self) -> Mapping[str, str]:
        return self._device_info

    @property
    def status(self) -> FlexStackerStatus:
        """Module status or error state details."""
        return self._stacker_status

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    @property
    def live_data(self) -> LiveData:
        data: FlexStackerData = {
            "latchState": self.latch_state.value,
            "platformState": self.platform_state.value,
            "hopperDoorState": self.hopper_door_state.value,
            "installDetected": self.install_detected,
            "errorDetails": self._reader.error,
        }
        return {"status": self.status.value, "data": data}

    @property
    def should_identify(self) -> bool:
        return self._should_identify

    async def prep_for_update(self) -> str:
        await self._poller.stop()
        await self._driver.stop_motors()
        await self._driver.enter_programming_mode()
        # flex stacker has three unique "devices" over DFU
        dfu_info = await update.find_dfu_device(pid=DFU_PID, expected_device_count=3)
        return dfu_info

    def bootloader(self) -> UploadFunction:
        return update.upload_via_dfu

    async def deactivate(self, must_be_running: bool = True) -> None:
        await self._driver.stop_motors()

    async def set_led_state(
        self,
        power: float,
        color: Optional[LEDColor] = None,
        pattern: Optional[LEDPattern] = None,
        duration: Optional[int] = None,
        reps: Optional[int] = None,
    ) -> None:
        """Sets the statusbar state."""
        return await self._driver.set_led(
            power, color=color, pattern=pattern, duration=duration, reps=reps
        )

    async def move_axis(
        self,
        axis: StackerAxis,
        direction: Direction,
        distance: float,
        speed: Optional[float] = None,
        acceleration: Optional[float] = None,
        current: Optional[float] = None,
    ) -> bool:
        """Move the axis in a direction by the given distance in mm."""
        default = STACKER_MOTION_CONFIG[axis]["move"]
        old_run_current = self._reader.motion_params[axis].run_current
        new_run_current = current if current is not None else default.run_current
        if new_run_current != old_run_current:
            await self._driver.set_run_current(axis, new_run_current)
            self._reader.motion_params[axis].run_current = new_run_current

        old_hold_current = self._reader.motion_params[axis].hold_current
        new_hold_current = default.hold_current
        if new_hold_current != old_hold_current:
            await self._driver.set_ihold_current(axis, new_hold_current)
            self._reader.motion_params[axis].hold_current = new_hold_current

        motion_params = default.move_params.update(
            max_speed=speed, acceleration=acceleration
        )
        distance = direction.distance(distance)
        res = await self._driver.move_in_mm(axis, distance, params=motion_params)
        if res == MoveResult.STALL_ERROR:
            self._stall_detected = True
            raise FlexStackerStallError(self.device_info["serial"], axis)
        return res == MoveResult.NO_ERROR

    async def home_axis(
        self,
        axis: StackerAxis,
        direction: Direction,
        speed: Optional[float] = None,
        acceleration: Optional[float] = None,
        current: Optional[float] = None,
    ) -> bool:
        default = STACKER_MOTION_CONFIG[axis]["home"]
        old_run_current = self._reader.motion_params[axis].run_current
        new_run_current = current if current is not None else default.run_current
        if new_run_current != old_run_current:
            await self._driver.set_run_current(axis, new_run_current)
            self._reader.motion_params[axis].run_current = new_run_current

        old_hold_current = self._reader.motion_params[axis].hold_current
        new_hold_current = default.hold_current
        if new_hold_current != old_hold_current:
            await self._driver.set_ihold_current(axis, new_hold_current)
            self._reader.motion_params[axis].hold_current = new_hold_current

        motion_params = default.move_params.update(
            max_speed=speed, acceleration=acceleration
        )
        success = await self._driver.move_to_limit_switch(
            axis=axis, direction=direction, params=motion_params
        )
        await self._reader.get_limit_switch_status()
        if success == MoveResult.STALL_ERROR:
            self._stall_detected = True
            raise FlexStackerStallError(self.device_info["serial"], axis)
        return success == MoveResult.NO_ERROR

    async def close_latch(
        self,
        velocity: Optional[float] = None,
        acceleration: Optional[float] = None,
    ) -> bool:
        """Close the latch, dropping any labware its holding."""
        success = await self.home_axis(
            StackerAxis.L,
            Direction.RETRACT,
            speed=velocity,
            acceleration=acceleration,
        )
        # Check that the latch is closed.
        await self._reader.get_limit_switch_status()
        return (
            success
            and self.limit_switch_status[StackerAxis.L] == StackerAxisState.EXTENDED
        )

    async def open_latch(
        self,
        velocity: Optional[float] = None,
        acceleration: Optional[float] = None,
    ) -> bool:
        """Open the latch."""
        # The latch only has one limit switch, so we have to travel a fixed distance
        # to open the latch.
        success = await self.move_axis(
            StackerAxis.L,
            Direction.EXTEND,
            distance=MAX_TRAVEL[StackerAxis.L],
            speed=velocity,
            acceleration=acceleration,
        )
        # Check that the latch is opened.
        await self._reader.get_limit_switch_status()
        return (
            success
            and self.limit_switch_status[StackerAxis.L] == StackerAxisState.RETRACTED
        )

    async def dispense_labware(
        self,
        labware_height: float,
        enforce_hopper_lw_sensing: bool = True,
        enforce_shuttle_lw_sensing: bool = True,
    ) -> None:
        """Dispenses the next labware in the stacker."""
        self.verify_labware_height(labware_height)
        await self._prepare_for_action()

        if enforce_hopper_lw_sensing:
            # TODO: re-enable this function after TOF calibration is implemented.
            # Until then, we should also check the TOF X sensor before raising the error
            # await self.verify_hopper_labware_presence(Direction.EXTEND, True)
            hopper_empty = not await self.labware_detected(
                StackerAxis.Z, Direction.EXTEND
            )

        # Move platform along the X and make sure we DONT detect labware
        await self._move_and_home_axis(StackerAxis.X, Direction.RETRACT, HOME_OFFSET_MD)
        if enforce_shuttle_lw_sensing:
            await self.verify_shuttle_labware_presence(Direction.RETRACT, False)

        # Move platform along the Z axis
        await self._move_and_home_axis(StackerAxis.Z, Direction.EXTEND, HOME_OFFSET_SM)

        # Transfer
        await self.open_latch()
        latch_clear_distance = labware_height + PLATFORM_OFFSET - LATCH_CLEARANCE
        await self.move_axis(StackerAxis.Z, Direction.RETRACT, latch_clear_distance)
        await self.close_latch()

        # Move Z down the rest of the way
        z_distance = MAX_TRAVEL[StackerAxis.Z] - latch_clear_distance - HOME_OFFSET_SM
        await self.move_axis(StackerAxis.Z, Direction.RETRACT, z_distance)
        await self.home_axis(StackerAxis.Z, Direction.RETRACT)

        if enforce_shuttle_lw_sensing:
            try:
                await self.verify_shuttle_labware_presence(Direction.RETRACT, True)
            except FlexStackerShuttleLabwareError:
                # No labware detected on the shuttle, so we need to check what the Z TOF
                # sensor says about the hopper
                if hopper_empty:
                    # homing here so we don't have to modify the error recovery flow
                    await self._move_and_home_axis(
                        StackerAxis.X, Direction.EXTEND, HOME_OFFSET_MD
                    )
                    raise FlexStackerHopperLabwareError(
                        self.device_info["serial"],
                        labware_expected=True,
                    ) from None
                raise

        await self._move_and_home_axis(StackerAxis.X, Direction.EXTEND, HOME_OFFSET_MD)

    async def store_labware(
        self,
        labware_height: float,
        enforce_shuttle_lw_sensing: bool = True,
    ) -> None:
        """Stores a labware in the stacker."""
        self.verify_labware_height(labware_height)
        await self._prepare_for_action()

        # Move the X and check that labware is detected
        await self._move_and_home_axis(StackerAxis.X, Direction.RETRACT, HOME_OFFSET_MD)
        if enforce_shuttle_lw_sensing:
            await self.verify_shuttle_labware_presence(Direction.RETRACT, True)

        # Move the Z so the labware sits right under the labware already stored
        latch_clear_distance = labware_height + PLATFORM_OFFSET - LATCH_CLEARANCE
        distance = MAX_TRAVEL[StackerAxis.Z] - latch_clear_distance
        await self.move_axis(StackerAxis.Z, Direction.EXTEND, distance)

        await self.open_latch()
        # Move the labware the rest of the way at half move speed to increase torque.
        remaining_z = latch_clear_distance - HOME_OFFSET_SM
        speed_z = STACKER_MOTION_CONFIG[StackerAxis.Z]["move"].move_params.max_speed / 2
        await self.move_axis(StackerAxis.Z, Direction.EXTEND, remaining_z, speed_z)
        await self.home_axis(StackerAxis.Z, Direction.EXTEND, speed_z)
        await self.close_latch()

        # Move the Z down and check that labware is not detected.
        await self._move_and_home_axis(StackerAxis.Z, Direction.RETRACT, HOME_OFFSET_MD)
        if enforce_shuttle_lw_sensing:
            await self.verify_shuttle_labware_presence(Direction.RETRACT, False)

        # Move the X to the gripper position
        await self._move_and_home_axis(StackerAxis.X, Direction.EXTEND, HOME_OFFSET_MD)

    async def _move_and_home_axis(
        self,
        axis: StackerAxis,
        direction: Direction,
        offset: float = 0,
        speed: Optional[float] = None,
    ) -> bool:
        """Move the axis in a direction by the given offset in mm and home it.

        Warning: It is assumed that the axis is already in a known state
        before this function gets called. Do not use this function if the axis
        has not been homed/has recently stalled."""
        distance = MAX_TRAVEL[axis] - offset
        await self.move_axis(axis, direction, distance, speed)
        return await self.home_axis(axis, direction, speed)

    async def _prepare_for_action(self) -> None:
        """Helper to prepare axis for dispensing or storing labware."""
        # TODO: check if we need to home first
        await self.home_axis(StackerAxis.X, Direction.EXTEND)
        await self.home_axis(StackerAxis.Z, Direction.RETRACT)
        await self.close_latch()
        await self.verify_shuttle_location(PlatformState.EXTENDED)

    async def home_all(self, ignore_latch: bool = False) -> None:
        """Home all axes based on current state, assuming normal operation.

        If ignore_latch is True, we will not attempt to close the latch. This
        is useful when we want the shuttle to be out of the way for error
        recovery (e.g. when the latch is stuck open).
        """
        await self._reader.get_installation_detected()
        await self._reader.get_limit_switch_status()
        await self._reader.get_platform_sensor_state()

        # Z axis is unknown, lets move it up in case it is holding a labware
        if not ignore_latch:
            if self.limit_switch_status[StackerAxis.Z] == StackerAxisState.UNKNOWN:
                if self.latch_state == LatchState.OPENED:
                    # let's make sure the latch is opened all the way before homging the Z
                    await self.open_latch()
                    # self.latch_state is OPENED, so we need to home Z in the EXTEND direction
                    await self.home_axis(StackerAxis.Z, Direction.EXTEND)
            await self.close_latch()

        if (
            # if the platform is on the z or if x has not been homed
            self.platform_state == PlatformState.UNKNOWN
            or self.limit_switch_status[StackerAxis.X] == StackerAxisState.UNKNOWN
        ):
            # if the z is not retracted, we need to make sure the x is retracted
            # so we can retract the z properly later
            if self.limit_switch_status[StackerAxis.Z] != StackerAxisState.RETRACTED:
                await self.home_axis(StackerAxis.X, Direction.RETRACT)
            else:
                await self.home_axis(StackerAxis.X, Direction.EXTEND)

        # Finally, retract Z and extend X if they are not already
        await self.home_axis(StackerAxis.Z, Direction.RETRACT)
        await self.home_axis(StackerAxis.X, Direction.EXTEND)

    async def labware_detected(
        self,
        axis: StackerAxis,
        direction: Direction,
        histogram: Optional[TOFMeasurementResult] = None,
        baseline: Optional[Dict[int, List[float]]] = None,
    ) -> bool:
        """Detect labware on the TOF sensor using the `baseline` method

        NOTE: This method is still under development and is inconsistent when detecting
        labware on the X axis in the Extended position. We can consistently detect
        labware on the Z, but we need to do more data collection and testing
        to validate this method.
        """
        dir_str = cast(Literal["extend", "retract"], str(direction))
        sensor = TOFSensor.X if axis == StackerAxis.X else TOFSensor.Z
        baseline = (
            baseline or load_tof_baseline_data(self.model())[sensor.value][dir_str]
        )
        config = TOF_DETECTION_CONFIG[sensor][direction]

        # Take a histogram reading and determine if labware was detected
        histogram = histogram or await self._driver.get_tof_histogram(sensor)
        for zone in config.zones:
            raw_data = histogram.bins[zone]
            baseline_data = baseline[zone]
            for bin in config.bins:
                # We need to ignore raw photon count below N photons as
                # it becomes inconsistent to detect labware given false positives.
                if raw_data[bin] < config.threshold:
                    continue
                delta = raw_data[bin] - baseline_data[bin]
                if delta > 0:
                    return True
        return False

    async def verify_shuttle_location(self, expected: PlatformState) -> None:
        """Verify the shuttle is present and in the expected location."""
        await self._reader.get_platform_sensor_state()
        # Validate the platform state matches, ignore EXTENDED checks on EVT
        if self.platform_state != expected:
            if (
                self.device_info["model"] == HardwareRevision.EVT.value
                and expected == PlatformState.EXTENDED
            ):
                return
            else:
                raise FlexStackerShuttleMissingError(
                    self.device_info["serial"], expected, self.platform_state
                )

    async def verify_shuttle_labware_presence(
        self, direction: Direction, labware_expected: bool
    ) -> None:
        """Check whether or not a labware is detected on the shuttle."""
        if ff.flex_stacker_tof_sensors_disabled():
            return
        result = await self.labware_detected(StackerAxis.X, direction)
        if labware_expected != result:
            if labware_expected:
                raise FlexStackerShuttleLabwareError(
                    self.device_info["serial"],
                    shuttle_state=self.platform_state,
                    labware_expected=labware_expected,
                )
            raise FlexStackerShuttleNotEmptyError(
                self.device_info["serial"],
                shuttle_state=self.platform_state,
                labware_expected=labware_expected,
            )

    async def verify_hopper_labware_presence(
        self, direction: Direction, labware_expected: bool
    ) -> None:
        """Check whether or not a labware is detected inside the hopper."""
        if ff.flex_stacker_tof_sensors_disabled():
            return
        result = await self.labware_detected(StackerAxis.Z, direction)
        if labware_expected != result:
            raise FlexStackerHopperLabwareError(
                self.device_info["serial"],
                labware_expected=labware_expected,
            )

    def verify_labware_height(self, labware_height: float) -> None:
        """Check that the labware height is within valid range."""
        if labware_height < MIN_LABWARE_HEIGHT or labware_height > MAX_LABWARE_HEIGHT:
            raise ValueError(
                f"Labware height must be between {MIN_LABWARE_HEIGHT}-{MAX_LABWARE_HEIGHT}mm."
                "Received {labware_height}mm."
            )

    def event_listener(self, event: Any) -> None:
        if isinstance(event, StatusBarUpdateEvent):
            self._last_status_bar_event = event
            asyncio.run_coroutine_threadsafe(
                self._handle_status_bar_event(event), self._loop
            )

    async def _handle_status_bar_event(self, event: StatusBarUpdateEvent) -> None:
        if event.enabled and self.initialized:
            match event.state:
                case StatusBarState.RUNNING:
                    await self.set_led_state(0.5, LEDColor.GREEN, LEDPattern.STATIC)
                case StatusBarState.PAUSED:
                    if (
                        self.hopper_door_state == HopperDoorState.OPENED
                        or self.should_identify
                    ):
                        await self._stacker_bar_pause()
                    else:
                        await self._stacker_bar_idle()
                case StatusBarState.IDLE:
                    if self.hopper_door_state == HopperDoorState.OPENED:
                        await self._stacker_bar_pause()
                    else:
                        await self._stacker_bar_idle()
                case StatusBarState.HARDWARE_ERROR:
                    if self.should_identify:
                        await self.set_led_state(
                            0.5, LEDColor.RED, LEDPattern.FLASH, duration=300
                        )
                    else:
                        await self._stacker_bar_idle()
                case StatusBarState.SOFTWARE_ERROR:
                    await self.set_led_state(0.5, LEDColor.YELLOW, LEDPattern.STATIC)
                case StatusBarState.ERROR_RECOVERY:
                    if self.hopper_door_state == HopperDoorState.OPENED:
                        await self._stacker_bar_pause()
                    elif self.should_identify:
                        await self.set_led_state(
                            0.5, LEDColor.YELLOW, LEDPattern.PULSE, duration=2000
                        )
                    else:
                        await self._stacker_bar_idle()
                case StatusBarState.RUN_COMPLETED:
                    await self.set_led_state(0.5, LEDColor.GREEN, LEDPattern.PULSE)
                case StatusBarState.UPDATING:
                    await self.set_led_state(0.5, LEDColor.WHITE, LEDPattern.PULSE)
                case _:
                    await self._stacker_bar_idle()

    async def _stacker_bar_pause(self) -> None:
        await self.set_led_state(0.5, LEDColor.BLUE, LEDPattern.PULSE, duration=2000)

    async def _stacker_bar_idle(self) -> None:
        await self.set_led_state(0.5, LEDColor.WHITE, LEDPattern.STATIC)

    async def identify(self, start: bool, color_name: Optional[str] = None) -> None:
        """Identify the module."""
        reps = -1 if start else 0
        color = LEDColor.from_name(color_name or LEDColor.BLUE.name)
        await self.set_led_state(0.5, color, LEDPattern.PULSE, reps=reps)
        if not start and self._last_status_bar_event:
            await self._handle_status_bar_event(self._last_status_bar_event)

    def set_stacker_identify(self, state: bool) -> None:
        self._should_identify = state

    def cleanup_persistent(self) -> None:
        """Reset persistent data on the module that should not exist outside of a run."""
        self.set_stacker_identify(False)


class FlexStackerReader(Reader):
    error: Optional[str]

    def __init__(self, driver: AbstractFlexStackerDriver) -> None:
        self.error: Optional[str] = None
        self._driver = driver
        self.limit_switch_status = {
            axis: StackerAxisState.UNKNOWN for axis in StackerAxis
        }
        self.tof_sensor_status: Dict[TOFSensor, TOFSensorStatus] = {
            s: TOFSensorStatus(
                s, TOFSensorState.INITIALIZING, TOFSensorMode.UNKNOWN, False
            )
            for s in TOFSensor
        }
        self.motion_params: Dict[StackerAxis, AxisParams] = {
            axis: AxisParams(0, 0, MoveParams(0, 0, 0)) for axis in StackerAxis
        }
        self.platform_state = PlatformState.UNKNOWN
        self.hopper_door_closed = False
        self.initialized = False
        self.installation_detected = False
        self._refresh_state = False
        self._initialized_callback: Optional[Callable[[], Awaitable[None]]] = None

    def set_initialized_callback(self, callback: Callable[[], Awaitable[None]]) -> None:
        """Sets the callback used when done initializing the module."""
        self._initialized_callback = callback

    async def read(self) -> None:
        await self.get_door_closed()
        await self.get_platform_sensor_state()
        if not self.initialized or self._refresh_state:
            initialized = True
            await self.get_installation_detected()
            await self.get_limit_switch_status()
            await self.get_motion_parameters()
            for sensor, status in self.tof_sensor_status.items():
                if status.state == TOFSensorState.INITIALIZING:
                    status = await self._driver.get_tof_sensor_status(sensor)
                    self.tof_sensor_status[sensor] = status
                    initialized &= status.ok

            self._refresh_state = False
            # We are done initializing, sync the led state
            if not self.initialized and initialized:
                self.initialized = True
                if self._initialized_callback:
                    await self._initialized_callback()

        self._set_error(None)

    async def get_limit_switch_status(self) -> None:
        """Get the limit switch status."""
        status = await self._driver.get_limit_switches_status()
        self.limit_switch_status = {
            axis: StackerAxisState.from_status(status, axis) for axis in StackerAxis
        }

    async def get_motion_parameters(self) -> None:
        """Get the motion parameters used by the axis motors."""
        for axis in StackerAxis:
            self.motion_params[axis].move_params = await self._driver.get_motion_params(
                axis
            )

    async def get_platform_sensor_state(self) -> None:
        """Get the platform state."""
        status = await self._driver.get_platform_status()
        platform_state = PlatformState.from_status(status)
        if self.initialized and platform_state == PlatformState.UNKNOWN:
            # If the platform state is unknown but the X axis is known,
            # the platform is missing.
            await self.get_limit_switch_status()
            if self.limit_switch_status[StackerAxis.X] != StackerAxisState.UNKNOWN:
                platform_state = PlatformState.MISSING
        self.platform_state = platform_state

    async def get_door_closed(self) -> None:
        """Check if the hopper door is closed."""
        old_door_state = self.hopper_door_closed
        self.hopper_door_closed = await self._driver.get_hopper_door_closed()
        if old_door_state != self.hopper_door_closed and self._initialized_callback:
            await self._initialized_callback()

    async def get_installation_detected(self) -> None:
        """Check if the stacker install detect is set."""
        detected = await self._driver.get_installation_detected()
        self.installation_detected = detected

    def set_refresh_state(self) -> None:
        """Tell the reader to refresh all states, even ones that arent polled."""
        self._refresh_state = True

    def on_error(self, exception: Exception) -> None:
        self._driver.reset_serial_buffers()
        self._set_error(exception)

    def _set_error(self, exception: Optional[Exception]) -> None:
        if exception is None:
            self.error = None
        else:
            try:
                self.error = str(exception.args[0])
            except Exception:
                self.error = repr(exception)
