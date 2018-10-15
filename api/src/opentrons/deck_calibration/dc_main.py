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
from opentrons import robot, instruments
from opentrons.config import robot_configs
from opentrons.util.calibration_functions import probe_instrument
from opentrons.util.linal import solve, add_z, apply_transform
from opentrons.deck_calibration import *

# TODO: add tests for methods, split out current point behavior per comment
# TODO:   below, and total result on robot against prior version of this app

# logging.basicConfig(level=logging.DEBUG, filename="/data/calibration.log")
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
            loop = urwid.main_loop.AsyncioEventLoop(
                loop=asyncio.get_event_loop())
        controls = '\n'.join([
            'arrow keys: move the gantry',
            'q/a:        move the pipette up/down',
            '=/-:        increase/decrease the distance moved on each step',
            '1/2/3:      go to calibration point 1/2/3',
            'enter:      confirm current calibration point position',
            'space:      save data (after confirming all 3 points)',
            'p:          perform tip probe (after saving calibration data)',
            'esc:        exit calibration tool'
        ])
        self._tip_text_box = urwid.Text(controls)
        self._status_text_box = urwid.Text('')
        self._pile = urwid.Pile([self._tip_text_box, self._status_text_box])
        self._filler = urwid.Filler(self._pile, 'top')

        self.ui_loop = urwid.MainLoop(
            self._filler,
            handle_mouse=False,
            unhandled_input=self._on_key_press,
            event_loop=loop
        )

        # Other state
        self._tip_length = tip_length
        self.current_position = (0, 0, 0)
        self._steps = [0.1, 0.25, 0.5, 1, 5, 10, 20, 40, 80]
        self._steps_index = 2
        self._current_pipette = right
        self._current_point = 1
        self._calibration_matrix = robot.config.gantry_calibration

        self._expected_points = {
            key: (vX, vY, tip_length)
            for key, (vX, vY) in point_set.items()}
        self._actual_points = {
            1: (0, 0),
            2: (0, 0),
            3: (0, 0)}
        self._test_points = {
            'slot5': (132.50, 90.50, self._tip_length),
            'corner3': (332.13, 47.41, self._tip_length),
            'corner8': (190.65, 227.57, self._tip_length),
            'corner9': (330.14, 222.78, self._tip_length)}

        self.key_map = {
            '-': lambda: self.decrease_step(),
            '=': lambda: self.increase_step(),
            'z': lambda: self.save_z_value(),
            'p': lambda: probe(self._tip_length),
            'enter': lambda: self.save_point(),
            '\\': lambda: self.home(),
            ' ': lambda: self.save_transform(),
            'esc': lambda: self.exit(),
            'q': lambda: self._jog(
                self._current_pipette, +1, self.current_step()),
            'a': lambda: self._jog(
                self._current_pipette, -1, self.current_step()),
            'up': lambda: self._jog('Y', +1, self.current_step()),
            'down': lambda: self._jog('Y', -1, self.current_step()),
            'left': lambda: self._jog('X', -1, self.current_step()),
            'right': lambda: self._jog('X', +1, self.current_step()),
            'm': lambda: self.validate_mount_offset(),
            '1': lambda: self.validate(self._expected_points[1], 1, right),
            '2': lambda: self.validate(self._expected_points[2], 2, right),
            '3': lambda: self.validate(self._expected_points[3], 3, right),
            '4': lambda: self.validate(self._test_points['slot5'], 4, right),
            '5': lambda: self.validate(self._test_points['corner3'], 5, right),
            '6': lambda: self.validate(self._test_points['corner8'], 6, right),
            '7': lambda: self.validate(self._test_points['corner9'], 7, right)
        }

    def current_step(self):
        return self._steps[self._steps_index]

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
        x, y, z, _ = dot(robot.config.gantry_calibration, point)
        return (x, y, z)

    def _driver_to_deck_coords(self, point):
        # TODO (ben 20180201): create a function in linal module so we don't
        # TODO                 have to do dot product & etc here
        point = array(list(point) + [1])
        x, y, z, _ = dot(inv(robot.config.gantry_calibration), point)
        return (x, y, z)

    def _position(self):
        """
        Read position from driver into a tuple and map 3-rd value
        to the axis of a pipette currently used
        """

        res = position(self._current_pipette)

        return res

    def _jog(self, axis, direction, step):
        """
        Move the pipette on `axis` in `direction` by `step` and update the
        position tracker
        """
        jog(axis, direction, step)
        self.current_position = self._position()
        return 'Jog: {}'.format([axis, str(direction), str(step)])

    def home(self) -> str:
        """
        Return the robot to the home position and update the position tracker
        """
        robot.home()
        self.current_position = self._position()
        return 'Homed'

    def save_point(self) -> str:
        """
        Indexes the measured data with the current point as a key and saves the
        current position once the 'Enter' key is pressed to the 'actual points'
        vector.
        """
        if self._current_pipette is left:
            msg = self.save_mount_offset()
        else:
            pos = self._position()[:-1]
            self._actual_points[self._current_point] = pos
            log.debug("Saving {} for point {}".format(
                pos, self._current_point))
            msg = 'saved #{}: {}'.format(
                self._current_point, self._actual_points[self._current_point])
        return msg

    def save_mount_offset(self) -> str:
        pos = self._position()
        log.debug("save_mount_offset position: {}".format(pos))
        cx, cy, cz = self._driver_to_deck_coords(pos)
        log.debug("save_mount_offset cxyz: {}".format((cx, cy, cz)))
        ex, ey, ez = apply_mount_offset(self._expected_points[1])
        log.debug("save_mount_offset exyz: {}".format((ex, ey, ez)))
        dx, dy, dz = (cx - ex, cy - ey, cz - ez)
        log.debug("save_mount_offset dxyz: {}".format((dx, dy, dz)))
        mx, my, mz = robot.config.mount_offset
        log.debug("save_mount_offset mxyz: {}".format((mx, my, mz)))
        offset = (mx - dx, my - dy, mz - dz)
        log.debug("save_mount_offset mount offset: {}".format(offset))
        robot.config = robot.config._replace(
            mount_offset=offset)
        msg = 'saved mount-offset: {}'.format(
            robot.config.mount_offset)
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
        actual = [self._actual_points[p][:2] for p in [1, 2, 3]]
        log.debug("save_transform actual: {}".format(actual))
        # Generate a 2 dimensional transform matrix from the two matricies
        flat_matrix = solve(expected, actual)
        log.debug("save_transform flat_matrix: {}".format(flat_matrix))
        current_z = self._calibration_matrix[2][3]
        # Add the z component to form the 3 dimensional transform
        self._calibration_matrix = add_z(flat_matrix, current_z)
        gantry_calibration = list(
                map(lambda i: list(i), self._calibration_matrix))
        log.debug("save_transform calibration_matrix: {}".format(
            gantry_calibration))

        robot.config = robot.config._replace(
            gantry_calibration=gantry_calibration)
        res = str(robot.config)

        return '{}\n{}'.format(res, save_config())

    def save_z_value(self) -> str:
        actual_z = self._position()[-1]
        expected_z = self._calibration_matrix[2][3] + self._tip_length
        new_z = self._calibration_matrix[2][3] + actual_z - expected_z
        log.debug("Saving z value: {}".format(new_z))
        self._calibration_matrix[2][3] = new_z
        return 'saved Z-Offset: {}'.format(new_z)

    def _left_mount_offset(self):
        lx, ly, lz = self._expected_points[1]
        mx, my, mz = robot.config.mount_offset
        return (lx - mx, ly - my, lz - mz)

    def validate_mount_offset(self):
        # move the RIGHT pipette to expected point, then immediately after
        # move the LEFT pipette to that same point
        self.validate(self._expected_points[1], 1, right)
        self.validate(apply_mount_offset(self._expected_points[1]), 0, left)

    def validate(
            self,
            point: Tuple[float, float, float],
            point_num: int,
            pipette: str) -> str:
        """
        :param point: Expected values from mechanical drawings
        :param point_num: The current position attempting to be validated
        :param pipette: 'Z' for left mount or 'A' for right mount

        :return:
        """
        _, _, cz = self._driver_to_deck_coords(self._position())
        if self._current_pipette != pipette and cz < SAFE_HEIGHT:
            self.move_to_safe_height()

        self._current_pipette = pipette
        self._current_point = point_num

        _, _, cz = self._driver_to_deck_coords(self._position())
        if cz < SAFE_HEIGHT:
            self.move_to_safe_height()

        tx, ty, tz = self._deck_to_driver_coords(point)
        robot._driver.move({'X': tx, 'Y': ty})
        robot._driver.move({self._current_pipette: tz})

        return 'moved to point {}'.format(point)

    def move_to_safe_height(self):
        cx, cy, _ = self._driver_to_deck_coords(self._position())
        _, _, sz = self._deck_to_driver_coords((cx, cy, SAFE_HEIGHT))
        robot._driver.move({self._current_pipette: sz})

    def exit(self):
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
        actual = [self._actual_points[p] for p in [1, 2, 3]]
        points = '\n'.join([
            # Highlight point being calibrated
            # Display actual and expected coordinates
            ('* ' if self._current_point == point else '') + "{0} {1}".format(
                coord[0], coord[1])
            for point, coord in enumerate(zip(actual, expected))
        ])

        text = '\n'.join([
            points,
            # 'Smoothie: {}'.format(self.current_position),
            'World: {}'.format(apply_transform(
                inv(self._calibration_matrix), self.current_position)),
            'Step: {}'.format(self.current_step()),
            'Message: {}'.format(msg)
        ])

        self._status_text_box.set_text(text)


# Functions for backing key-press
def probe(tip_length: float) -> str:
    robot.reset()

    pipette = instruments.Pipette(
        mount='right', channels=1, max_volume=1000, ul_per_mm=1000)
    probe_center = tuple(probe_instrument(
        pipette, robot, tip_length=tip_length))
    log.debug("Setting probe center to {}".format(probe_center))
    robot.config = robot.config._replace(
        probe_center=probe_center
    )
    return 'Tip probe'


def save_config() -> str:
    try:
        robot_configs.save_robot_settings(robot.config)
        robot_configs.save_deck_calibration(robot.config)
        result = robot_configs.load()
    except Exception as e:
        result = repr(e)
    return result


def clear_configuration_and_reload():
    robot_configs.clear()
    robot.config = robot_configs.load()
    robot.reset()


def backup_configuration(tag):
    robot_configs.backup_configuration(robot.config, tag)


def backup_configuration_and_reload(tag=None):
    backup_configuration(tag)
    clear_configuration_and_reload()


def get_calibration_points():

    expected_loc = cli_dots_set()
    return {
        1: expected_loc[0],
        2: expected_loc[1],
        3: expected_loc[2]
    }


def main():
    """
    A CLI application for performing factory calibration of an Opentrons robot

    Instructions:
        - Robot must be set up with a 300ul single-channel pipette installed on
          the right-hand mount.
        - Put a GEB 300ul tip onto the pipette.
        - Use the arrow keys to jog the robot over an open area of the deck
          (the base deck surface, not over a ridge or numeral engraving). You
          can use the '-' and '=' keys to decrease or increase the amount of
          distance moved with each jog action.
        - Use the 'q' and 'a' keys to jog the pipette up and down respectively
          until the tip is just touching the deck surface, then press 'z'.
        - Press '1' to automatically go to the expected location of the first
          calibration point. Jog the robot until the tip is actually at
          the point, then press 'enter'.
        - Repeat with '2' and '3'.
        - After calibrating all three points, press the space bar to save the
          configuration.
        - Optionally, press 4,5,6 or 7 to validate the new configuration.
        - Press 'p' to perform tip probe.
        - Press 'esc' to exit the program.
    """
    prompt = input(
        ">>> Warning! Running this tool backup and clear any previous "
        "calibration data. Proceed (y/[n])? ")
    if prompt not in ['y', 'Y', 'yes']:
        print('Exiting--prior configuration data not changed')
        sys.exit()
    backup_configuration_and_reload()

    robot.connect()
    robot.home()

    # lights help the script user to see the points on the deck
    robot.turn_on_rail_lights()
    atexit.register(robot.turn_off_rail_lights)

    # Notes:
    #  - 200ul tip is 51.7mm long when attached to a pipette
    #  - For xyz coordinates, (0, 0, 0) is the lower-left corner of the robot
    cli = CLITool(
        point_set=get_calibration_points(),
        tip_length=51.7)
    cli.ui_loop.run()

    print('Robot config: \n', robot.config)


def notify_and_restart():
    print('Exiting configuration tool and restarting system')
    backup_configuration(tag=None)
    os.system("kill 1")


if __name__ == "__main__":
    # Register hook to reboot the robot after exiting this tool (regardless of
    # whether this process exits normally or not)
    atexit.register(notify_and_restart)

    main()
