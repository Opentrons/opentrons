"""
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way
  or knowing anything about what the axes are used for
"""

from __future__ import annotations
import asyncio
import contextlib
import logging
from os import environ
from time import time
from typing import Any, Dict, Optional, Union, List, Tuple, cast, AsyncIterator

from math import isclose

from opentrons.drivers.serial_communication import get_ports_by_name
from serial.serialutil import SerialException  # type: ignore[import]

from opentrons.drivers.smoothie_drivers.connection import SmoothieConnection
from opentrons.drivers.smoothie_drivers.constants import (
    GCODE,
    HOMED_POSITION,
    Y_BOUND_OVERRIDE,
    SMOOTHIE_COMMAND_TERMINATOR,
    SMOOTHIE_ACK,
    PLUNGER_BACKLASH_MM,
    CURRENT_CHANGE_DELAY,
    PIPETTE_READ_DELAY,
    Y_SWITCH_BACK_OFF_MM,
    Y_SWITCH_REVERSE_BACK_OFF_MM,
    Y_BACKOFF_LOW_CURRENT,
    Y_BACKOFF_SLOW_SPEED,
    Y_RETRACT_SPEED,
    Y_RETRACT_DISTANCE,
    UNSTICK_DISTANCE,
    UNSTICK_SPEED,
    DEFAULT_AXES_SPEED,
    XY_HOMING_SPEED,
    HOME_SEQUENCE,
    AXES,
    DISABLE_AXES,
    SEC_PER_MIN,
    DEFAULT_ACK_TIMEOUT,
    DEFAULT_EXECUTE_TIMEOUT,
    DEFAULT_MOVEMENT_TIMEOUT,
    SMOOTHIE_BOOT_TIMEOUT,
    DEFAULT_STABILIZE_DELAY,
    DEFAULT_COMMAND_RETRIES,
    MICROSTEPPING_GCODES,
    GCODE_ROUNDING_PRECISION,
)
from opentrons.drivers.smoothie_drivers.errors import (
    SmoothieError,
    SmoothieAlarm,
    TipProbeError,
)
from opentrons.drivers.smoothie_drivers import parse_utils
from opentrons.drivers.command_builder import CommandBuilder

from opentrons.config.types import RobotConfig
from opentrons.config.robot_configs import current_for_revision
from opentrons.drivers.asyncio.communication import (
    SerialConnection,
    NoResponse,
    AlarmResponse,
    ErrorResponse,
)
from opentrons.drivers.types import MoveSplits
from opentrons.drivers.utils import AxisMoveTimestamp, ParseError, string_to_hex
from opentrons.drivers.rpi_drivers.gpio_simulator import SimulatingGPIOCharDev
from opentrons.drivers.rpi_drivers.dev_types import GPIODriverLike
from opentrons.system import smoothie_update
from .types import AxisCurrentSettings


log = logging.getLogger(__name__)


def _command_builder() -> CommandBuilder:
    """Create a CommandBuilder"""
    return CommandBuilder(terminator=SMOOTHIE_COMMAND_TERMINATOR)


class SmoothieDriver:
    @classmethod
    async def build(
        cls,
        port: str,
        config: RobotConfig,
        gpio_chardev: Optional[GPIODriverLike] = None,
    ) -> SmoothieDriver:
        """
        Build a smoothie driver

        Args:
            port: The port
            config: Robot configuration
            gpio_chardev: Optional GPIO driver

        Returns:
            A SmoothieDriver instance.
        """
        connection = await SmoothieConnection.create(
            port=port,
            baud_rate=config.serial_speed,
            name="smoothie",
            timeout=DEFAULT_EXECUTE_TIMEOUT,
            ack=SMOOTHIE_ACK,
            reset_buffer_before_write=True,
        )
        gpio_chardev = gpio_chardev or SimulatingGPIOCharDev("simulated")

        instance = cls(config=config, connection=connection, gpio_chardev=gpio_chardev)
        await instance._setup()
        return instance

    def __init__(
        self,
        config: RobotConfig,
        gpio_chardev: GPIODriverLike,
        connection: Optional[SerialConnection] = None,
    ):
        """
        Constructor

        Args:
            config: The robot configuration
            gpio_chardev: GPIO device.
            connection: The serial connection.
        """
        self.run_flag = asyncio.Event()
        self.run_flag.set()

        self._position = HOMED_POSITION.copy()

        # why do we do this after copying the HOMED_POSITION?
        self._update_position({axis: 0 for axis in AXES})

        self.simulating = connection is None
        self._connection = connection
        self._config = config

        self._gpio_chardev = gpio_chardev

        # Current settings:
        # The amperage of each axis, has been organized into three states:
        # Current-Settings is the amperage each axis was last set to
        # Active-Current-Settings is set when an axis is moving/homing
        # Dwelling-Current-Settings is set when an axis is NOT moving/homing
        self._current_settings = AxisCurrentSettings(
            val=current_for_revision(config.low_current, self._gpio_chardev.board_rev)
        )
        self._active_current_settings = AxisCurrentSettings(
            val=current_for_revision(config.high_current, self._gpio_chardev.board_rev)
        )
        self._dwelling_current_settings = AxisCurrentSettings(
            val=current_for_revision(config.low_current, self._gpio_chardev.board_rev)
        )

        # Active axes are axes that are in use. An axis might be disabled if
        # a motor has had a failure and the robot is operating without that
        # axis until it can be repaired. This will be an unusual circumstance.
        self._active_axes = {ax: False for ax in AXES}

        # Engaged axes are axes that have not been disengaged (GCode M18) since
        # their last "move" or "home" operations. Disengaging an axis stops the
        # power output to the associated motor, primarily for the purpose of
        # reducing heat. When a "disengage" command is sent for an axis, this
        # dict should be updated to False for that axis, and when a "move" or
        # "home" command is sent for an axis, that axis should be updated to
        # True.
        self.engaged_axes = {ax: True for ax in AXES}

        # motor speed settings
        self._max_speed_settings = cast(
            Dict[str, float], config.default_max_speed.copy()
        )
        self._saved_max_speed_settings = self._max_speed_settings.copy()
        self._combined_speed = float(DEFAULT_AXES_SPEED)
        self._saved_axes_speed = float(self._combined_speed)
        self._steps_per_mm: Dict[str, float] = {}
        self._acceleration = config.acceleration.copy()
        self._saved_acceleration = config.acceleration.copy()

        # position after homing
        self._homed_position = HOMED_POSITION.copy()
        self.homed_flags: Dict[str, bool] = {
            "X": False,
            "Y": False,
            "Z": False,
            "A": False,
            "B": False,
            "C": False,
        }

        self._is_hard_halting = asyncio.Event()
        self._move_split_config: MoveSplits = {}
        #: Cache of currently configured splits from callers
        self._axes_moved_at = AxisMoveTimestamp(AXES)

    @property
    def gpio_chardev(self) -> GPIODriverLike:
        return self._gpio_chardev

    @gpio_chardev.setter
    def gpio_chardev(self, gpio_chardev: GPIODriverLike) -> None:
        self._gpio_chardev = gpio_chardev

    @property
    def homed_position(self) -> Dict[str, float]:
        return self._homed_position.copy()

    @property
    def axis_bounds(self) -> Dict[str, float]:
        bounds = {k: v for k, v in self._homed_position.items()}
        bounds["Y"] = Y_BOUND_OVERRIDE
        return bounds

    def _update_position(self, target: Dict[str, float]) -> None:
        """Update the cached position."""
        self._position.update(
            {axis: value for axis, value in target.items() if value is not None}
        )

    async def update_position(self, default: Optional[Dict[str, float]] = None) -> None:
        """Get the current position from the smoothie and cache it."""
        if default is None:
            default = self._position

        if self.simulating:
            updated_position = self._position.copy()
            updated_position.update(**default)
        else:

            async def _recursive_update_position(retries: int) -> Dict[str, float]:
                try:
                    position_response = await self._send_command(
                        _command_builder().add_gcode(gcode=GCODE.CURRENT_POSITION)
                    )
                    return parse_utils.parse_position_response(position_response)
                except ParseError as e:
                    retries -= 1
                    if retries <= 0:
                        raise e
                    await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
                    return await _recursive_update_position(retries)

            updated_position = await _recursive_update_position(DEFAULT_COMMAND_RETRIES)

        self._update_position(updated_position)

    def configure_splits_for(self, config: MoveSplits) -> None:
        """Configure the driver to automatically split moves on a given
        axis that execute (including pauses) after a specified amount of
        time. The move created will adhere to the split config.

        To remove the setting, set None for the specified axis.

        Only pipette axes may be specified for splitting
        """
        assert all(
            (ax.lower() in "bc" for ax in config.keys())
        ), "splits may only be configured for plunger axes"
        self._move_split_config.update(config)
        log.info(f"Updated move split config with {config}")
        self._axes_moved_at.reset_moved(config.keys())

    async def read_pipette_id(self, mount: str) -> Optional[str]:
        """
        Reads in an attached pipette's ID
        The ID is unique to this pipette, and is a string of unknown length

        :param mount: string with value 'left' or 'right'
        :return id string, or None
        """
        res: Optional[str] = None
        if self.simulating:
            res = "1234567890"
        else:
            try:
                res = await self._read_from_pipette(GCODE.READ_INSTRUMENT_ID, mount)
            except UnicodeDecodeError:
                log.exception("Failed to decode pipette ID string:")
                res = None
        return res

    async def read_pipette_model(self, mount: str) -> Optional[str]:
        """
        Reads an attached pipette's MODEL
        The MODEL is a unique string for this model of pipette

        :param mount: string with value 'left' or 'right'
        :return model string, or None
        """
        if self.simulating:
            res = None
        else:
            res = await self._read_from_pipette(GCODE.READ_INSTRUMENT_MODEL, mount)
            if res and "_v" not in res:
                # Backward compatibility for pipettes programmed with model
                # strings that did not include the _v# designation
                res = res + "_v1"
            elif res and "_v13" in res:
                # Backward compatibility for pipettes programmed with model
                # strings that did not include the "." to seperate version
                # major and minor values
                res = res.replace("_v13", "_v1.3")
        return res

    async def write_pipette_id(self, mount: str, data_string: str) -> None:
        """
        Writes to an attached pipette's ID memory location
        The ID is unique to this pipette, and is a string of unknown length

        NOTE: To enable write-access to the pipette, it's button must be held

        mount:
            String (str) with value 'left' or 'right'
        data_string:
            String (str) that is of unknown length, and should be unique to
            this one pipette
        """
        await self._write_to_pipette(GCODE.WRITE_INSTRUMENT_ID, mount, data_string)

    async def write_pipette_model(self, mount: str, data_string: str) -> None:
        """
        Writes to an attached pipette's MODEL memory location
        The MODEL is a unique string for this model of pipette

        NOTE: To enable write-access to the pipette, it's button must be held

        mount:
            String (str) with value 'left' or 'right'
        data_string:
            String (str) that is unique to this model of pipette
        """
        await self._write_to_pipette(GCODE.WRITE_INSTRUMENT_MODEL, mount, data_string)

    async def update_pipette_config(
        self, axis: str, data: Dict[str, float]
    ) -> Dict[str, Dict[str, float]]:
        """
        Updates the following configs for a given pipette mount based on
        the detected pipette type:
        - homing positions M365.0
        - Max Travel M365.1
        - endstop debounce M365.2 (NOT for zprobe debounce)
        - retract from endstop distance M365.3

        Returns the data as the value of a dict with the axis as a key.
        For instance, calling update_pipette_config('B', {'retract': 2})
        would return (if successful) {'B': {'retract': 2}}
        """
        if self.simulating:
            return {axis: data}

        gcodes = {
            "retract": GCODE.PIPETTE_RETRACT,
            "debounce": GCODE.PIPETTE_DEBOUNCE,
            "max_travel": GCODE.PIPETTE_MAX_TRAVEL,
            "home": GCODE.PIPETTE_HOME,
        }

        res_msg: Dict[str, Dict[str, float]] = {axis: {}}

        for key, value in data.items():
            cmd = _command_builder().add_gcode(gcode=gcodes[key])
            if key == "debounce":
                # debounce variable for all axes, so do not specify an axis
                cmd.add_float(prefix="O", value=value, precision=None)
            else:
                cmd.add_float(prefix=axis, value=value, precision=None)
            res = await self._send_command(cmd)
            if res is None:
                raise ValueError(f"{key} was not updated to {value} on {axis} axis")
            res_msg[axis][key] = value

        return res_msg

    # FIXME (JG 9/28/17): Should have a more thought out
    # way of simulating vs really running
    async def connect(self, port: Optional[str] = None) -> None:
        if environ.get("ENABLE_VIRTUAL_SMOOTHIE", "").lower() == "true":
            self.simulating = True
            return
        await self.disconnect()
        await self._connect_to_port(port)
        await self._setup()

    async def disconnect(self) -> None:
        if self._connection and await self.is_connected():
            await self._connection.close()
        self._connection = None
        self.simulating = True

    async def is_connected(self) -> bool:
        if not self._connection:
            return False
        return await self._connection.is_open()

    @staticmethod
    def get_port() -> str:
        """Determine the port to connect to."""
        # Check if smoothie emulator is to be used
        port = environ.get("OT_SMOOTHIE_EMULATOR_URI")
        if port:
            return port
        smoothie_id = environ.get("OT_SMOOTHIE_ID", "AMA")
        # Let this raise an exception.
        return get_ports_by_name(device_name=smoothie_id)[0]

    async def _connect_to_port(self, port: Optional[str] = None) -> None:
        try:
            port = self.get_port() if port is None else port

            log.info(f"Connecting to smoothie at port {port}")

            self._connection = await SmoothieConnection.create(
                port=port,
                baud_rate=self._config.serial_speed,
                name="smoothie",
                timeout=DEFAULT_EXECUTE_TIMEOUT,
                ack=SMOOTHIE_ACK,
                reset_buffer_before_write=True,
            )
            self.simulating = False
        except SerialException:
            # if another process is using the port, pyserial raises an
            # exception that describes a "readiness to read" which is confusing
            error_msg = "Unable to access UART port to Smoothie. This is "
            error_msg += "because another process is currently using it, or "
            error_msg += "the UART port is disabled on this device (OS)"
            raise SerialException(error_msg)

    @property
    def port(self) -> Optional[str]:
        if not self._connection:
            return None
        return self._connection.port

    async def get_fw_version(self) -> str:
        """
        Queries Smoothieware for it's build version, and returns
        the parsed response.

        returns: str
            Current version of attached Smoothi-driver. Versions are derived
            from git branch-hash (eg: edge-66ec883NOMSD)

        Example Smoothieware response:

        Build version: edge-66ec883NOMSD, Build date: Jan 28 2018 15:26:57, MCU: LPC1769, System Clock: 120MHz  # NOQA
          CNC Build   NOMSD Build
        6 axis
        """
        if self.simulating:
            version = "Virtual Smoothie"
        else:
            version = await self._send_command(
                _command_builder().add_gcode(gcode=GCODE.VERSION)
            )
            version = version.split(",")[0].split(":")[-1].strip()
            version = version.replace("NOMSD", "")
        return version

    @property
    def position(self) -> Dict[str, float]:
        """
        Instead of sending M114.2 we are storing target values in
        self._position since movement and home commands are blocking and
        assumed to go the correct place.

        Cases where Smoothie would not be in the correct place (such as if a
        belt slips) would not be corrected by getting position with M114.2
        because Smoothie would also not be aware of slippage.
        """
        return {k.upper(): v for k, v in self._position.items()}

    async def switch_state(self) -> Dict[str, bool]:
        """Returns the state of all SmoothieBoard limit switches"""
        res = await self._send_command(
            _command_builder().add_gcode(gcode=GCODE.LIMIT_SWITCH_STATUS)
        )
        return parse_utils.parse_switch_values(res)

    async def update_homed_flags(self, flags: Optional[Dict[str, bool]] = None) -> None:
        """
        Returns Smoothieware's current homing-status, which is a dictionary
        of boolean values for each axis (XYZABC). If an axis is False, then it
        still needs to be homed, and it's coordinate cannot be trusted.
        Smoothieware sets it's internal homing flags for all axes to False when
        it has yet to home since booting/restarting, or an endstop/homing error
        """
        if flags and isinstance(flags, dict):
            self.homed_flags.update(flags)
        elif self.simulating:
            self.homed_flags.update({ax: False for ax in AXES})
        elif await self.is_connected():

            async def _recursive_update_homed_flags(retries: int) -> None:
                try:
                    res = await self._send_command(
                        _command_builder().add_gcode(gcode=GCODE.HOMING_STATUS)
                    )
                    flags = parse_utils.parse_homing_status_values(res)
                    self.homed_flags.update(flags)
                except ParseError as e:
                    retries -= 1
                    if retries <= 0:
                        raise e
                    await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
                    return await _recursive_update_homed_flags(retries)

            await _recursive_update_homed_flags(DEFAULT_COMMAND_RETRIES)

    @property
    def current(self) -> Dict[str, float]:
        return self._current_settings.now

    @property
    def speed(self) -> None:
        pass

    @property
    def steps_per_mm(self) -> Dict[str, float]:
        return self._steps_per_mm

    @contextlib.asynccontextmanager
    async def restore_speed(self, value: Union[float, str]) -> AsyncIterator[None]:
        await self.set_speed(value, update=False)
        try:
            yield
        finally:
            await self.set_speed(self._combined_speed)

    @staticmethod
    def _build_speed_command(speed: float) -> CommandBuilder:
        return (
            _command_builder()
            .add_gcode(gcode=GCODE.SET_SPEED)
            .add_int(prefix="F", value=int(float(speed) * SEC_PER_MIN))
        )

    async def set_speed(self, value: Union[float, str], update: bool = True) -> None:
        """set total axes movement speed in mm/second"""
        if update:
            self._combined_speed = float(value)
        command = self._build_speed_command(float(value))
        log.debug(f"set_speed: {command}")
        await self._send_command(command)

    def push_speed(self) -> None:
        self._saved_axes_speed = float(self._combined_speed)

    async def pop_speed(self) -> None:
        await self.set_speed(self._saved_axes_speed)

    @contextlib.asynccontextmanager
    async def restore_axis_max_speed(
        self, new_max_speeds: Dict[str, float]
    ) -> AsyncIterator[None]:
        await self.set_axis_max_speed(new_max_speeds, update=False)
        try:
            yield
        finally:
            await self.set_axis_max_speed(self._max_speed_settings)

    async def set_axis_max_speed(
        self, settings: Dict[str, float], update: bool = True
    ) -> None:
        """
        Sets the maximum speed (mm/sec) that a given axis will move

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for millimeters per second (mm/sec)
        update
            bool, True to save the settings for future use
        """
        if update:
            self._max_speed_settings.update(settings)

        command = _command_builder().add_gcode(gcode=GCODE.SET_MAX_SPEED)
        for axis, value in sorted(settings.items()):
            command = command.add_float(prefix=axis, value=value, precision=None)

        log.debug(f"set_axis_max_speed: {command}")
        await self._send_command(command)

    def push_axis_max_speed(self) -> None:
        self._saved_max_speed_settings = self._max_speed_settings.copy()

    async def pop_axis_max_speed(self) -> None:
        await self.set_axis_max_speed(self._saved_max_speed_settings)

    async def set_acceleration(self, settings: Dict[str, float]) -> None:
        """
        Sets the acceleration (mm/sec^2) that a given axis will move

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for mm-per-second-squared (mm/sec^2)
        """
        self._acceleration.update(settings)

        command = (
            _command_builder()
            .add_gcode(gcode=GCODE.ACCELERATION)
            .add_int(prefix="S", value=10000)
        )
        for axis, value in sorted(settings.items()):
            command.add_float(prefix=axis, value=value, precision=None)

        log.debug(f"set_acceleration: {command}")
        await self._send_command(command)

    def push_acceleration(self) -> None:
        self._saved_acceleration = self._acceleration.copy()

    async def pop_acceleration(self) -> None:
        await self.set_acceleration(self._saved_acceleration)

    def set_active_current(self, settings: Dict[str, float]) -> None:
        """
        Sets the amperage of each motor for when it is activated by driver.
        Values are initialized from the `robot_config.high_current` values,
        and can then be changed through this method by other parts of the API.

        For example, `Pipette` setting the active-current of it's pipette,
        depending on what model pipette it is, and what action it is performing

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        """
        self._active_current_settings.now.update(settings)

        # if an axis specified in the `settings` is currently active,
        # reset it's current to the new active-current value
        active_axes_to_update = {
            axis: amperage
            for axis, amperage in self._active_current_settings.now.items()
            if self._active_axes.get(axis) is True
            if self.current[axis] != amperage
        }
        if active_axes_to_update:
            self._save_current(active_axes_to_update, axes_active=True)

    def push_active_current(self) -> None:
        self._active_current_settings.saved.update(self._active_current_settings.now)

    def pop_active_current(self) -> None:
        self.set_active_current(self._active_current_settings.saved)

    def set_dwelling_current(self, settings: Dict[str, float]) -> None:
        """
        Sets the amperage of each motor for when it is dwelling.
        Values are initialized from the `robot_config.log_current` values,
        and can then be changed through this method by other parts of the API.

        For example, `Pipette` setting the dwelling-current of it's pipette,
        depending on what model pipette it is.

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        """
        self._dwelling_current_settings.now.update(settings)

        # if an axis specified in the `settings` is currently dwelling,
        # reset it's current to the new dwelling-current value
        dwelling_axes_to_update = {
            axis: amps
            for axis, amps in self._dwelling_current_settings.now.items()
            if self._active_axes.get(axis) is False
            if self.current[axis] != amps
        }
        if dwelling_axes_to_update:
            self._save_current(dwelling_axes_to_update, axes_active=False)

    def push_dwelling_current(self) -> None:
        self._dwelling_current_settings.saved.update(
            self._dwelling_current_settings.now
        )

    def pop_dwelling_current(self) -> None:
        self.set_dwelling_current(self._dwelling_current_settings.saved)

    def _save_current(
        self, settings: Dict[str, float], axes_active: bool = True
    ) -> None:
        """
        Sets the current in Amperes (A) by axis. Currents are limited to be
        between 0.0-2.0 amps per axis motor.

        Note: this method does not send gcode commands, but instead stores the
        desired current setting. A seperate call to _generate_current_command()
        will return a gcode command that can be used to set Smoothie's current

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        """
        self._active_axes.update({ax: axes_active for ax in settings.keys()})
        self._current_settings.now.update(settings)
        log.debug(f"_save_current: {self.current}")

    async def _set_saved_current(self) -> None:
        """
        Sends the driver's current settings to the serial port as gcode. Call
        this method to set the axis-current state on the actual Smoothie
        motor-driver.
        """
        await self._send_command(self._generate_current_command())

    def _generate_current_command(self) -> CommandBuilder:
        """
        Returns a constructed GCode string that contains this driver's
        axis-current settings, plus a small delay to wait for those settings
        to take effect.
        """
        command = _command_builder().add_gcode(gcode=GCODE.SET_CURRENT)
        for axis, value in sorted(self.current.items()):
            command.add_float(prefix=axis, value=value, precision=None)

        command.add_gcode(gcode=GCODE.DWELL).add_float(
            prefix="P", value=CURRENT_CHANGE_DELAY, precision=None
        )
        log.debug(f"_generate_current_command: {command}")
        return command

    async def disengage_axis(self, axes: str) -> None:
        """
        Disable the stepper-motor-driver's 36v output to motor
        This is a safe GCODE to send to Smoothieware, as it will automatically
        re-engage the motor if it receives a home or move command

        axes
            String containing the axes to be disengaged
            (e.g.: 'XY' or 'ZA' or 'XYZABC')
        """
        available_axes = set(AXES)
        axes = "".join(a for a in axes.upper() if a in available_axes)
        if axes:
            log.debug(f"disengage_axis: {axes}")
            await self._send_command(
                _command_builder()
                .add_gcode(gcode=GCODE.DISENGAGE_MOTOR)
                .add_element(element=axes)
            )
            for axis in axes:
                self.engaged_axes[axis] = False

    def dwell_axes(self, axes: str) -> None:
        """
        Sets motors to low current, for when they are not moving.

        Dwell for XYZA axes is only called after HOMING
        Dwell for BC axes is called after both HOMING and MOVING

        axes:
            String containing the axes to set to low current (eg: 'XYZABC')
        """
        axes = "".join(set(axes) & set(AXES) - set(DISABLE_AXES))
        dwelling_currents = {
            ax: self._dwelling_current_settings.now[ax]
            for ax in axes
            if self._active_axes[ax] is True
        }
        if dwelling_currents:
            self._save_current(dwelling_currents, axes_active=False)

    def activate_axes(self, axes: str) -> None:
        """
        Sets motors to a high current, for when they are moving
        and/or must hold position

        Activating XYZABC axes before both HOMING and MOVING

        axes:
            String containing the axes to set to high current (eg: 'XYZABC')
        """
        axes = "".join(set(axes) & set(AXES) - set(DISABLE_AXES))
        active_currents = {
            ax: self._active_current_settings.now[ax]
            for ax in axes
            if self._active_axes[ax] is False
        }
        if active_currents:
            self._save_current(active_currents, axes_active=True)

    # ----------- Private functions --------------- #

    async def _wait_for_ack(self) -> None:
        """
        In the case where smoothieware has just been reset, we want to
        ignore all the garbage it spits out

        This methods writes a sequence of newline characters, which will
        guarantee Smoothieware responds with 'ok\r\nok\r\n' within 3 seconds
        """
        await self._send_command(_command_builder(), timeout=SMOOTHIE_BOOT_TIMEOUT)

    async def _reset_from_error(self) -> None:
        # smoothieware will ignore new messages for a short time
        # after it has entered an error state, so sleep for some milliseconds
        await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
        log.debug("reset_from_error")
        self._is_hard_halting.clear()
        await self._send_command(
            _command_builder().add_gcode(gcode=GCODE.RESET_FROM_ERROR)
        )
        await self.update_homed_flags()

    # Potential place for command optimization (buffering, flushing, etc)
    async def _send_command(
        self,
        command: CommandBuilder,
        timeout: float = DEFAULT_EXECUTE_TIMEOUT,
        suppress_error_msg: bool = False,
        ack_timeout: float = DEFAULT_ACK_TIMEOUT,
        suppress_home_after_error: bool = False,
    ) -> str:
        """
        Submit a GCODE command to the robot, followed by M400 to block until
        done. This method also ensures that any command on the B or C axis
        (the axis for plunger control) do current ramp-up and ramp-down, so
        that plunger motors rest at a low current to prevent burn-out.

        In the case of a limit-switch alarm during any command other than home,
        the robot should home the axis from the alarm and then raise a
        SmoothieError. The robot should *not* recover and continue to run the
        protocol, as this could result in unpredictable handling of liquids.
        When a SmoothieError is raised, the user should inspect the physical
        configuration of the robot and the protocol and determine why the limit
        switch was hit unexpectedly. This is usually due to an undetected
        collision in a previous move command.

        SmoothieErrors are also raised when a command is sent to a pipette that
        is not present, such as when identifying which pipettes are on a robot.
        In this case, the message should not be logged, so the caller of this
        function should specify `supress_error_msg=True`.

        :param command: the GCODE to submit to the robot
        :param timeout: the time to wait for the smoothie to execute the
            command (after an m400). this should be long enough to allow the
            command to execute. If this is None, the timeout will be infinite.
            This is almost certainly not what you want.
        :param suppress_error_msg: flag for indicating that smoothie errors
            should not be logged
        :param ack_timeout: The time to wait for the smoothie to ack a
            command. For commands that queue (like move) or are short (like
            pipette interrogation) this should be a small number, and is the
            default. For commands the smoothie only acks after execution,
            like home, it should be long enough to allow the command to
            complete in the worst case. If this is None, the timeout will
            be infinite. This is almost certainly not what you want.
        """
        if self.simulating:
            return ""
        try:
            return await self._send_command_unsynchronized(
                command, ack_timeout, timeout
            )
        except SmoothieError as se:
            # XXX: This is a reentrancy error because another command could
            # swoop in here. We're already resetting though and errors (should
            # be) rare so it's probably fine, but the actual solution to this
            # is locking at a higher level like in APIv2.
            await self._reset_from_error()
            error_axis = se.ret_code.strip()[-1]
            if not suppress_error_msg:
                log.warning(f"alarm/error: command={command}, resp={se.ret_code}")
            if (
                GCODE.MOVE in command or GCODE.PROBE in command
            ) and not suppress_home_after_error:
                if error_axis not in "XYZABC":
                    error_axis = AXES
                log.info("Homing after alarm/error")
                await self.home(error_axis)
            raise SmoothieError(se.ret_code, str(command))

    async def _send_command_unsynchronized(
        self, command: CommandBuilder, ack_timeout: float, execute_timeout: float
    ) -> str:
        assert self._connection, "There is no connection."
        command_result = ""
        try:
            command_result = await self._connection.send_command(
                command=command, retries=DEFAULT_COMMAND_RETRIES, timeout=ack_timeout
            )
            wait_command = CommandBuilder(
                terminator=SMOOTHIE_COMMAND_TERMINATOR
            ).add_gcode(gcode=GCODE.WAIT)
            await self._connection.send_command(
                command=wait_command, retries=0, timeout=execute_timeout
            )
        except AlarmResponse as e:
            self._handle_return(ret_code=e.response, is_alarm=True)
        except ErrorResponse as e:
            self._handle_return(ret_code=e.response, is_error=True)
        return command_result

    def _handle_return(
        self, ret_code: str, is_alarm: bool = False, is_error: bool = False
    ) -> None:
        """Check the return string from smoothie for an error condition.

        Usually raises a SmoothieError, which can be handled by the error
        handling in write_with_retries. However, if the hard halt line has
        been set, we need to catch that halt and _not_ handle it, since it
        is used for things like cancelling protocols and needs to be
        handled elsewhere. In that case, we raise SmoothieAlarm, which isn't
        (and shouldn't be) handled by the normal error handling.
        """
        if self._is_hard_halting.is_set():
            # This is the alarm from setting the hard halt
            if is_alarm:
                self._is_hard_halting.clear()
                raise SmoothieAlarm(ret_code)
            elif is_error:
                # this would be a race condition
                raise SmoothieError(ret_code)
        else:
            if is_alarm or is_error:
                # info-level logging for errors of form "no L instrument found"
                if "instrument found" in ret_code.lower():
                    log.info(f"smoothie: {ret_code}")
                    raise SmoothieError(ret_code)

                # the two errors below happen when we're recovering from a hard
                # halt. in that case, some try/finallys above us may send
                # further commands. smoothie responds to those commands with
                # errors like these. if we raise exceptions here, they
                # overwrite the original exception and we don't properly
                #  handle it. This hack to get around this is really bad!
                if (
                    "alarm lock" not in ret_code.lower()
                    and "after halt you should home" not in ret_code.lower()
                ):
                    log.error(f"alarm/error outside hard halt: {ret_code}")
                    raise SmoothieError(ret_code)

    async def _home_x(self) -> None:
        log.debug("_home_x")
        # move the gantry forward on Y axis with low power
        self._save_current({"Y": Y_BACKOFF_LOW_CURRENT})
        self.push_axis_max_speed()
        await self.set_axis_max_speed({"Y": Y_BACKOFF_SLOW_SPEED})

        # move away from the Y endstop switch, then backward half that distance
        relative_retract_command = (
            _command_builder()
            .add_gcode(
                # set to relative coordinate system
                gcode=GCODE.RELATIVE_COORDS
            )
            .add_gcode(gcode=GCODE.MOVE)
            .add_int(
                # move towards front of machine
                prefix="Y",
                value=int(-Y_SWITCH_BACK_OFF_MM),
            )
            .add_gcode(gcode=GCODE.MOVE)
            .add_int(
                # move towards back of machine
                prefix="Y",
                value=int(Y_SWITCH_REVERSE_BACK_OFF_MM),
            )
            .add_gcode(
                # set back to abs coordinate system
                gcode=GCODE.ABSOLUTE_COORDS
            )
        )

        command = self._generate_current_command().add_builder(
            builder=relative_retract_command
        )
        await self._send_command(command)
        self.dwell_axes("Y")

        # time it is safe to home the X axis
        try:
            # override firmware's default XY homing speed, to avoid resonance
            await self.set_axis_max_speed({"X": XY_HOMING_SPEED})
            self.activate_axes("X")
            command = (
                self._generate_current_command()
                .add_gcode(gcode=GCODE.HOME)
                .add_element("X")
            )
            # home commands are acked after execution rather than queueing, so
            # we want a long ack timeout and a short execution timeout
            home_timeout = (HOMED_POSITION["X"] / XY_HOMING_SPEED) * 2
            await self._send_command(command, ack_timeout=home_timeout, timeout=5)
            await self.update_homed_flags(flags={"X": True})
        finally:
            await self.pop_axis_max_speed()
            self.dwell_axes("X")
            await self._set_saved_current()

    async def _home_y(self) -> None:
        log.debug("_home_y")
        # override firmware's default XY homing speed, to avoid resonance
        self.push_axis_max_speed()
        await self.set_axis_max_speed({"Y": XY_HOMING_SPEED})

        self.activate_axes("Y")
        # home the Y at normal speed (fast)
        command = (
            self._generate_current_command()
            .add_gcode(gcode=GCODE.HOME)
            .add_element("Y")
        )
        fast_home_timeout = (HOMED_POSITION["Y"] / XY_HOMING_SPEED) * 2
        # home commands are executed before ack, set a long ack timeout
        await self._send_command(command, ack_timeout=fast_home_timeout, timeout=5)

        # slow the maximum allowed speed on Y axis
        await self.set_axis_max_speed({"Y": Y_RETRACT_SPEED})

        # retract, then home, then retract again
        relative_retract_command = (
            _command_builder()
            .add_gcode(
                # set to relative coordinate system
                gcode=GCODE.RELATIVE_COORDS
            )
            .add_gcode(gcode=GCODE.MOVE)
            .add_int(
                # move 3 millimeters away from switch
                prefix="Y",
                value=-Y_RETRACT_DISTANCE,
            )
            .add_gcode(
                # set back to abs coordinate system
                gcode=GCODE.ABSOLUTE_COORDS
            )
        )
        try:
            await self._send_command(relative_retract_command)
            # home commands are executed before ack, use a long ack timeout
            slow_timeout = (Y_RETRACT_DISTANCE / Y_RETRACT_SPEED) * 2
            await self._send_command(
                _command_builder().add_gcode(gcode=GCODE.HOME).add_element("Y"),
                ack_timeout=slow_timeout,
                timeout=5,
            )
            await self.update_homed_flags(flags={"Y": True})
            await self._send_command(relative_retract_command)
        finally:
            await self.pop_axis_max_speed()  # bring max speeds back to normal
            self.dwell_axes("Y")
            await self._set_saved_current()

    async def _setup(self) -> None:
        log.debug("_setup")
        try:
            await self._wait_for_ack()
        except NoResponse:
            # in case motor-driver is stuck in bootloader and unresponsive,
            # use gpio to reset into a known state
            log.debug("wait for ack failed, resetting")
            await self._smoothie_reset()
        log.debug("wait for ack done")
        await self._reset_from_error()
        log.debug("_reset")
        await self.update_steps_per_mm(self._config.gantry_steps_per_mm)
        await self.update_steps_per_mm(
            {ax: self._config.default_pipette_configs["stepsPerMM"] for ax in "BC"}
        )
        log.debug("sent steps")
        await self._send_command(
            _command_builder().add_gcode(gcode=GCODE.ABSOLUTE_COORDS)
        )
        log.debug("sent abs")
        self._save_current(self.current, axes_active=False)
        log.debug("sent current")
        await self.update_position(default=self.homed_position)
        await self.pop_axis_max_speed()
        await self.pop_speed()
        await self.pop_acceleration()
        log.debug("setup done")

    def _build_steps_per_mm(self, data: Dict[str, float]) -> CommandBuilder:
        """Build the set steps/mm command string without sending"""
        command = _command_builder()

        if not data:
            return command

        command.add_gcode(gcode=GCODE.STEPS_PER_MM)
        for axis, value in data.items():
            command.add_float(prefix=axis, value=value, precision=None)
        return command

    async def update_steps_per_mm(self, data: Union[Dict[str, float], str]) -> None:
        # Using M92, update steps per mm for a given axis
        if self.simulating:
            if isinstance(data, dict):
                self.steps_per_mm.update(data)
            return

        if isinstance(data, str):
            # Unfortunately update server calls driver._setup() before the
            # update can correctly load the robot_config change on disk.
            # Need to account for old command format to avoid this issue.
            await self._send_command(_command_builder().add_gcode(data))
        else:
            self.steps_per_mm.update(data)
            cmd = self._build_steps_per_mm(data)
            await self._send_command(cmd)

    async def _read_from_pipette(self, gcode: str, mount: str) -> Optional[str]:
        """
        Read from an attached pipette's internal memory. The gcode used
        determines which portion of memory is read and returned.

        All motors must be disengaged to consistently read over I2C lines

        gcode:
            String (str) containing a GCode
            either 'READ_INSTRUMENT_ID' or 'READ_INSTRUMENT_MODEL'
        mount:
            String (str) with value 'left' or 'right'
        """
        allowed_mounts = {"left": "L", "right": "R"}
        allowed_mount = allowed_mounts.get(mount)
        if not allowed_mount:
            raise ValueError(f"Unexpected mount: {mount}")
        try:
            # EMI interference from both plunger motors has been found to
            # prevent the I2C lines from communicating between Smoothieware and
            # pipette's onboard EEPROM. To avoid, turn off both plunger motors
            await self.disengage_axis("ZABC")
            await self.delay(PIPETTE_READ_DELAY)
            # request from Smoothieware the information from that pipette
            res = await self._send_command(
                _command_builder().add_gcode(gcode=gcode).add_element(allowed_mount),
                suppress_error_msg=True,
            )
            if res:
                parsed_res = parse_utils.parse_instrument_data(res)
                assert allowed_mount in parsed_res
                # data is read/written as strings of HEX characters
                # to avoid firmware weirdness in how it parses GCode arguments
                return parse_utils.byte_array_to_ascii_string(parsed_res[allowed_mount])
        except (ParseError, AssertionError, SmoothieError):
            pass
        return None

    async def _write_to_pipette(self, gcode: str, mount: str, data_string: str) -> None:
        """
        Write to an attached pipette's internal memory. The gcode used
        determines which portion of memory is written to.

        NOTE: To enable write-access to the pipette, it's button must be held

        gcode:
            String (str) containing a GCode
            either 'WRITE_INSTRUMENT_ID' or 'WRITE_INSTRUMENT_MODEL'
        mount:
            String (str) with value 'left' or 'right'
        data_string:
            String (str) that is of unkown length
        """
        allowed_mounts = {"left": "L", "right": "R"}
        allowed_mount = allowed_mounts.get(mount)
        if not allowed_mount:
            raise ValueError(f"Unexpected mount: {mount}")
        if not isinstance(data_string, str):
            raise ValueError("Expected {0}, not {1}".format(str, type(data_string)))
        # EMI interference from both plunger motors has been found to
        # prevent the I2C lines from communicating between Smoothieware and
        # pipette's onboard EEPROM. To avoid, turn off both plunger motors
        await self.disengage_axis("BC")
        await self.delay(CURRENT_CHANGE_DELAY)
        # data is read/written as strings of HEX characters
        # to avoid firmware weirdness in how it parses GCode arguments
        byte_string = string_to_hex(val=data_string)
        command = (
            _command_builder()
            .add_gcode(gcode=gcode)
            .add_element(element=allowed_mount)
            .add_element(element=byte_string)
        )
        log.debug(f"_write_to_pipette: {command}")
        await self._send_command(command)

    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    async def move(  # noqa: C901
        self,
        target: Dict[str, float],
        home_flagged_axes: bool = False,
        speed: Optional[float] = None,
    ) -> None:
        """
        Move to the `target` Smoothieware coordinate, along any of the size
        axes, XYZABC.

        :param target: dict setting the coordinate that Smoothieware will be
            at when `move()` returns. `target` keys are the axis in
            upper-case, and the values are the coordinate in mm (float)
        :param home_flagged_axes: boolean (default=False)
            If set to `True`, each axis included within the target coordinate
            may be homed before moving, determined by Smoothieware's internal
            homing-status flags (`True` means it has already homed). All axes'
            flags are set to `False` by Smoothieware under three conditions:
            1) Smoothieware boots or resets, 2) if a HALT gcode or signal
            is sent, or 3) a homing/limitswitch error occured.
        :param speed: Optional speed for the move. If not specified, set to the
            current cached _combined_speed. To avoid conflict with callers that
            expect the smoothie's speed setting to always be combined_speed,
            the smoothie is set back to this state after every move


        If the current move split config indicates that the move should be
        broken up, the driver will do so. If the new position requires a
        change in position of an axis with a split configuration, it may be
        split into multiple moves such that the axis will move a maximum of the
        specified split distance at the specified current and speed. If the
        axis would move less than the split distance, it will move the
        entire distance at the specified current and speed.

        This command respects the run flag and will wait until it is set.

        The function may issue up to 3 moves:
        - if move splitting is required, the split move
        - the actual move, plus a bit extra to give room to preload backlash
        - if we preload backlash we then issue a third move to preload backlash
        """
        await self.run_flag.wait()

        def valid_movement(axis: str, coord: float) -> bool:
            """True if the axis is not disabled and the coord is different
            from the current position cache
            """
            return not (
                (axis in DISABLE_AXES)
                or isclose(coord, self.position[axis], rel_tol=1e-05, abs_tol=1e-08)
            )

        def only_moving(move_target: Dict[str, float]) -> Dict[str, float]:
            """Filter a target dict to have only those axes which have valid
            movements"""
            return {
                ax: coord
                for ax, coord in move_target.items()
                if valid_movement(ax, coord)
            }

        def create_coords_list(coords_dict: Dict[str, float]) -> CommandBuilder:
            """Build the gcode string for a move"""
            cmd = _command_builder()
            for axis, coords in sorted(coords_dict.items()):
                if valid_movement(axis, coords):
                    cmd.add_float(
                        prefix=axis, value=coords, precision=GCODE_ROUNDING_PRECISION
                    )
            return cmd

        moving_target = only_moving(target)
        if not moving_target:
            log.info(f"No axes move in {target} from position {self.position}")
            return

        # Multi-axis movements should include the added backlash.
        # After all axes arrive at target, finally then apply
        # a backlash correction to just the plunger axes
        plunger_backlash_axes = [
            axis
            for axis, value in target.items()
            if axis in "BC" and self.position[axis] < value
        ]
        backlash_target = {ax: moving_target[ax] for ax in plunger_backlash_axes}
        moving_target.update(
            {
                ax: moving_target[ax] + PLUNGER_BACKLASH_MM
                for ax in plunger_backlash_axes
            }
        )

        # whatever else we do to our motion target, if nothing moves in the
        # input we will not command it to move
        non_moving_axes = [ax for ax in AXES if ax not in moving_target.keys()]

        # cache which axes move because we might take them out of moving target
        moving_axes = list(moving_target.keys())

        def build_split(here: float, dest: float, split_distance: float) -> float:
            """Return the destination for the split move"""
            if dest < here:
                return max(dest, here - split_distance)
            else:
                return min(dest, here + split_distance)

        since_moved = self._axes_moved_at.time_since_moved()
        # generate the split moves if necessary
        split_target = {
            ax: build_split(
                self.position[ax],
                moving_target[ax],
                split.split_distance,
            )
            for ax, split in self._move_split_config.items()
            # a split is only necessary if:
            # - the axis is moving
            if (ax in moving_target)
            # - we have a split configuration
            and split
            # - it's been long enough since the last time it moved
            and ((since_moved[ax] is None) or (split.after_time < since_moved[ax]))  # type: ignore[operator]
        }

        split_command_string = create_coords_list(split_target)
        primary_command_string = create_coords_list(moving_target)
        backlash_command_string = create_coords_list(backlash_target)

        self.dwell_axes("".join(non_moving_axes))
        self.activate_axes("".join(moving_axes))

        checked_speed = speed or self._combined_speed

        if split_command_string:
            # set fullstepping if necessary
            split_prefix, split_postfix = self._build_fullstep_configurations(
                "".join(
                    (
                        ax
                        for ax in split_target.keys()
                        if self._move_split_config[ax].fullstep
                    )
                )
            )

            # move at the slowest required speed
            split_speed = min(
                split.split_speed
                for ax, split in self._move_split_config.items()
                if ax in split_target
            )

            # use the higher current from the split config without changing
            # our global cache
            split_prefix.add_builder(builder=self._build_speed_command(split_speed))
            cached = {}
            for ax in split_target.keys():
                cached[ax] = self.current[ax]
                self.current[ax] = self._move_split_config[ax].split_current
            split_prefix.add_builder(builder=self._generate_current_command())
            for ax in split_target.keys():
                self.current[ax] = cached[ax]

            split_command = (
                _command_builder()
                .add_gcode(gcode=GCODE.MOVE)
                .add_builder(builder=split_command_string)
            )
        else:
            split_prefix = _command_builder()
            split_command = _command_builder()
            split_postfix = _command_builder()

        command = _command_builder()

        if split_command_string or (checked_speed != self._combined_speed):
            command.add_builder(builder=self._build_speed_command(checked_speed))

        # introduce the standard currents
        command.add_builder(builder=self._generate_current_command())

        # move to target position, including any added backlash to B/C axes
        command.add_gcode(GCODE.MOVE).add_builder(builder=primary_command_string)
        if backlash_command_string:
            # correct the B/C positions
            command.add_gcode(gcode=GCODE.MOVE).add_builder(
                builder=backlash_command_string
            )

        if checked_speed != self._combined_speed:
            command.add_builder(builder=self._build_speed_command(self._combined_speed))

        for axis in target.keys():
            self.engaged_axes[axis] = True
        if home_flagged_axes:
            await self.home_flagged_axes("".join(list(target.keys())))

        async def _do_split() -> None:
            try:
                for sc in (c for c in (split_prefix, split_command) if c):
                    await self._send_command(sc)
            finally:
                if split_postfix:
                    await self._send_command(split_postfix)

        try:
            log.debug(f"move: {command}")
            # TODO (hmg) a movement's timeout should be calculated by
            # how long the movement is expected to take.
            await _do_split()
            await self._send_command(command, timeout=DEFAULT_EXECUTE_TIMEOUT)
        finally:
            # dwell pipette motors because they get hot
            plunger_axis_moved = "".join(set("BC") & set(target.keys()))
            if plunger_axis_moved:
                self.dwell_axes(plunger_axis_moved)
                await self._set_saved_current()
            self._axes_moved_at.mark_moved(moving_axes)

        self._update_position(target)

    async def home(
        self, axis: str = AXES, disabled: str = DISABLE_AXES
    ) -> Dict[str, float]:

        await self.run_flag.wait()

        axis = axis.upper()

        # If Y is requested make sure we home X first
        if "Y" in axis:
            axis += "X"
        # If horizontal movement is requested, ensure we raise the instruments
        if "X" in axis:
            axis += "ZA"
        # These two additions are safe even if they duplicate requested axes
        # because of the use of set operations below, which will de-duplicate
        # characters from the resulting string

        # HOME_SEQUENCE defines a pattern for homing, specifically that the
        # ZABC axes should be homed first so that horizontal movement doesn't
        # happen with the pipette down (which could bump into things). Then
        # the X axis is homed, which has to happen before Y. Finally Y can be
        # homed. This variable will contain the sequence just explained, but
        # filters out unrequested axes using set intersection (&) and then
        # filters out disabled axes using set difference (-)
        home_sequence = list(
            filter(
                None,
                [
                    "".join(set(group) & set(axis) - set(disabled))
                    for group in HOME_SEQUENCE
                ],
            )
        )

        non_moving_axes = "".join(ax for ax in AXES if ax not in home_sequence)
        self.dwell_axes(non_moving_axes)
        log.info(f"Homing axes {axis} in sequence {home_sequence}")
        for axes in home_sequence:
            if "X" in axes:
                await self._home_x()
            elif "Y" in axes:
                await self._home_y()
            else:
                # if we are homing neither the X nor Y axes, simple home
                self.activate_axes(axes)
                await self._do_relative_splits_during_home_for(
                    "".join(ax for ax in axes if ax in "BC")
                )

                command = self._generate_current_command()
                command.add_gcode(gcode=GCODE.HOME).add_element(
                    element="".join(sorted(axes))
                )
                try:
                    # home commands are executed before ack, use a long ack
                    # timeout and short execute timeout
                    await self._send_command(
                        command,
                        ack_timeout=DEFAULT_EXECUTE_TIMEOUT,
                        timeout=DEFAULT_ACK_TIMEOUT,
                    )
                    await self.update_homed_flags(flags={ax: True for ax in axes})
                finally:
                    # always dwell an axis after it has been homed
                    self.dwell_axes(axes)
                    await self._set_saved_current()

        # Only update axes that have been selected for homing
        homed_axes = "".join(home_sequence)
        axis_position = ((ax, self.homed_position.get(ax)) for ax in homed_axes)
        homed = {k: v for (k, v) in axis_position if v is not None}
        await self.update_position(default=homed)

        for ax in homed_axes:
            self.engaged_axes[ax] = True

        # coordinate after homing might not sync with default in API
        # so update this driver's homed position using current coordinates
        new = {ax: self.position[ax] for ax in homed_axes}
        self._homed_position.update(new)
        self._axes_moved_at.mark_moved(homed_axes)
        return self.position

    def _build_fullstep_configurations(
        self, axes: str
    ) -> Tuple[CommandBuilder, CommandBuilder]:
        """For one or more specified pipette axes,
        build a prefix and postfix command string that will configure
        the step mode and steps/mm value to
        - in the prefix: set full stepping with an appropriate steps/mm
        - in the postfix: set 1/32 microstepping with the correct steps/mm

        Prefix will always be empty or end with a space, and postfix will
        always be empty or start with a space, so they can be added to
        command strings easily
        """
        prefix = _command_builder()
        postfix = _command_builder()
        if not axes:
            return prefix, postfix
        assert all(
            (ax in "BC" for ax in axes)
        ), "only plunger axes have controllable microstepping"
        for ax in axes:
            prefix.add_gcode(gcode=MICROSTEPPING_GCODES[ax]["DISABLE"])
        for ax in axes:
            postfix.add_gcode(gcode=MICROSTEPPING_GCODES[ax]["ENABLE"])

        prefix.add_builder(
            builder=self._build_steps_per_mm(
                {ax: self.steps_per_mm[ax] / 32 for ax in axes}
            )
        ).add_gcode(gcode=GCODE.DWELL).add_float(prefix="P", value=0.01, precision=None)

        postfix.add_builder(
            builder=self._build_steps_per_mm({ax: self.steps_per_mm[ax] for ax in axes})
        ).add_gcode(gcode=GCODE.DWELL).add_float(prefix="P", value=0.01, precision=None)
        return prefix, postfix

    async def _do_relative_splits_during_home_for(self, axes: str) -> None:
        """Handle split moves for unsticking axes before home.

        This is particularly ugly bit of code that flips the motor controller
        into relative mode since we don't necessarily know where we are.

        It will induce a movement. It should really only be called before a
        home because it doesn't update the position cache.

        :param axes: A string that is a sequence of plunger axis names.
        """
        assert all(
            ax.lower() in "bc" for ax in axes
        ), "only plunger axes may be unstuck"
        since_moved = self._axes_moved_at.time_since_moved()
        split_currents = _command_builder().add_gcode(gcode=GCODE.SET_CURRENT)
        split_moves = _command_builder().add_gcode(gcode=GCODE.MOVE)
        applicable_speeds: List[float] = []
        log.debug(f"Finding splits for {axes} with since moved {since_moved}")
        to_unstick = [
            ax
            for ax in axes
            if (
                since_moved.get(ax) is None
                or (
                    self._move_split_config.get(ax)
                    and since_moved[ax]  # type: ignore[operator]
                    > self._move_split_config[ax].after_time
                )
            )
        ]
        for axis in axes:
            msc = self._move_split_config.get(axis)
            log.debug(f"axis {axis}: msc {msc}")
            if not msc:
                continue
            if axis in to_unstick:
                log.debug(f"adding unstick for {axis}")
                split_currents.add_float(
                    prefix=axis, value=msc.split_current, precision=None
                )
                split_moves.add_float(
                    prefix=axis, value=-msc.split_distance, precision=None
                )
                applicable_speeds.append(msc.split_speed)
        if not applicable_speeds:
            log.debug("no unstick needed")
            # nothing to do
            return

        fullstep_prefix, fullstep_postfix = self._build_fullstep_configurations(
            "".join(to_unstick)
        )

        command_sequence = [
            fullstep_prefix.add_builder(builder=split_currents)
            .add_gcode(gcode=GCODE.DWELL)
            .add_float(prefix="P", value=CURRENT_CHANGE_DELAY, precision=None)
            .add_builder(builder=self._build_speed_command(min(applicable_speeds)))
            .add_gcode(gcode=GCODE.RELATIVE_COORDS),
            split_moves,
        ]
        try:
            for command_string in command_sequence:
                await self._send_command(
                    command_string,
                    timeout=DEFAULT_EXECUTE_TIMEOUT,
                    suppress_home_after_error=True,
                )
        except SmoothieError:
            pass
        finally:
            await self._send_command(
                _command_builder()
                .add_gcode(gcode=GCODE.ABSOLUTE_COORDS)
                .add_builder(builder=fullstep_postfix)
                .add_builder(builder=self._build_speed_command(self._combined_speed))
            )

    async def fast_home(self, axis: str, safety_margin: float) -> Dict[str, float]:
        """home after a controlled motor stall

        Given a known distance we have just stalled along an axis, move
        that distance away from the homing switch. Then finish with home.
        """
        # move some mm distance away from the target axes endstop switch(es)
        axis_values = ((ax, self.homed_position.get(ax)) for ax in axis.upper())
        destination = {
            ax: val - abs(safety_margin) for (ax, val) in axis_values if val is not None
        }

        # there is a chance the axis will hit it's home switch too soon
        # if this happens, catch the error and continue with homing afterwards
        try:
            await self.move(destination)
        except SmoothieError:
            pass

        # then home once we're closer to the endstop(s)
        disabled = "".join(ax for ax in AXES if ax not in axis.upper())
        return await self.home(axis=axis, disabled=disabled)

    async def unstick_axes(
        self, axes: str, distance: Optional[float] = None, speed: Optional[float] = None
    ) -> None:
        """
        The plunger axes on OT2 can build up static friction over time and
        when it's cold. To get over this, the robot can move that plunger at
        normal current and a very slow speed to increase the torque, removing
        the static friction

        axes:
            String containing each axis to be moved. Ex: 'BC' or 'ZABC'

        distance:
            Distance to travel in millimeters (default is 1mm)

        speed:
            Millimeters-per-second to travel to travel at (default is 1mm/sec)
        """
        for ax in axes:
            if ax not in AXES:
                raise ValueError(f"Unknown axes: {axes}")

        if distance is None:
            distance = UNSTICK_DISTANCE
        if speed is None:
            speed = UNSTICK_SPEED

        self.push_active_current()
        self.set_active_current(
            {
                ax: self._config.high_current["default"][ax]  # type: ignore[misc]
                for ax in axes
            }
        )
        self.push_axis_max_speed()
        await self.set_axis_max_speed({ax: speed for ax in axes})

        # only need to request switch state once
        state_of_switches = await self.switch_state()

        # incase axes is pressing endstop, home it slowly instead of moving
        homing_axes = "".join(ax for ax in axes if state_of_switches[ax])
        moving_axes = {
            ax: self.position[ax] - distance  # retract
            for ax in axes
            if (not state_of_switches[ax]) and (ax not in homing_axes)
        }

        try:
            if moving_axes:
                await self.move(moving_axes)
            if homing_axes:
                await self.home(homing_axes)
        finally:
            self.pop_active_current()
            await self.pop_axis_max_speed()

    def pause(self) -> None:
        if not self.simulating:
            self.run_flag.clear()

    def resume(self) -> None:
        if not self.simulating:
            self.run_flag.set()

    async def delay(self, seconds: float) -> None:
        # per http://smoothieware.org/supported-g-codes:
        # In grbl mode P is float seconds to comply with gcode standards
        command = (
            _command_builder()
            .add_gcode(gcode=GCODE.DWELL)
            .add_float(prefix="P", value=seconds, precision=None)
        )

        log.debug(f"delay: {command}")
        await self._send_command(command, timeout=int(seconds) + 1)

    async def probe_axis(self, axis: str, probing_distance: float) -> Dict[str, float]:
        if axis.upper() in AXES:
            self.engaged_axes[axis] = True
            command = (
                _command_builder()
                .add_gcode(gcode=GCODE.PROBE)
                .add_int(
                    prefix="F", value=420  # 420 mm/min (7 mm/sec) to avoid resonance
                )
                .add_float(prefix=axis.upper(), value=probing_distance, precision=None)
            )
            log.debug(f"probe_axis: {command}")
            try:
                await self._send_command(
                    command=command,
                    ack_timeout=DEFAULT_MOVEMENT_TIMEOUT,
                    suppress_home_after_error=True,
                )
            except SmoothieError as se:
                log.exception("Tip probe failure")
                await self.home(axis)
                if "probe" in str(se).lower():
                    raise TipProbeError(se.ret_code, se.command)
                else:
                    raise
            await self.update_position(self.position)
            return self.position
        else:
            raise RuntimeError(f"Cant probe axis {axis}")

    def turn_on_blue_button_light(self) -> None:
        self._gpio_chardev.set_button_light(blue=True)

    def turn_on_green_button_light(self) -> None:
        self._gpio_chardev.set_button_light(green=True)

    def turn_on_red_button_light(self) -> None:
        self._gpio_chardev.set_button_light(red=True)

    def turn_off_button_light(self) -> None:
        self._gpio_chardev.set_button_light(red=False, green=False, blue=False)

    def turn_on_rail_lights(self) -> None:
        self._gpio_chardev.set_rail_lights(True)

    def turn_off_rail_lights(self) -> None:
        self._gpio_chardev.set_rail_lights(False)

    def get_rail_lights_on(self) -> bool:
        return self._gpio_chardev.get_rail_lights()

    def read_button(self) -> bool:
        return self._gpio_chardev.read_button()

    def read_window_switches(self) -> bool:
        return self._gpio_chardev.read_window_switches()

    def set_lights(
        self, button: Optional[bool] = None, rails: Optional[bool] = None
    ) -> None:
        if button is not None:
            self._gpio_chardev.set_button_light(blue=button)
        if rails is not None:
            self._gpio_chardev.set_rail_lights(rails)

    def get_lights(self) -> Dict[str, bool]:
        return {
            "button": self._gpio_chardev.get_button_light()[2],
            "rails": self._gpio_chardev.get_rail_lights(),
        }

    async def kill(self) -> None:
        """
        In order to terminate Smoothie motion immediately (including
        interrupting a command in progress, we set the reset pin low and then
        back to high, then call `_setup` method to send the RESET_FROM_ERROR
        Smoothie code to return Smoothie to a normal waiting state and reset
        any other state needed for the driver.
        """
        log.debug("kill")
        await self.hard_halt()
        await self._reset_from_error()
        await self._setup()

    async def home_flagged_axes(self, axes_string: str) -> None:
        """
        Given a list of axes to check, this method will home each axis if
        Smoothieware's internal flag sets it as needing to be homed
        """
        axes_that_need_to_home = [
            axis for axis in axes_string if not self.homed_flags.get(axis)
        ]
        if axes_that_need_to_home:
            axes_string = "".join(axes_that_need_to_home)
            await self.home(axes_string)

    async def _smoothie_reset(self) -> None:
        log.debug(f"Resetting Smoothie (simulating: {self.simulating})")
        if self.simulating:
            pass
        else:
            self._gpio_chardev.set_reset_pin(False)
            self._gpio_chardev.set_isp_pin(True)
            await asyncio.sleep(0.25)
            self._gpio_chardev.set_reset_pin(True)
            await asyncio.sleep(0.25)
            await self._wait_for_ack()
            await self._reset_from_error()

    async def _smoothie_programming_mode(self) -> None:
        log.debug(f"Setting Smoothie to ISP mode (simulating: {self.simulating})")
        if self.simulating:
            pass
        else:
            self._gpio_chardev.set_reset_pin(False)
            self._gpio_chardev.set_isp_pin(False)
            await asyncio.sleep(0.25)
            self._gpio_chardev.set_reset_pin(True)
            await asyncio.sleep(0.25)
            self._gpio_chardev.set_isp_pin(True)
            await asyncio.sleep(0.25)

    async def hard_halt(self) -> None:
        log.debug(f"Halting Smoothie (simulating: {self.simulating}")
        self._is_hard_halting.set()
        if self.simulating:
            pass
        else:
            self._gpio_chardev.set_halt_pin(False)
            await asyncio.sleep(0.25)
            self._gpio_chardev.set_halt_pin(True)
            await asyncio.sleep(0.25)
            self.run_flag.set()

    async def update_firmware(  # noqa: C901
        self,
        filename: str,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        explicit_modeset: bool = True,
    ) -> str:
        """
        Program the smoothie board with a given hex file.

        If explicit_modeset is True (default), explicitly place the smoothie in
        programming mode.

        If explicit_modeset is False, assume the smoothie is already in
        programming mode.
        """
        try:
            smoothie_update._ensure_programmer_executable()
        except OSError as ose:
            if ose.errno == 30:
                # This is "read only filesystem" and happens on buildroot
                pass
            else:
                raise

        if not await self.is_connected():
            log.info("Getting port to connect")
            await self._connect_to_port()

        assert self._connection, "driver must have been initialized with a port"
        # get port name
        port = self._connection.port

        if explicit_modeset:
            log.info("Setting programming mode")
            # set smoothieware into programming mode
            await self._smoothie_programming_mode()
            # close the port so other application can access it
            await self._connection.close()

        # run lpc21isp, THIS WILL TAKE AROUND 1 MINUTE TO COMPLETE
        update_cmd = (
            f"lpc21isp -wipe -donotstart {filename} "
            f"{port} {self._config.serial_speed} 12000"
        )
        kwargs: Dict[str, Any] = {
            "stdout": asyncio.subprocess.PIPE,
            "stderr": asyncio.subprocess.PIPE,
        }
        if loop:
            kwargs["loop"] = loop
        log.info(update_cmd)
        before = time()
        proc = await asyncio.create_subprocess_shell(update_cmd, **kwargs)
        created = time()
        log.info(f"created lpc21isp subproc in {created-before}")
        out_b, err_b = await proc.communicate()
        done = time()
        log.info(f"ran lpc21isp subproc in {done-created}")
        if proc.returncode != 0:
            log.error(
                f"Smoothie update failed: {proc.returncode}" f" {out_b!r} {err_b!r}"
            )
            raise RuntimeError(
                f"Failed to program smoothie: {proc.returncode}: {err_b!r}"
            )
        else:
            log.info("Smoothie update complete")
        try:
            await self._connection.close()
        except Exception:
            log.exception("Failed to close smoothie connection.")
        # re-open the port
        await self._connection.open()
        # reset smoothieware
        await self._smoothie_reset()
        # run setup gcodes
        await self._setup()

        return out_b.decode().strip()

    # ----------- END Public interface ------------ #
