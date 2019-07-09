#!/usr/bin/env python

# pylama:ignore=C901,W0401

import asyncio
import urwid
import atexit
import os
import sys
import logging
from typing import Tuple
from numpy.linalg import inv
from numpy import dot, array
import opentrons
from opentrons import robot, instruments, types
from opentrons.hardware_control import adapters
from opentrons.hardware_control.types import CriticalPoint
from opentrons.config import (robot_configs, feature_flags,
                              SystemArchitecture, ARCHITECTURE)
from opentrons.util.calibration_functions import probe_instrument
from opentrons.util.linal import (solve, add_z, apply_transform,
                                  identity_deck_transform)
from . import (
    left, right, SAFE_HEIGHT, cli_dots_set,
    position, jog, apply_mount_offset)

# TODO: add tests for methods, split out current point behavior per comment
# TODO:   below, and total result on robot against prior version of this app

log = logging.getLogger(__name__)


class CLITool:
    """
    Dev notes:
        This is still done in very OO-style. Instead of using global variables
        for state, this is captured with members of this class, and methods
        on the class capture the ways of modifying that state. The main entry-
        point for the URWID-based app is the `_on_key_press` method, which
        dispatches via the `key_map` dictionary.

        Each value in the `key_map` is a lambda that performs whatever action
        is required for the key press, and then returns a string that can be
        used to update the text box accordingly. Most or all of these lambdas
        call methods on this class, which in turn utilize members of the class
        in a side-effecting manner.

        In a further refactor, this will make it easier to extract the methods
        into functions that take all needed input as parameters, and return
        a tuple with a status string and any results of computation. This
        class can then catch the return values and keep track of state. The
        behavior of this class will be the same in that case, but those
        extracted functions could also be used to support and alternate app,
        such as a web-server that would be able to call those functions behind
        HTTP endpoints.
    """
    def __init__(self, point_set, tip_length, loop=None):
        # URWID user interface objects
        if not loop:
            loop = asyncio.get_event_loop()
        loop = urwid.main_loop.AsyncioEventLoop(
            loop=loop)

        controls = '\n'.join([
            'arrow keys: move the gantry',
            'q/a:        move the pipette up/down',
            '=/-:        increase/decrease the distance moved on each step',
            '1/2/3:      go to calibration point 1/2/3',
            'enter:      confirm current calibration point position',
            'space:      save data (after confirming all 3 points)',
            'p:          perform tip probe (after saving calibration data)',
            'esc:        exit calibration tool',
            '?:          Full Instructions'
        ])
        self._tip_text_box = urwid.Text(controls)
        self._status_text_box = urwid.Text('')
        self._pile = urwid.Pile([self._tip_text_box, self._status_text_box])
        self._filler = urwid.Filler(self._pile, 'top')

        if not feature_flags.use_protocol_api_v2():
            self.hardware = robot
            self._current_mount = right
        else:
            api = opentrons.hardware_control.API
            self.hardware = adapters.SynchronousAdapter.build(
                api.build_hardware_controller, force=True)
            self._current_mount = types.Mount.RIGHT
            self.hardware.cache_instruments()

        self.ui_loop = urwid.MainLoop(
            self._filler,
            handle_mouse=False,
            unhandled_input=self._on_key_press,
            event_loop=loop
        )

        self._asyncio_loop = loop

        self.current_transform = identity_deck_transform()

        # Other state
        self._tip_length = tip_length
        if feature_flags.use_protocol_api_v2():
            self.hardware.add_tip(types.Mount.RIGHT, self._tip_length)
            if self.hardware.attached_instruments[types.Mount.LEFT]:
                self.hardware.add_tip(types.Mount.LEFT, self._tip_length)
        self.current_position = (0, 0, 0)
        self._steps = [0.1, 0.25, 0.5, 1, 5, 10, 20, 40, 80]
        self._steps_index = 2
        self._current_point = 1

        if feature_flags.use_protocol_api_v2():
            deck_height = 0
        else:
            deck_height = self._tip_length

        self._expected_points = {
            key: (vX, vY, deck_height)
            for key, (vX, vY) in point_set.items()}
        self.actual_points = {
            1: (0, 0),
            2: (0, 0),
            3: (0, 0)}

        self._test_points = {
            'slot5': (132.50, 90.50, deck_height),
            'corner3': (332.13, 47.41, deck_height),
            'corner8': (190.65, 227.57, deck_height),
            'corner9': (330.14, 222.78, deck_height)}

        slot5 = self._test_points['slot5']

        self.key_map = {
            '-': lambda: self.decrease_step(),
            '=': lambda: self.increase_step(),
            'z': lambda: self.save_z_value(),
            'p': lambda: self.probe(
                self._tip_length, self.hardware, self._current_mount, slot5),
            'enter': lambda: self.save_point(),
            '\\': lambda: self.home(),
            ' ': lambda: self.save_transform(),
            'esc': lambda: self.exit(),
            'q': lambda: self._jog(
                self._current_mount, +1, self.current_step()),
            'a': lambda: self._jog(
                self._current_mount, -1, self.current_step()),
            'up': lambda: self._jog('Y', +1, self.current_step()),
            'down': lambda: self._jog('Y', -1, self.current_step()),
            'left': lambda: self._jog('X', -1, self.current_step()),
            'right': lambda: self._jog('X', +1, self.current_step()),
            'm': lambda: self.validate_mount_offset(),
            '1': lambda: self.validate(
                self._expected_points[1], 1, self._current_mount),
            '2': lambda: self.validate(
                self._expected_points[2], 2, self._current_mount),
            '3': lambda: self.validate(
                self._expected_points[3], 3, self._current_mount),
            '4': lambda: self.validate(
                self._test_points['slot5'], 4, self._current_mount),
            '5': lambda: self.validate(
                self._test_points['corner3'], 5, self._current_mount),
            '6': lambda: self.validate(
                self._test_points['corner8'], 6, self._current_mount),
            '7': lambda: self.validate(
                self._test_points['corner9'], 7, self._current_mount),
            '?': lambda: self.print_instructions(),
        }

    @property
    def hardware(self):
        return self._hardware

    @hardware.setter
    def hardware(self, hardware):
        self._hardware = hardware
    #
    # @property
    # def calibration_matrix(self):
    #     return self._calibration_matrix
    #
    # @calibration_matrix.setter
    # def calibration_matrix(self, calibration):
    #     self._calibration_matrix = calibration

    @property
    def actual_points(self):
        return self._actual_points

    @actual_points.setter
    def actual_points(self, points):
        self._actual_points = points

    def current_step(self):
        return self._steps[self._steps_index]

    def print_instructions(self):
        return '\n'.join([
            'A CLI application for performing factory calibration',
            'of an Opentrons robot',
            'Instructions:',
            '- Robot must be set up with two 300ul or 50ul single-channel',
            'pipettes installed on the right-hand and left-hand mount.',
            '- Put a GEB 300ul tip onto the pipette.',
            '- Use the arrow keys to jog the robot over slot 5 in an',
            'open space that is not an engraving or a hole.',
            '- Use the "q" and "a" keys to jog the pipette up',
            'and down respectively until the tip is just touching',
            'the deck surface, then press "z". This',
            'will save the "Z" height.',
            '- Press "1" to the expected location of the first',
            'calibration point. Jog the robot until the tip is actually at',
            'the point, then press "enter". Repeat with "2" and "3".',
            '- After calibrating all three points, press the space bar',
            'to save the configuration.',
            'Optionally, press 4,5,6 or 7 to',
            'validate the new configuration.',
            '- Press "p" to perform tip probe.',
            'Press the space bar to save again.',
            '- Press "m" to perform mount calibration.',
            'Press enter and then space bar to save again.',
            '- Use backslash to home both pipettes and',
            'optionally press 4,5,6,7 again.',
            '- Press "esc" to exit the program.'])

    # Methods for backing key-press
    def increase_step(self) -> str:
        """
        Increase the jog resolution without overrunning the list of values
        """
        if self._steps_index < len(self._steps) - 1:
            self._steps_index = self._steps_index + 1
        return 'step: {}'.format(self.current_step())

    def decrease_step(self) -> str:
        """
        Decrease the jog resolution without overrunning the list of values
        """
        if self._steps_index > 0:
            self._steps_index = self._steps_index - 1
        return 'step: {}'.format(self.current_step())

    def _deck_to_driver_coords(self, point):
        # TODO (ben 20180201): create a function in linal module so we don't
        # TODO                 have to do dot product & etc here
        point = array(list(point) + [1])
        x, y, z, _ = dot(self.current_transform, point)
        return (x, y, z)

    def _driver_to_deck_coords(self, point):
        # TODO (ben 20180201): create a function in linal module so we don't
        # TODO                 have to do dot product & etc here
        point = array(list(point) + [1])
        x, y, z, _ = dot(inv(self.current_transform), point)
        return (x, y, z)

    def _position(self):
        """
        Read position from driver into a tuple and map 3-rd value
        to the axis of a pipette currently used. Always returns deck
        coordinates
        """
        if not feature_flags.use_protocol_api_v2():
            res = self._driver_to_deck_coords(
                position(self._current_mount, self.hardware))
        else:
            res = position(
                self._current_mount, self.hardware, CriticalPoint.TIP)
        return res

    def _jog(self, axis, direction, step):
        """
        Move the pipette on `axis` in `direction` by `step` and update the
        position tracker
        """
        jog(axis, direction, step, self.hardware, self._current_mount)

        self.current_position = self._position()
        return 'Jog: {}'.format([axis, str(direction), str(step)])

    def home(self) -> str:
        """
        Return the robot to the home position and update the position tracker
        """
        self.hardware.home()
        self.current_position = self._position()
        return 'Homed'

    def save_point(self) -> str:
        """
        Indexes the measured data with the current point as a key and saves the
        current position once the 'Enter' key is pressed to the 'actual points'
        vector.
        """
        if self._current_mount is left:
            msg = self.save_mount_offset()
            self._current_mount = right
        elif self._current_mount is types.Mount.LEFT:
            msg = self.save_mount_offset()
            self._current_mount = types.Mount.RIGHT
        else:
            pos = self._position()[:-1]
            self.actual_points[self._current_point] = pos
            log.debug("Saving {} for point {}".format(
                pos, self._current_point))
            msg = 'saved #{}: {}'.format(
                self._current_point, self.actual_points[self._current_point])
        return msg

    def save_mount_offset(self) -> str:
        cx, cy, cz = self._position()
        log.debug("save_mount_offset cxyz: {}".format((cx, cy, cz)))

        if not feature_flags.use_protocol_api_v2():
            ex, ey, ez = apply_mount_offset(
                self._expected_points[1], self.hardware)
            log.debug("save_mount_offset exyz: {}".format((ex, ey, ez)))
            dx, dy, dz = (cx - ex, cy - ey, cz - ez)
        else:
            ex, ey, ez = self._expected_points[1]
            dx, dy, dz = (cx - ex, cy - ey, cz - ez)
        log.debug("save_mount_offset dxyz: {}".format((dx, dy, dz)))

        mx, my, mz = self.hardware.config.mount_offset
        log.debug("save_mount_offset mxyz: {}".format((mx, my, mz)))
        offset = (mx - dx, my - dy, mz - dz)
        log.debug("save_mount_offset mount offset: {}".format(offset))
        self.hardware.update_config(mount_offset=offset)
        msg = 'saved mount-offset: {}'.format(
            self.hardware.config.mount_offset)
        return msg

    def save_transform(self) -> str:
        """
        Actual is measured data
        Expected is based on mechanical drawings of the robot

        This method computes the transformation matrix from actual -> expected.
        Saves this transform to disc.
        """
        expected = [self._expected_points[p][:2] for p in [1, 2, 3]]
        log.debug("save_transform expected: {}".format(expected))
        actual = [self.actual_points[p][:2] for p in [1, 2, 3]]
        log.debug("save_transform actual: {}".format(actual))
        # Generate a 2 dimensional transform matrix from the two matricies
        flat_matrix = solve(expected, actual)
        log.debug("save_transform flat_matrix: {}".format(flat_matrix))
        current_z = self.current_transform[2][3]
        # Add the z component to form the 3 dimensional transform
        self.current_transform = add_z(flat_matrix, current_z)

        gantry_calibration = list(
                map(lambda i: list(i), self.current_transform))
        log.debug("save_transform calibration_matrix: {}".format(
            gantry_calibration))

        self.hardware.update_config(
            gantry_calibration=gantry_calibration)
        res = str(self.hardware.config)

        return '{}\n{}'.format(
            res,
            save_config(self.hardware.config))

    def save_z_value(self) -> str:
        actual_z = self._position()[-1]
        if not feature_flags.use_protocol_api_v2():
            expected_z = self.current_transform[2][3] + self._tip_length
            new_z = self.current_transform[2][3] + actual_z - expected_z
        else:
            new_z = self.current_transform[2][3] + actual_z
        log.debug("Saving z value: {}".format(new_z))
        self.current_transform[2][3] = new_z
        return 'saved Z-Offset: {}'.format(new_z)

    def _left_mount_offset(self):
        lx, ly, lz = self._expected_points[1]
        mx, my, mz = self.hardware.config.mount_offset
        return (lx - mx, ly - my, lz - mz)

    def validate_mount_offset(self):
        # move the RIGHT pipette to expected point, then immediately after
        # move the LEFT pipette to that same point
        if not feature_flags.use_protocol_api_v2():
            r_pipette = right
            l_pipette = left
            targ = apply_mount_offset(self._expected_points[1], self.hardware)
        else:
            r_pipette = types.Mount.RIGHT
            l_pipette = types.Mount.LEFT
            targ = self._expected_points[1]
        self.validate(self._expected_points[1], 1, r_pipette)

        self.validate(targ, 0, l_pipette)

    def validate(
            self,
            point: Tuple[float, float, float],
            point_num: int,
            pipette_mount) -> str:
        """
        :param point: Expected values from mechanical drawings
        :param point_num: The current position attempting to be validated
        :param pipette: 'Z' for left mount or 'A' for right mount

        :return:
        """
        self._current_point = point_num
        if not feature_flags.use_protocol_api_v2():
            _, _, cz = self._position()
            if self._current_mount != pipette_mount and cz < SAFE_HEIGHT:
                self.move_to_safe_height()

            self._current_mount = pipette_mount

            _, _, cz = self._position()
            if cz < SAFE_HEIGHT:
                self.move_to_safe_height()
            tx, ty, tz = self._deck_to_driver_coords(point)
            self.hardware._driver.move({'X': tx, 'Y': ty})
            self.hardware._driver.move({self._current_mount: tz})
        else:
            self._current_mount = pipette_mount
            self.move_to_safe_height()
            pt1 = types.Point(x=point[0], y=point[1], z=SAFE_HEIGHT)
            pt2 = types.Point(*point)
            self.hardware.move_to(self._current_mount, pt1)
            self.hardware.move_to(self._current_mount, pt2)
        return 'moved to point {}'.format(point)

    def move_to_safe_height(self):
        cx, cy, _ = self._position()
        if not feature_flags.use_protocol_api_v2():
            _, _, sz = self._deck_to_driver_coords((cx, cy, SAFE_HEIGHT))
            self.hardware._driver.move({self._current_mount: sz})
        else:
            pt = types.Point(x=cx, y=cy, z=SAFE_HEIGHT)
            self.hardware.move_to(self._current_mount, pt)

    def exit(self):
        if feature_flags.use_protocol_api_v2():
            self.hardware.remove_tip(self._current_mount)
        raise urwid.ExitMainLoop

    # Private methods for URWID
    def _on_key_press(self, key: str):
        try:
            result = self.key_map[key]()
        except KeyError:
            result = 'invalid input: {}'.format(key)
        self._update_text_box(result)

    def _update_text_box(self, msg):
        expected = [self._expected_points[p] for p in [1, 2, 3]]
        actual = [self.actual_points[p] for p in [1, 2, 3]]
        points = '\n'.join([
            # Highlight point being calibrated
            # Display actual and expected coordinates
            ('* ' if self._current_point == point else '') + "{0} {1}".format(
                coord[0], coord[1])
            for point, coord in enumerate(zip(actual, expected))
        ])

        text = '\n'.join([
            points,
            'World: {}'.format(apply_transform(
                inv(self.current_transform), self.current_position)),
            'Step: {}'.format(self.current_step()),
            'Message: {}'.format(msg)
        ])

        self._status_text_box.set_text(text)

    # Functions for backing key-press
    def probe(self, tip_length: float, hardware, mount, move_after) -> str:

        if not feature_flags.use_protocol_api_v2():
            hardware.reset()
            pipette = instruments.P300_Single(mount='right')   # type: ignore
            probe_center = tuple(probe_instrument(
                pipette, robot, tip_length=tip_length))
            log.debug("Setting probe center to {}".format(probe_center))
        else:
            probe_center = hardware.locate_tip_probe_center(mount, tip_length)
            _, _, cz = position(mount, hardware, CriticalPoint.TIP)
            # work around to prevent pipette tip crashing into tip box
            # when moving from tip box -> other point on the deck
            pt = types.Point(x=move_after[0], y=move_after[1], z=cz)
            hardware.move_to(mount, pt)

        hardware.update_config(
            tip_probe=hardware.config.tip_probe._replace(center=probe_center))
        return 'Tip probe'


def save_config(config) -> str:
    try:
        robot_configs.save_robot_settings(config)
        robot_configs.save_deck_calibration(config)
        result = robot_configs.load()
    except Exception as e:
        result = repr(e)
    return result


def clear_configuration_and_reload(hardware):
    robot_configs.clear()
    new_config = robot_configs.load()
    hardware.set_config(new_config)
    if not feature_flags.use_protocol_api_v2():
        hardware.reset()


def backup_configuration(hardware, tag):
    robot_configs.backup_configuration(hardware.config, tag)


def backup_configuration_and_reload(hardware, tag=None):
    backup_configuration(hardware, tag)
    clear_configuration_and_reload(hardware)


def get_calibration_points():

    expected_loc = cli_dots_set()
    return {
        1: expected_loc[0],
        2: expected_loc[1],
        3: expected_loc[2]
    }


def main(loop=None):
    """
    A CLI application for performing factory calibration of an Opentrons robot

    Instructions:
        - Robot must be set up with two 300ul or 50ul single-channel pipettes
          installed on the right-hand and left-hand mount.
        - Put a GEB 300ul tip onto the pipette.
        - Use the arrow keys to jog the robot over slot 5 in an open space that
          is not an engraving or a hole.
        - Use the 'q' and 'a' keys to jog the pipette up and down respectively
          until the tip is just touching the deck surface, then press 'z'. This
          will save the 'Z' height.
        - Press '1' to automatically go to the expected location of the first
          calibration point. Jog the robot until the tip is actually at
          the point, then press 'enter'.
        - Repeat with '2' and '3'.
        - After calibrating all three points, press the space bar to save the
          configuration.
        - Optionally, press 4,5,6 or 7 to validate the new configuration.
        - Press 'p' to perform tip probe. Press the space bar to save again.
        - Press 'm' to perform mount calibration.
          Press enter and then space bar to save again.
        - Press 'esc' to exit the program.
    """
    prompt = input(
        ">>> Warning! Running this tool backup and clear any previous "
        "calibration data. Proceed (y/[n])? ")
    if prompt not in ['y', 'Y', 'yes']:
        print('Exiting--prior configuration data not changed')
        sys.exit()
    # Notes:
    #  - 200ul tip is 51.7mm long when attached to a pipette
    #  - For xyz coordinates, (0, 0, 0) is the lower-left corner of the robot
    cli = CLITool(
        point_set=get_calibration_points(),
        tip_length=51.7,
        loop=loop)
    hardware = cli.hardware
    backup_configuration_and_reload(hardware)
    if not feature_flags.use_protocol_api_v2():
        hardware.connect()
        hardware.turn_on_rail_lights()
        atexit.register(hardware.turn_off_rail_lights)
    else:
        hardware.set_lights(rails=True)
    cli.home()
    # lights help the script user to see the points on the deck
    cli.ui_loop.run()
    if feature_flags.use_protocol_api_v2():
        hardware.set_lights(rails=False)
    try:
        print('Robot config: \n', cli.hardware.config)
    except Exception:
        pass


def notify_and_restart():
    print('Exiting configuration tool and restarting system')
    if ARCHITECTURE == SystemArchitecture.BALENA:
        os.system("kill 1")
    else:
        os.system('reboot')


if __name__ == "__main__":
    # Register hook to reboot the robot after exiting this tool (regardless of
    # whether this process exits normally or not)
    atexit.register(notify_and_restart)
    main()
