import asyncio
import logging
from typing import Any, Dict, Optional

from opentrons.driver.async_serial_communication import AsyncConnection
from opentrons.drivers.util import SerialNoResponse
from opentrons.drivers.rpi_drivers import gpio
from opentrons.system import smoothie_update
from opentrons.config.robot_configs import robot_config
from opentrons.config import SMOOTHIE_ID

from .constants import (AXES, EEPROM_DEFAULT, HOMED_POSITION,
                        DEFAULT_AXES_SPEED, GCODES,
                        GCODE_ROUNDING_PRECISION,
                        DEFAULT_STABILIZE_DELAY,
                        DEFAULT_COMMAND_RETRIES,
                        CURRENT_CHANGE_DELAY,
                        DISABLE_AXES,
                        SMOOTHIE_BOOT_TIMEOUT,
                        DEFAULT_SMOOTHIE_TIMEOUT,
                        DEFAULT_MOVEMENT_TIMEOUT,
                        SMOOTHIE_COMMAND_TERMINATOR,
                        SMOOTHIE_ACK,
                        ALARM_KEYWORD, ERROR_KEYWORD,
                        Y_BACKOFF_LOW_CURRENT,
                        Y_BACKOFF_SLOW_SPEED,
                        Y_SWITCH_BACK_OFF_MM,
                        Y_SWITCH_REVERSE_BACK_OFF_MM,
                        Y_RETRACT_SPEED,
                        Y_RETRACT_DISTANCE,
                        XY_HOMING_SPEED,
                        PLUNGER_BACKLASH_MM,
                        UNSTICK_DISTANCE,
                        UNSTICK_SPEED,)
from .util import (SmoothieError, SmoothieAlarm, ParseError,
                   parse_position_response, parse_instrument_data,
                   parse_switch_values, parse_homing_status_values,
                   remove_unwanted_characters, build_home_behaviors,
                   byte_array_to_ascii_string, byte_array_to_hex_string)
'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way
  or knowing anything about what the axes are used for
'''

log = logging.getLogger(__name__)


class AsyncSmoothie:
    def __init__(self,
                 config: robot_config,
                 connection: AsyncConnection) -> None:
        """ Build an async smoothie.

        The config should be a robot config. The connection should be an
        already-connected AsyncConnection.
        """
        self.run_flag = asyncio.Event()
        self.run_flag.set()
        self.dist_from_eeprom = EEPROM_DEFAULT.copy()

        self._position = HOMED_POSITION.copy()

        # why do we do this after copying the HOMED_POSITION?
        self._update_position({axis: 0 for axis in AXES})

        self._connection = connection
        self._config = config

        # Current settings:
        # The amperage of each axis, has been organized into three states:
        # Current-Settings is the amperage each axis was last set to
        # Active-Current-Settings is set when an axis is moving/homing
        # Dwelling-Current-Settings is set when an axis is NOT moving/homing
        self._current_settings = {
            'now': config.low_current.copy(),
            'saved': config.low_current.copy()  # used in push/pop methods
        }
        self._active_current_settings = {
            'now': config.high_current.copy(),
            'saved': config.high_current.copy()  # used in push/pop methods
        }
        self._dwelling_current_settings = {
            'now': config.low_current.copy(),
            'saved': config.low_current.copy()  # used in push/pop methods
        }

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
        self._max_speed_settings = config.default_max_speed.copy()
        self._saved_max_speed_settings = self._max_speed_settings.copy()
        self._combined_speed = float(DEFAULT_AXES_SPEED)
        self._saved_axes_speed = float(self._combined_speed)
        self._steps_per_mm: Dict[str, float] = {}
        self._acceleration = config.acceleration.copy()
        self._saved_acceleration = config.acceleration.copy()

        # position after homing
        self._homed_position = HOMED_POSITION.copy()
        self.homed_flags: Dict[str, bool] = {
            'X': False,
            'Y': False,
            'Z': False,
            'A': False,
            'B': False,
            'C': False
        }

        self._is_hard_halting = asyncio.Event()

    @classmethod
    async def build_and_connect(cls, config: robot_config,
                                device=None,
                                port=None,
                                baudrate: int = None):
        connection = await AsyncConnection.build_and_connect(
            device or SMOOTHIE_ID,
            port=port,
            baudrate=baudrate or config.serial_speed)
        return cls(config, connection)

    @property
    def homed_position(self):
        return self._homed_position.copy()

    def _update_position(self, target):
        self._position.update({
            axis: value
            for axis, value in target.items() if value is not None
        })

    async def update_position(self) -> Dict[str, float]:
        """ Retrieve the current position from the smoothie """
        for attempt in range(DEFAULT_COMMAND_RETRIES):
            try:
                position_response = await self._send_command(
                    GCODES['CURRENT_POSITION'])
                updated_position = parse_position_response(position_response)
                self._update_position(updated_position)
                return self._position
            except ParseError:
                await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
        raise SmoothieError("Couldn't retrieve position")

    async def read_pipette_id(self, mount) -> Optional[str]:
        '''
        Reads in an attached pipette's ID
        The ID is unique to this pipette, and is a string of unknown length

        :param mount: string with value 'left' or 'right'
        :return id string, or None
        '''
        res: Optional[str] = None
        try:
            res = await self._read_from_pipette(
                GCODES['READ_INSTRUMENT_ID'], mount)
        except UnicodeDecodeError:
            log.exception("Failed to decode pipette ID string:")
            res = None
        return res

    async def read_pipette_model(self, mount: str) -> Optional[str]:
        '''
        Reads an attached pipette's MODEL
        The MODEL is a unique string for this model of pipette

        :param mount: string with value 'left' or 'right'
        :return model string, or None
        '''
        res = await self._read_from_pipette(
            GCODES['READ_INSTRUMENT_MODEL'], mount)
        if res and '_v' not in res:
            # Backward compatibility for pipettes programmed with model
            # strings that did not include the _v# designation
            res = res + '_v1'
        elif res and '_v13' in res:
            # Backward compatibility for pipettes programmed with model
            # strings that did not include the "." to seperate version
            # major and minor values
            res = res.replace('_v13', '_v1.3')

        return res

    async def write_pipette_id(self, mount: str, data_string: str):
        '''
        Writes to an attached pipette's ID memory location
        The ID is unique to this pipette, and is a string of unknown length

        NOTE: To enable write-access to the pipette, its button must be held

        mount:
            String (str) with value 'left' or 'right'
        data_string:
            String (str) that is of unknown length, and should be unique to
            this one pipette
        '''
        await self._write_to_pipette(
            GCODES['WRITE_INSTRUMENT_ID'], mount, data_string)

    async def write_pipette_model(self, mount: str, data_string: str):
        '''
        Writes to an attached pipette's MODEL memory location
        The MODEL is a unique string for this model of pipette

        NOTE: To enable write-access to the pipette, its button must be held

        mount:
            String (str) with value 'left' or 'right'
        data_string:
            String (str) that is unique to this model of pipette
        '''
        await self._write_to_pipette(
            GCODES['WRITE_INSTRUMENT_MODEL'], mount, data_string)

    async def update_pipette_config(
            self,
            axis: str,
            data: Dict[str, float]) -> Dict[str, Dict[str, float]]:
        '''
        Updates the following configs for a given pipette mount based on
        the detected pipette type:
        - homing positions M365.0
        - Max Travel M365.1
        - endstop debounce M365.2 (NOT for zprobe debounce)
        - retract from endstop distance M365.3p
        '''
        gcodes = {
            'retract': 'M365.3',
            'debounce': 'M365.2',
            'max_travel': 'M365.1',
            'home': 'M365.0'}

        res_msg: Dict[str, Dict[str, float]] = {axis: {}}

        for key, value in data.items():
            if key == 'debounce':
                # debounce variable for all axes, so do not specify an axis
                cmd = f' O{value}'
            else:
                cmd = f' {axis}{value}'
            res = await self._send_command(gcodes[key] + cmd)
            if res is None:
                raise ValueError(
                    f'{key} was not updated to {value} on {axis} axis')
            # ensure smoothie received code and changed value through
            # return message. Format of return message:
            # <Axis> (or E for endstop) updated <Value>
            arr_result = res.strip().split(' ')
            res_msg[axis][str(arr_result[0])] = float(arr_result[2])

        return res_msg

    @property
    def port(self):
        return self._connection.port

    async def get_fw_version(self):
        '''
        Queries Smoothieware for it's build version, and returns
        the parsed response.

        returns: str
            Current version of attached Smoothi-driver. Versions are derived
            from git branch-hash (eg: edge-66ec883NOMSD)

        Example Smoothieware response:

        Build version: edge-66ec883NOMSD, Build date: Jan 28 2018 15:26:57, MCU: LPC1769, System Clock: 120MHz  # NOQA
          CNC Build   NOMSD Build
        6 axis
        '''
        version = await self._send_command('version')
        version = version.split(',')[0].split(':')[-1].strip()
        version = version.replace('NOMSD', '')
        return version

    @property
    def position(self):
        """
        Instead of sending M114.2 we are storing target values in
        self._position since movement and home commands are blocking and
        assumed to go the correct place.

        Cases where Smoothie would not be in the correct place (such as if a
        belt slips) would not be corrected by getting position with M114.2
        because Smoothie would also not be aware of slippage.
        """
        return {k.upper(): v for k, v in self._position.items()}

    async def get_switch_state(self):
        '''Returns the state of all SmoothieBoard limit switches'''
        res = await self._send_command(GCODES['LIMIT_SWITCH_STATUS'])
        return parse_switch_values(res)

    async def update_homed_flags(self, flags=None):
        '''
        Returns Smoothieware's current homing-status, which is a dictionary
        of boolean values for each axis (XYZABC). If an axis is False, then it
        still needs to be homed, and it's coordinate cannot be trusted.
        Smoothieware sets it's internal homing flags for all axes to False when
        it has yet to home since booting/restarting, or an endstop/homing error

        returns: dict
            {
                'X': False,
                'Y': True,
                'Z': False,
                'A': True,
                'B': False,
                'C': True
            }
        '''
        if flags and isinstance(flags, dict):
            self.homed_flags.update(flags)

        last_error = None
        for attempt in range(DEFAULT_COMMAND_RETRIES):
            try:
                res = await self._send_command(GCODES['HOMING_STATUS'])
                flags = parse_homing_status_values(res)
                self.homed_flags.update(flags)
                break
            except ParseError as e:
                last_error = e
                await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
        else:
            if last_error:
                raise last_error
            else:
                raise SmoothieError('Could not update homed flags')

    @property
    def current(self):
        return self._current_settings['now']

    @property
    def steps_per_mm(self):
        return self._steps_per_mm

    async def set_speed(self, value):
        ''' set total axes movement speed in mm/second'''
        self._combined_speed = float(value)
        speed_per_min = int(self._combined_speed * 60)
        command = GCODES['SET_SPEED'] + str(speed_per_min)
        log.debug("set_speed: {}".format(command))
        await self._send_command(command)

    def push_speed(self):
        self._saved_axes_speed = float(self._combined_speed)

    async def pop_speed(self):
        await self.set_speed(self._saved_axes_speed)

    async def set_axis_max_speed(self, settings):
        '''
        Sets the maximum speed (mm/sec) that a given axis will move

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for millimeters per second (mm/sec)
        '''
        self._max_speed_settings.update(settings)
        values = ['{}{}'.format(axis.upper(), value)
                  for axis, value in sorted(settings.items())]
        command = '{} {}'.format(
            GCODES['SET_MAX_SPEED'],
            ' '.join(values)
        )
        log.debug("set_axis_max_speed: {}".format(command))
        await self._send_command(command)

    def push_axis_max_speed(self):
        self._saved_max_speed_settings = self._max_speed_settings.copy()

    async def pop_axis_max_speed(self):
        await self.set_axis_max_speed(self._saved_max_speed_settings)

    async def set_acceleration(self, settings):
        '''
        Sets the acceleration (mm/sec^2) that a given axis will move

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for mm-per-second-squared (mm/sec^2)
        '''
        self._acceleration.update(settings)
        values = ['{}{}'.format(axis.upper(), value)
                  for axis, value in sorted(settings.items())]
        command = '{} {}'.format(
            GCODES['ACCELERATION'],
            ' '.join(values)
        )
        log.debug("set_acceleration: {}".format(command))
        await self._send_command(command)

    def push_acceleration(self):
        self._saved_acceleration = self._acceleration.copy()

    async def pop_acceleration(self):
        await self.set_acceleration(self._saved_acceleration)

    def set_active_current(self, settings):
        '''
        Sets the amperage of each motor for when it is activated by driver.
        Values are initialized from the `robot_config.high_current` values,
        and can then be changed through this method by other parts of the API.

        For example, `Pipette` setting the active-current of it's pipette,
        depending on what model pipette it is, and what action it is performing

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        '''
        self._active_current_settings['now'].update(settings)

        # if an axis specified in the `settings` is currently active,
        # reset it's current to the new active-current value
        active_axes_to_update = {
            axis: amperage
            for axis, amperage in self._active_current_settings['now'].items()
            if self._active_axes.get(axis) is True
            if self.current[axis] != amperage
        }
        if active_axes_to_update:
            self._save_current(active_axes_to_update, axes_active=True)

    def push_active_current(self):
        self._active_current_settings['saved'].update(
            self._active_current_settings['now'])

    def pop_active_current(self):
        self.set_active_current(self._active_current_settings['saved'])

    def set_dwelling_current(self, settings):
        '''
        Sets the amperage of each motor for when it is dwelling.
        Values are initialized from the `robot_config.log_current` values,
        and can then be changed through this method by other parts of the API.

        For example, `Pipette` setting the dwelling-current of it's pipette,
        depending on what model pipette it is.

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        '''
        self._dwelling_current_settings['now'].update(settings)

        # if an axis specified in the `settings` is currently dwelling,
        # reset it's current to the new dwelling-current value
        dwelling_axes_to_update = {
            axis: amps
            for axis, amps in self._dwelling_current_settings['now'].items()
            if self._active_axes.get(axis) is False
            if self.current[axis] != amps
        }
        if dwelling_axes_to_update:
            self._save_current(dwelling_axes_to_update, axes_active=False)

    def push_dwelling_current(self):
        self._dwelling_current_settings['saved'].update(
            self._dwelling_current_settings['now'])

    def pop_dwelling_current(self):
        self.set_dwelling_current(self._dwelling_current_settings['saved'])

    def _save_current(self, settings, axes_active=True):
        '''
        Sets the current in Amperes (A) by axis. Currents are limited to be
        between 0.0-2.0 amps per axis motor.

        Note: this method does not send gcode commands, but instead stores the
        desired current setting. A seperate call to _generate_current_command()
        will return a gcode command that can be used to set Smoothie's current

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        '''
        self._active_axes.update({
            ax: axes_active
            for ax in settings.keys()
        })
        self._current_settings['now'].update(settings)
        log.debug("_save_current: {}".format(self.current))

    async def _set_saved_current(self):
        '''
        Sends the driver's current settings to the serial port as gcode. Call
        this method to set the axis-current state on the actual Smoothie
        motor-driver.
        '''
        await self._send_command(self._generate_current_command())

    def _generate_current_command(self):
        '''
        Returns a constructed GCode string that contains this driver's
        axis-current settings, plus a small delay to wait for those settings
        to take effect.
        '''
        values = ['{}{}'.format(axis, value)
                  for axis, value in sorted(self.current.items())]
        current_cmd = '{} {}'.format(
            GCODES['SET_CURRENT'],
            ' '.join(values)
        )
        command = '{currents} {code}P{seconds}'.format(
            currents=current_cmd,
            code=GCODES['DWELL'],
            seconds=CURRENT_CHANGE_DELAY
        )
        log.debug("_generate_current_command: {}".format(command))
        return command

    async def disengage_axis(self, axes):
        '''
        Disable the stepper-motor-driver's 36v output to motor
        This is a safe GCODE to send to Smoothieware, as it will automatically
        re-engage the motor if it receives a home or move command

        axes
            String containing the axes to be disengaged
            (e.g.: 'XY' or 'ZA' or 'XYZABC')
        '''
        axes = ''.join(set(axes.upper()) & set(AXES))
        if axes:
            log.debug("disengage_axis: {}".format(axes))
            await self._send_command(GCODES['DISENGAGE_MOTOR'] + axes)
            for axis in axes:
                self.engaged_axes[axis] = False

    def dwell_axes(self, axes):
        '''
        Sets motors to low current, for when they are not moving.

        Dwell for XYZA axes is only called after HOMING
        Dwell for BC axes is called after both HOMING and MOVING

        axes:
            String containing the axes to set to low current (eg: 'XYZABC')
        '''
        axes = ''.join(set(axes) & set(AXES) - set(DISABLE_AXES))
        dwelling_currents = {
            ax: self._dwelling_current_settings['now'][ax]
            for ax in axes
            if self._active_axes[ax] is True
        }
        if dwelling_currents:
            self._save_current(dwelling_currents, axes_active=False)

    def activate_axes(self, axes):
        '''
        Sets motors to a high current, for when they are moving
        and/or must hold position

        Activating XYZABC axes before both HOMING and MOVING

        axes:
            String containing the axes to set to high current (eg: 'XYZABC')
        '''
        axes = ''.join(set(axes) & set(AXES) - set(DISABLE_AXES))
        active_currents = {
            ax: self._active_current_settings['now'][ax]
            for ax in axes
            if self._active_axes[ax] is False
        }
        if active_currents:
            self._save_current(active_currents, axes_active=True)

    # ----------- Private functions --------------- #

    async def _wait_for_ack(self):
        '''
        In the case where smoothieware has just been reset, we want to
        ignore all the garbage it spits out

        This methods writes a sequence of newline characters, which will
        guarantee Smoothieware responds with 'ok\r\nok\r\n' within 3 seconds
        '''
        await self._send_command('\r\n', timeout=SMOOTHIE_BOOT_TIMEOUT)

    async def _reset_from_error(self):
        # smoothieware will ignore new messages for a short time
        # after it has entered an error state, so sleep for some milliseconds
        await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
        log.debug("reset_from_error")
        await self._send_command(GCODES['RESET_FROM_ERROR'])
        await self.update_homed_flags()

    # Potential place for command optimization (buffering, flushing, etc)
    async def _send_command(
            self, command: str,
            timeout: float = DEFAULT_SMOOTHIE_TIMEOUT) -> str:
        """
        Submit a GCODE command to the robot, followed by M400 to block until
        done. This method also ensures that any command on the B or C axis
        (the axis for plunger control) do current ramp-up and ramp-down, so
        that plunger motors rest at a low current to prevent burn-out.

        In the case of a limit-switch alarm during any command other than home,
        the robot should home the axis from the alarm and then raise a
        SmoothieError. The robot should *not* recover and continue to run the
        protocol, as thins could result in unpredicable handling of liquids.
        When a SmoothieError is raised, the user should inspect the physical
        configuration of the robot and the protocol and determine why the limit
        switch was hit unexpectedly. This is usually due to an undetected
        collision in a previous move command.

        :param command: the GCODE to submit to the robot
        :param timeout: the time to wait before returning (indefinite wait if
            this is set to none
        """
        try:
            cmd_ret = await self._write_with_retries(
                command + SMOOTHIE_COMMAND_TERMINATOR,
                5.0, DEFAULT_COMMAND_RETRIES)
            cmd_ret = remove_unwanted_characters(command, cmd_ret)
            self._handle_return(cmd_ret)
            wait_ret = await self._connection.write_and_return(
                GCODES['WAIT'] + SMOOTHIE_COMMAND_TERMINATOR,
                SMOOTHIE_ACK, self._connection, timeout=12000)
            wait_ret = remove_unwanted_characters(
                GCODES['WAIT'], wait_ret)
            self._handle_return(wait_ret)
            return cmd_ret.strip()
        except SmoothieError as se:
            # XXX: This is a reentrancy error because another command could
            # swoop in here. We're already resetting though and errors (should
            # be) rare so it's probably fine, but the actual solution to this
            # is locking at a higher level like in APIv2.
            await self._reset_from_error()
            if se.ret_code:
                error_axis = se.ret_code.strip()[-1]
                if GCODES['HOME'] not in command and error_axis in 'XYZABC':
                    log.warning(
                        f"alarm/error in {se.ret_code}, homing {error_axis}")
                    await self.home(error_axis)
                    raise SmoothieError(se.ret_code, command)
            else:
                log.warning(f'Unknown smoothie error: {se}')
                raise
            return ''

    def _handle_return(self, ret_code: str):
        """ Check the return string from smoothie for an error condition.

        Usually raises a SmoothieError, which can be handled by the error
        handling in write_with_retries. However, if the hard halt line has
        been set, we need to catch that halt and _not_ handle it, since it
        is used for things like cancelling protocols and needs to be
        handled elsewhere. In that case, we raise SmoothieAlarm, which isn't
        (and shouldn't be) handled by the normal error handling.
        """
        is_alarm = ALARM_KEYWORD in ret_code.lower()
        is_error = ERROR_KEYWORD in ret_code.lower()
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
                raise SmoothieError(ret_code)

    async def _write_with_retries(
            self, cmd: str, timeout: float, retries: int) -> str:
        if not self._connection:
            raise RuntimeError('Not connected')
        for attempt in range(retries):
            try:
                ret = await self._connection.write_and_return(
                    cmd,
                    SMOOTHIE_ACK,
                    timeout=timeout)
                if attempt != 0:
                    log.warning(
                        f"required {attempt} retries for {cmd.strip()}")
                return ret
            except SerialNoResponse:
                await asyncio.sleep(DEFAULT_STABILIZE_DELAY)
        raise SerialNoResponse()

    async def _home_x(self):
        log.debug("_home_x")
        # move the gantry forward on Y axis with low power
        self._save_current({'Y': Y_BACKOFF_LOW_CURRENT})
        self.push_axis_max_speed()
        await self.set_axis_max_speed({'Y': Y_BACKOFF_SLOW_SPEED})

        # move away from the Y endstop switch, then backward half that distance
        relative_retract_command = '{0} {1}Y{2} {3}Y{4} {5}'.format(
            GCODES['RELATIVE_COORDS'],  # set to relative coordinate system
            GCODES['MOVE'],             # move towards front of machine
            str(int(-Y_SWITCH_BACK_OFF_MM)),
            GCODES['MOVE'],             # move towards back of machine
            str(int(Y_SWITCH_REVERSE_BACK_OFF_MM)),
            GCODES['ABSOLUTE_COORDS']   # set back to abs coordinate system
        )

        command = '{0} {1}'.format(
            self._generate_current_command(), relative_retract_command)
        await self._send_command(command, timeout=DEFAULT_MOVEMENT_TIMEOUT)
        self.dwell_axes('Y')

        # now it is safe to home the X axis
        try:
            # override firmware's default XY homing speed, to avoid resonance
            await self.set_axis_max_speed({'X': XY_HOMING_SPEED})
            self.activate_axes('X')
            command = '{0} {1}'.format(
                self._generate_current_command(),
                GCODES['HOME'] + 'X'
            )
            await self._send_command(command, timeout=DEFAULT_MOVEMENT_TIMEOUT)
            await self.update_homed_flags(flags={'X': True})
        finally:
            await self.pop_axis_max_speed()
            self.dwell_axes('X')
            await self._set_saved_current()

    async def _home_y(self):
        log.debug("_home_y")
        # override firmware's default XY homing speed, to avoid resonance
        self.push_axis_max_speed()
        await self.set_axis_max_speed({'Y': XY_HOMING_SPEED})

        self.activate_axes('Y')
        # home the Y at normal speed (fast)
        command = '{0} {1}'.format(
            self._generate_current_command(),
            GCODES['HOME'] + 'Y'
        )
        await self._send_command(command, timeout=DEFAULT_MOVEMENT_TIMEOUT)

        # slow the maximum allowed speed on Y axis
        await self.set_axis_max_speed({'Y': Y_RETRACT_SPEED})

        # retract, then home, then retract again
        relative_retract_command = '{0} {1}Y{2} {3}'.format(
            GCODES['RELATIVE_COORDS'],  # set to relative coordinate system
            GCODES['MOVE'],             # move 3 millimeters away from switch
            str(-Y_RETRACT_DISTANCE),
            GCODES['ABSOLUTE_COORDS']   # set back to abs coordinate system
        )
        try:
            await self._send_command(
                relative_retract_command, timeout=DEFAULT_MOVEMENT_TIMEOUT)
            await self._send_command(
                GCODES['HOME'] + 'Y', timeout=DEFAULT_MOVEMENT_TIMEOUT)
            await self.update_homed_flags(flags={'Y': True})
            await self._send_command(
                relative_retract_command, timeout=DEFAULT_MOVEMENT_TIMEOUT)
        finally:
            await self.pop_axis_max_speed()  # bring max speeds back to normal
            self.dwell_axes('Y')
            await self._set_saved_current()

    async def _setup(self):
        log.debug("_setup")
        try:
            await self._wait_for_ack()
        except SerialNoResponse:
            # incase motor-driver is stuck in bootloader and unresponsive,
            # use gpio to reset into a known state
            log.debug("wait for ack failed, resetting")
            await self._smoothie_reset()
        log.debug("wait for ack done")
        await self._reset_from_error()
        log.debug("_reset")
        self.update_steps_per_mm(self._config.gantry_steps_per_mm)
        log.debug("sent steps")
        await self._send_command(GCODES['ABSOLUTE_COORDS'])
        log.debug("sent abs")
        self._save_current(self.current, axes_active=False)
        log.debug("sent current")
        await self.update_position(default=self.homed_position)
        await self.pop_axis_max_speed()
        await self.pop_speed()
        await self.pop_acceleration()
        log.debug("setup done")

    async def update_steps_per_mm(self, data):
        # Using M92, update steps per mm for a given axis
        if isinstance(data, str):
            # Unfortunately update server calls driver._setup() before the
            # update can correctly load the robot_config change on disk.
            # Need to account for old command format to avoid this issue.
            await self._send_command(data)
        else:
            cmd = ''
            for axis, value in data.items():
                cmd = f'{cmd} {axis}{value}'
                self.steps_per_mm[axis] = value
            await self._send_command(GCODES['STEPS_PER_MM'] + cmd)

    async def _read_from_pipette(self, gcode, mount) -> Optional[str]:
        '''
        Read from an attached pipette's internal memory. The gcode used
        determines which portion of memory is read and returned.

        All motors must be disengaged to consistently read over I2C lines

        gcode:
            String (str) containing a GCode
            either 'READ_INSTRUMENT_ID' or 'READ_INSTRUMENT_MODEL'
        mount:
            String (str) with value 'left' or 'right'
        '''
        allowed_mounts = {'left': 'L', 'right': 'R'}
        mount = allowed_mounts.get(mount)
        if not mount:
            raise ValueError('Unexpected mount: {}'.format(mount))
        try:
            # EMI interference from both plunger motors has been found to
            # prevent the I2C lines from communicating between Smoothieware and
            # pipette's onboard EEPROM. To avoid, turn off both plunger motors
            await self.disengage_axis('BC')
            await self.delay(CURRENT_CHANGE_DELAY)
            # request from Smoothieware the information from that pipette
            response = await self._send_command(gcode + mount)
            if response:
                result = parse_instrument_data(response)
                assert mount in result
                # data is read/written as strings of HEX characters
                # to avoid firmware weirdness in how it parses GCode arguments
                return byte_array_to_ascii_string(result[mount])
        except (ParseError, AssertionError, SmoothieError):
            pass
        return None

    async def _write_to_pipette(self, gcode, mount, data_string):
        '''
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
        '''
        allowed_mounts = {'left': 'L', 'right': 'R'}
        mount = allowed_mounts.get(mount)
        if not mount:
            raise ValueError('Unexpected mount: {}'.format(mount))
        if not isinstance(data_string, str):
            raise ValueError(
                'Expected {0}, not {1}'.format(str, type(data_string)))
        # EMI interference from both plunger motors has been found to
        # prevent the I2C lines from communicating between Smoothieware and
        # pipette's onboard EEPROM. To avoid, turn off both plunger motors
        await self.disengage_axis('BC')
        await self.delay(CURRENT_CHANGE_DELAY)
        # data is read/written as strings of HEX characters
        # to avoid firmware weirdness in how it parses GCode arguments
        byte_string = byte_array_to_hex_string(
            bytearray(data_string.encode()))
        command = gcode + mount + byte_string
        log.debug("_write_to_pipette: {}".format(command))
        await self._send_command(command)

    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    async def move(self, target, home_flagged_axes=False):
        '''
        Move to the `target` Smoothieware coordinate, along any of the size
        axes, XYZABC.

        target: dict
            dict setting the coordinate that Smoothieware will be at when
            `move()` returns. `target` keys are the axis in upper-case, and the
            values are the coordinate in millimeters (float)

        home_flagged_axes: boolean (default=False)
            If set to `True`, each axis included within the target coordinate
            may be homed before moving, determined by Smoothieware's internal
            homing-status flags (`True` means it has already homed). All axes'
            flags are set to `False` by Smoothieware under three conditions:
            1) Smoothieware boots or resets, 2) if a HALT gcode or signal
            is sent, or 3) a homing/limitswitch error occured.
        '''
        from numpy import isclose

        await self.run_flag.wait()

        def valid_movement(coords, axis):
            return not (
                (axis in DISABLE_AXES) or
                (coords is None) or
                isclose(coords, self.position[axis])
            )

        def create_coords_list(coords_dict):
            return [
                axis + str(round(coords, GCODE_ROUNDING_PRECISION))
                for axis, coords in sorted(coords_dict.items())
                if valid_movement(coords, axis)
            ]

        backlash_target = target.copy()
        backlash_target.update({
            axis: value + PLUNGER_BACKLASH_MM
            for axis, value in sorted(target.items())
            if axis in 'BC' and self.position[axis] < value
        })

        target_coords = create_coords_list(target)
        backlash_coords = create_coords_list(backlash_target)

        if target_coords:
            non_moving_axes = ''.join([
                ax
                for ax in AXES
                if ax not in target.keys()
            ])
            self.dwell_axes(non_moving_axes)
            self.activate_axes(target.keys())

            # include the current-setting gcodes within the moving gcode string
            # to reduce latency, since we're setting current so much
            command = self._generate_current_command()

            if backlash_coords != target_coords:
                command += ' ' + GCODES['MOVE'] + ''.join(backlash_coords)
            command += ' ' + GCODES['MOVE'] + ''.join(target_coords)

            try:
                for axis in target.keys():
                    self.engaged_axes[axis] = True
                if home_flagged_axes:
                    await self.home_flagged_axes(''.join(list(target.keys())))
                log.debug("move: {}".format(command))
                # TODO (andy) a movement's timeout should be calculated by
                # how long the movement is expected to take. A default timeout
                # of 30 seconds prevents any movements that take longer
                await self._send_command(command,
                                         timeout=DEFAULT_MOVEMENT_TIMEOUT)
            finally:
                # dwell pipette motors because they get hot
                plunger_axis_moved = ''.join(set('BC') & set(target.keys()))
                if plunger_axis_moved:
                    self.dwell_axes(plunger_axis_moved)
                    await self._set_saved_current()

            self._update_position(target)

    async def home(self, axis=AXES, disabled=DISABLE_AXES):

        await self.run_flag.wait()

        home_sequence, non_moving_axes = build_home_behaviors(
            axis, disabled)
        self.dwell_axes(non_moving_axes)

        for axes in home_sequence:
            if 'X' in axes:
                await self._home_x()
            elif 'Y' in axes:
                await self._home_y()
            else:
                # if we are homing neither the X nor Y axes, simple home
                self.activate_axes(axes)

                # include the current-setting gcodes within the moving gcode
                # string to reduce latency, since we're setting current so much
                command = self._generate_current_command()
                command += ' ' + GCODES['HOME'] + ''.join(sorted(axes))
                try:
                    log.debug("home: {}".format(command))
                    await self._send_command(
                        command, timeout=DEFAULT_MOVEMENT_TIMEOUT)
                    await self.update_homed_flags(
                        flags={ax: True for ax in axes})
                finally:
                    # always dwell an axis after it has been homed
                    self.dwell_axes(axes)
                    await self._set_saved_current()

        # Only update axes that have been selected for homing
        homed = {
            ax: self.homed_position.get(ax)
            for ax in ''.join(home_sequence)
        }
        log.info(f'Home before update pos {homed}')
        await self.update_position(default=homed)
        for axis in ''.join(home_sequence):
            self.engaged_axes[axis] = True

        # coordinate after homing might not synce with default in API
        # so update this driver's homed position using current coordinates
        new = {
            ax: self.position[ax]
            for ax in self.homed_position.keys()
            if ax in axis
        }
        self._homed_position.update(new)
        log.info(f'Homed position after {new}')

        return self.position

    async def fast_home(self, axis, safety_margin):
        ''' home after a controlled motor stall

        Given a known distance we have just stalled along an axis, move
        that distance away from the homing switch. Then finish with home.
        '''
        # move some mm distance away from the target axes endstop switch(es)
        destination = {
            ax: self.homed_position.get(ax) - abs(safety_margin)
            for ax in axis.upper()
        }

        # there is a chance the axis will hit it's home switch too soon
        # if this happens, catch the error and continue with homing afterwards
        try:
            await self.move(destination)
        except SmoothieError:
            pass

        # then home once we're closer to the endstop(s)
        disabled = ''.join([ax for ax in AXES if ax not in axis.upper()])
        return await self.home(axis=axis, disabled=disabled)

    async def unstick_axes(self, axes, distance=None, speed=None):
        '''
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
        '''
        for ax in axes:
            if ax not in AXES:
                raise ValueError('Unknown axes: {}'.format(axes))

        if distance is None:
            distance = UNSTICK_DISTANCE
        if speed is None:
            speed = UNSTICK_SPEED

        self.push_active_current()
        self.set_active_current({
            ax: self._config.high_current[ax]
            for ax in axes
            })
        self.push_axis_max_speed()
        await self.set_axis_max_speed({ax: speed for ax in axes})

        # only need to request switch state once
        state_of_switches = {ax: False for ax in AXES}
        if not self.simulating:
            state_of_switches = self.switch_state

        # incase axes is pressing endstop, home it slowly instead of moving
        homing_axes = ''.join([ax for ax in axes if state_of_switches[ax]])
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

    def pause(self):
        self.run_flag.clear()

    def resume(self):
        self.run_flag.set()

    async def delay(self, seconds):
        # per http://smoothieware.org/supported-g-codes:
        # In grbl mode P is float seconds to comply with gcode standards
        command = '{code}P{seconds}'.format(
            code=GCODES['DWELL'],
            seconds=seconds
        )
        log.debug("delay: {}".format(command))
        await self._send_command(command, timeout=int(seconds) + 1)

    async def probe_axis(self, axis, probing_distance) -> Dict[str, float]:
        if axis.upper() in AXES:
            self.engaged_axes[axis] = True
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            log.debug("probe_axis: {}".format(command))
            await self._send_command(
                command=command, timeout=DEFAULT_MOVEMENT_TIMEOUT)
            await self.update_position()
            return self.position
        else:
            raise RuntimeError("Cant probe axis {}".format(axis))

    async def kill(self):
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

    async def home_flagged_axes(self, axes_string):
        '''
        Given a list of axes to check, this method will home each axis if
        Smoothieware's internal flag sets it as needing to be homed
        '''
        axes_that_need_to_home = [
            axis
            for axis, already_homed in self.homed_flags.items()
            if (not already_homed) and (axis in axes_string)
        ]
        if axes_that_need_to_home:
            axes_string = ''.join(axes_that_need_to_home)
            await self.home(axes_string)

    async def _smoothie_reset(self):
        log.debug('Resetting Smoothie')
        gpio.set_low(gpio.OUTPUT_PINS['RESET'])
        gpio.set_high(gpio.OUTPUT_PINS['ISP'])
        await asyncio.sleep(0.25)
        gpio.set_high(gpio.OUTPUT_PINS['RESET'])
        await asyncio.sleep(0.25)
        await self._wait_for_ack()
        await self._reset_from_error()

    async def hard_halt(self):
        log.debug('Halting Smoothie')
        self._is_hard_halting.set()
        gpio.set_low(gpio.OUTPUT_PINS['HALT'])
        await asyncio.sleep(0.25)
        gpio.set_high(gpio.OUTPUT_PINS['HALT'])
        await asyncio.sleep(0.25)


async def update_firmware(filename: str,
                          port: str,
                          serial_speed: int,
                          loop: asyncio.AbstractEventLoop = None) -> str:
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

    # run lpc21isp, THIS WILL TAKE AROUND 1 MINUTE TO COMPLETE
    update_cmd = 'lpc21isp -wipe -donotstart {0} {1} {2} 12000'.format(
        filename, port, serial_speed)
    kwargs: Dict[str, Any] = {
        'stdout': asyncio.subprocess.PIPE,
        'stderr': asyncio.subprocess.PIPE}
    if loop:
        kwargs['loop'] = loop
    log.info(update_cmd)
    proc = await asyncio.create_subprocess_shell(
        update_cmd, **kwargs)
    out_b, err_b = await proc.communicate()
    if proc.returncode != 0:
        log.error(
            f"Smoothie update failed: {proc.returncode} {out_b} {err_b}")
        raise RuntimeError(
            f"Failed to program smoothie: {proc.returncode}: {err_b}")
    else:
        log.info("Smoothie update complete")

    return out_b.decode().strip()
