from opentrons.util import pose_functions as pose_funcs
from opentrons.trackers.move_msgs import new_pos_msg
from opentrons.broker import publish, topics
from opentrons import robot
from opentrons.trackers import pose_tracker

from numpy.linalg import inv
from numpy import dot, subtract

# TODO(artyom 20171026): move to config
RIGHT_MOUNT_OFFSET = (0.0, 0.0, 0.0)
LEFT_MOUNT_OFFSET = (-37.14, 32.12, -2.5)


LEFT_INSTRUMENT_ACTUATOR = 'b'
RIGHT_INSTRUMENT_ACTUATOR = 'c'

LEFT_Z_AXIS = 'z'
RIGHT_Z_AXIS = 'a'


def _coords_for_axes(driver, axes):
    return {axis: driver.position[axis.upper()] for axis in axes}


class InstrumentActuator(object):
    """
    Provides access to Robot's head motor.
    """
    def __init__(self, driver, axis, instrument):
        self.axis = axis
        self.driver = driver
        self.instrument = instrument

    def move(self, value):
        ''' Move motor '''
        self.driver.move(**{self.axis: value})

    def home(self):
        ''' Home plunger motor '''
        self.driver.home(self.axis)

    # TODO: Should instruments be able to delay overall system operation?
    def delay(self, seconds):
        self.driver.delay(seconds)

    # FIXME: Should instruments be able to set speed for overall system motion?
    def set_speed(self, rate):
        ''' Set combined motion speed '''
        self.driver.set_speed(rate)


class InstrumentMover(object):
    """
    Dispatches instrument movement calls to the appropriate movers
    """
    def __init__(self, gantry, mount, instrument):
        self.gantry = gantry
        self.mount = mount
        self.instrument = instrument

    def jog(self, pose, axis, distance):
        axis = axis.lower()
        current = pose_tracker.absolute(pose, self.instrument)
        current = dict(zip('xyz', current))
        return self.move(pose, **{axis: current[axis] + distance})

    def move(self, pose, x=None, y=None, z=None):
        # TODO(artyom 20171020): this is needed to have up to date
        # values in pose tree should find a more graceful way to do it
        pose = self.gantry._update_pose(pose)
        pose = self.mount._update_pose(pose)

        current = pose_tracker.absolute(pose, self.instrument)

        dx, dy, dz = [
            0 if destination is None else destination - current
            for destination, current
            in zip((x, y, z), current)
        ]

        gantry_x, gantry_y, _ = pose_tracker.absolute(pose, self.gantry)
        _, _, mount_z = pose_tracker.absolute(pose, self.mount)

        pose = self.gantry.move(pose, x=gantry_x + dx, y=gantry_y + dy)
        return self.mount.move(pose, z=mount_z + dz)

    def probe(self, axis_to_probe, probing_movement):
        if axis_to_probe is 'z':
            axis_to_probe = self.mount.mount_axis
        return self.gantry.probe_axis(axis_to_probe, probing_movement)

    def home(self, pose):
        return self.mount.home(pose)


class Gantry:
    '''
    Responsible for:
        - Gantry, independent of the instruments
        - Providing driver resources to instruments

    Not Response for:
        - Robot state, or any instrument specific actions
    '''
    free_axes = 'XY'

    def __init__(self, driver):
        self.left_mount = None
        self.driver = driver

    def _setup_mounts(self, pose):
        self.left_mount = Mount(self.driver, self, LEFT_Z_AXIS, LEFT_INSTRUMENT_ACTUATOR, LEFT_MOUNT_OFFSET)
        self.right_mount = Mount(self.driver, self, RIGHT_Z_AXIS, RIGHT_INSTRUMENT_ACTUATOR, RIGHT_MOUNT_OFFSET)

        pose = pose_tracker.add(
            pose,
            self.left_mount,
            self
        )

        return pose_tracker.add(
            pose,
            self.right_mount,
            self
        )

    def move(self, pose, x, y):
        ''' Moves the Gantry in the x, y plane '''
        self.driver.move(x=x, y=y)
        return self._update_pose(pose)

    def _update_pose(self, pose):
        _, _, z = pose_tracker.get(pose, self)
        coordinates = _coords_for_axes(self.driver, self.free_axes)
        return pose_tracker.update(
            pose,
            self,
            pose_tracker.Point(
                coordinates['X'],
                coordinates['Y'],
                z
            )
        )

    def mount_instrument(self, pose, instrument, instrument_mount):
        mount_config = {
            'left': (self.left_mount, pose_tracker.Point(*LEFT_MOUNT_OFFSET)),
            'right': (self.right_mount, pose_tracker.Point(*RIGHT_MOUNT_OFFSET))  # NOQA
        }

        mount, offset = mount_config[instrument_mount]
        mount.add_instrument(instrument)

        return pose_tracker.add(pose, instrument, mount, offset)

    def probe_axis(self, axis, probing_movement):
        return self.driver.probe_axis(axis, probing_movement)

    def home(self, pose):
        self.driver.home()
        return self._update_pose(pose)


class Mount:
    def __init__(self, driver, gantry, mount_axis, actuator_axis, offset):
        self.instrument = None
        self.driver = driver
        self.gantry = gantry
        self.mount_axis = mount_axis
        self.actuator_axis = actuator_axis
        self.offset = offset

    def _update_pose(self, pose):
        x, y, _ = pose_tracker.get(pose, self)
        mount_z, = _coords_for_axes(self.driver, self.mount_axis).values()
        return pose_tracker.update(pose, self, pose_tracker.Point(x, y, mount_z))

    def move(self, pose, z):
        self.driver.move(**{self.mount_axis: z})
        return self._update_pose(pose)

    def add_instrument(self, instrument):
        if self.instrument is not None:
            raise RuntimeError("This mount already has an instrument: {}".format(self.instrument))

        self.instrument = instrument
        instrument.instrument_actuator = InstrumentActuator(self.driver, self.actuator_axis, instrument)
        instrument.instrument_mover = InstrumentMover(self.gantry, self, instrument)
        instrument.axis = self.mount_axis
        instrument.mount_obj = self

    def home(self, pose):
        self.driver.home(self.mount_axis)
        return self._update_pose(pose)
