from uuid import uuid1
from typing import Dict, Tuple, Optional, NamedTuple
import logging
from enum import Enum

from opentrons.config import robot_configs, reset
from opentrons.types import Mount, Point
from opentrons.hardware_control.types import CriticalPoint
from opentrons.deck_calibration import jog, position, dots_set, z_pos
from opentrons.util.linal import add_z, solve, identity_deck_transform

mount_by_name = {'left': Mount.LEFT, 'right': Mount.RIGHT}
log = logging.getLogger(__name__)


class SessionWrapper:
    """Wrapper for single instance of SessionManager"""
    def __init__(self):
        self._session = None

    @property
    def session(self) -> Optional['SessionManager']:
        """Get access to the session manager"""
        return self._session

    @session.setter
    def session(self, s: Optional['SessionManager']):
        """Update the session manager"""
        self._session = s


session_wrapper = SessionWrapper()


class DeckCalibrationPoint(str, Enum):
    """
    The name of a point relative to deck calibration. The number points are
    calibration crosses ("1" in slot 1, "2" in slot 3, "3" in slot 7); "safeZ"
    is a safe height above the deck, "attachTip" is a good place to go for the
    user to attach a tip.
    """
    one = "1"
    two = "2"
    three = "3"
    safeZ = "safeZ"
    attachTip = "attachTip"


def expected_points():
    slot_1_lower_left,\
        slot_3_lower_right,\
        slot_7_upper_left = dots_set()

    return {
        DeckCalibrationPoint.one: slot_1_lower_left,
        DeckCalibrationPoint.two: slot_3_lower_right,
        DeckCalibrationPoint.three: slot_7_upper_left}


def safe_points() -> Dict[str, Tuple[float, float, float]]:
    # Safe points are defined as 5mm toward the center of the deck in x, y and
    # 10mm above the deck. User is expect to jog to the critical point from the
    # corresponding safe point, to avoid collision depending on direction of
    # misalignment between the deck and the gantry.
    slot_1_lower_left, \
        slot_3_lower_right, \
        slot_7_upper_left = expected_points().values()
    slot_1_safe_point = (
        slot_1_lower_left[0] + 5, slot_1_lower_left[1] + 5, 10)
    slot_3_safe_point = (
        slot_3_lower_right[0] - 5, slot_3_lower_right[1] + 5, 10)
    slot_7_safe_point = (
        slot_7_upper_left[0] + 5, slot_7_upper_left[1] - 5, 10)
    attach_tip_point = (200, 90, 130)

    return {
        DeckCalibrationPoint.one: slot_1_safe_point,
        DeckCalibrationPoint.two: slot_3_safe_point,
        DeckCalibrationPoint.three: slot_7_safe_point,
        DeckCalibrationPoint.safeZ: z_pos,
        DeckCalibrationPoint.attachTip: attach_tip_point
    }


def _get_uuid() -> str:
    return str(uuid1())


class SessionManager:
    """
    Creates a session manager to handle all commands required for factory
    calibration.
    Before issuing a movement command, the following must be done:
    1. Create a session manager
    2. Initialize a pipette
    3. Select the current pipette
    """
    def __init__(self, hardware):
        self.id = _get_uuid()
        self.pipettes = {}
        self.current_mount = None
        self.current_model = None
        self.tip_length = None
        self.points = {k: None for k in expected_points().keys()}
        self.z_value = None
        self.cp = None
        self.pipette_id = None
        self.adapter = hardware.sync
        self.current_transform = identity_deck_transform()
        self.backup_gantry_cal = self.adapter.config.gantry_calibration

        robot_configs.backup_configuration(self.adapter.config)
        # Start from fresh identity matrix every calibration session
        self.adapter.update_config(gantry_calibration=list(
                map(lambda i: list(i), self.current_transform)))


def init_pipette(session):
    """
    Finds pipettes attached to the robot currently and chooses the correct one
    to add to the session.

    :return: The pipette type and mount chosen for deck calibration
    """
    reset.reset_tip_probe()
    pipette_info = set_current_mount(session)
    pipette = pipette_info['pipette']
    res = {}
    if pipette:
        session.current_model = pipette_info['model']
        mount = pipette.get('mount')
        # ensure the current pipettes loaded have their instrument
        # offsets zeroed out.
        session.current_mount = mount_by_name[mount]
        session.adapter.update_instrument_offset(
            session.current_mount, new_offset=Point(0, 0, 0))
        session.pipettes[mount] = pipette
        res = {'mount': mount, 'model': pipette_info['model']}

    log.info("Pipette info {}".format(session.pipettes))

    return res


def get_pipettes(sess: SessionManager):
    attached_pipettes = sess.adapter.attached_instruments
    left_pipette = attached_pipettes.get(Mount.LEFT)
    right_pipette = attached_pipettes.get(Mount.RIGHT)
    log.info(f"Type of pipette {right_pipette}")
    return right_pipette, left_pipette


def set_current_mount(session: SessionManager):
    """
    Choose the pipette in which to execute commands. If there is no pipette,
    or it is uncommissioned, the pipette is not mounted.

    :attached_pipettes attached_pipettes: Information obtained from the current
    pipettes attached to the robot. This looks like the following:
    :dict with keys 'left' and 'right' and a model string for each
    mount, or 'uncommissioned' if no model string available
    :return: The selected pipette
    """

    pipette = None
    right_channel = None
    left_channel = None
    right_pipette, left_pipette = get_pipettes(session)
    if right_pipette:
        right_channel = right_pipette.get('channels')
        right_pipette['mount'] = 'right'

    if left_pipette:
        left_channel = left_pipette.get('channels')
        left_pipette['mount'] = 'left'

    if right_channel == 1:
        pipette = right_pipette
        session.cp = CriticalPoint.NOZZLE
    elif left_channel == 1:
        pipette = left_pipette
        session.cp = CriticalPoint.NOZZLE
    elif right_pipette:
        pipette = right_pipette
        session.cp = CriticalPoint.FRONT_NOZZLE
    elif left_pipette:
        pipette = left_pipette
        session.cp = CriticalPoint.FRONT_NOZZLE

    model, pip_id = _get_model_name(pipette, session.adapter)
    session.pipette_id = pip_id
    return {'pipette': pipette, 'model': model}


def _get_model_name(pipette, adapter):
    model = None
    pip_id = None
    if pipette:
        model = pipette.get('model')
        mount = Mount.LEFT if pipette['mount'] == 'left' else Mount.RIGHT
        pip_info = adapter.attached_instruments[mount]
        pip_id = pip_info['pipette_id']

    return model, pip_id


# -------------- Route Fns -----------------------------------------------
# Note: endpoints should not call these functions directly, to ensure that
# session protections are applied--should be called through the dispatch
# endpoint
# ------------------------------------------------------------------------

class CommandResult(NamedTuple):
    success: bool
    message: str


async def attach_tip(data) -> CommandResult:
    """
    Attach a tip to the current pipette

    :param data: a dict that with schema:
    {
      'tipLength': a float representing how much the length of a pipette
        increases when a tip is added
    }
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    tip_length = data.get('tipLength')

    if not tip_length:
        message = 'Error: "tipLength" must be specified in request'
        status = False
    else:
        session_wrapper.session.adapter.add_tip(
            session_wrapper.session.current_mount, tip_length)
        if session_wrapper.session.cp == CriticalPoint.NOZZLE:
            session_wrapper.session.cp = CriticalPoint.TIP
        session_wrapper.session.tip_length = tip_length

        message = "Tip length set: {}".format(tip_length)
        status = True

    return CommandResult(success=status, message=message)


async def detach_tip(data) -> CommandResult:
    """
    Detach the tip from the current pipette

    :param data: unused
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    session_wrapper.session.adapter.remove_tip(
        session_wrapper.session.current_mount)
    if session_wrapper.session.cp == CriticalPoint.TIP:
        session_wrapper.session.cp = CriticalPoint.NOZZLE
    session_wrapper.session.tip_length = None

    return CommandResult(success=True, message="Tip removed")


async def run_jog(data: dict) -> CommandResult:
    """
    Allow the user to jog the selected pipette around the deck map

    :param data: a dict with schema:
    {
      'axis': The current axis you wish to move
      'direction': The direction you wish to move (+ or -)
      'step': The increment you wish to move
    }
    :return: The position moved to based on axis, direction, step
    given by the user.
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    axis = data.get('axis')
    direction = data.get('direction')
    step = data.get('step')

    if axis not in {'x', 'y', 'z'}:
        message = '"axis" must be "x", "y", or "z"'
        status = False
    elif direction not in {-1, 1}:
        message = '"direction" must be -1 or 1'
        status = False
    elif step is None:
        message = '"step" must be specified'
        status = False
    else:
        position = jog(
            axis,
            direction,
            step,
            session_wrapper.session.adapter,
            session_wrapper.session.current_mount,
            session_wrapper.session.cp)
        message = 'Jogged to {}'.format(position)
        status = True

    return CommandResult(success=status, message=message)


async def move(data) -> CommandResult:
    """
    Allow the user to move the selected pipette to a specific point

    :param data: a dict with schema:
    {
      'point': The name of the point to move to. Must be one of
               ["1", "2", "3", "safeZ", "attachTip"]
    }
    :return: The position you are moving to
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    point_name = data.get('point')
    point = safe_points().get(point_name)
    if point and len(point) == 3:
        # For multichannel pipettes in the V1 session, we use the tip closest
        # to the front of the robot rather than the back (this is the tip that
        # would go into well H1 of a plate when pipetting from the first row of
        # a 96 well plate, for instance). Since moves are issued for the A1 tip
        # we have to adjust the target point by 2 * Y_OFFSET_MULTI (where the
        # offset value is the distance from the axial center of the pipette to
        # the A1 tip). By sending the A1 tip to to the adjusted target, the H1
        # tip should go to the desired point. Y_OFFSET_MULT must then be backed
        # out of xy positions saved in the `save_xy` handler
        # (not 2 * Y_OFFSET_MULTI, because the axial center of the pipette
        # will only be off by 1* Y_OFFSET_MULTI).
        if not point_name == 'attachTip':
            intermediate_pos = position(
                session_wrapper.session.current_mount,
                session_wrapper.session.adapter,
                session_wrapper.session.cp)
            session_wrapper.session.adapter.move_to(
                session_wrapper.session.current_mount,
                Point(
                    x=intermediate_pos[0],
                    y=intermediate_pos[1],
                    z=session_wrapper.session.tip_length),
                critical_point=session_wrapper.session.cp)
            session_wrapper.session.adapter.move_to(
                session_wrapper.session.current_mount,
                Point(x=point[0],
                      y=point[1],
                      z=session_wrapper.session.tip_length),
                critical_point=session_wrapper.session.cp)
            session_wrapper.session.adapter.move_to(
                session_wrapper.session.current_mount,
                Point(x=point[0], y=point[1], z=point[2]),
                critical_point=session_wrapper.session.cp)
        else:
            # hack: z=150mm is not a safe point for a gen2 pipette with a tip
            # attached, since their home location is z=+172mm and both 300ul
            # and 1000ul tips are more than 22mm long. This isn't an issue for
            # apiv2 because it can select the NOZZLE critical point.
            if session_wrapper.session.cp == CriticalPoint.TIP:
                session_wrapper.session.cp = CriticalPoint.NOZZLE
            session_wrapper.session.adapter.move_to(
                session_wrapper.session.current_mount,
                Point(x=point[0], y=point[1], z=point[2]),
                critical_point=session_wrapper.session.cp)
        message = 'Moved to {}'.format(point)
        status = True
    else:
        message = '"point" must be one of "1", "2", "3", "safeZ", "attachTip"'
        status = False

    return CommandResult(success=status, message=message)


async def save_xy(data) -> CommandResult:
    """
    Save the current XY values for the calibration data

    :param data: a dict with schema:
    {
      'point': a string ID ['1', '2', or '3'] of the calibration point to save
    }
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    valid_points = list(session_wrapper.session.points.keys())
    point = data.get('point')
    if point not in valid_points:
        message = 'point must be one of {}'.format(valid_points)
        status = False
    elif not session_wrapper.session.current_mount:
        message = "Mount must be set before calibrating"
        status = False
    else:
        x, y, _ = position(
            session_wrapper.session.current_mount,
            session_wrapper.session.adapter,
            session_wrapper.session.cp)

        session_wrapper.session.points[point] = (x, y)
        message = "Saved point {} value: {}".format(
            point, session_wrapper.session.points[point])
        status = True

    return CommandResult(success=status, message=message)


async def save_z(data) -> CommandResult:
    """
    Save the current Z height value for the calibration data

    :param data: unused
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    if not session_wrapper.session.tip_length:
        message = "Tip length must be set before calibrating"
        status = False
    else:
        session_wrapper.session.z_value = position(
            session_wrapper.session.current_mount,
            session_wrapper.session.adapter,
            session_wrapper.session.cp)[-1]

        session_wrapper.session.current_transform[2][3] =\
            session_wrapper.session.z_value

        session_wrapper.session.adapter.update_config(
            gantry_calibration=list(
                list(i) for i in session_wrapper.session.current_transform
            )
        )

        message = "Saved z: {}".format(session_wrapper.session.z_value)
        status = True

    return CommandResult(success=status, message=message)


async def save_transform(data) -> CommandResult:
    """
    Calculate the transformation matrix that calibrates the gantry to the deck

    :param data: unused
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    if any([v is None for v in session_wrapper.session.points.values()]):
        message = "Not all points have been saved"
        status = False
    else:
        # expected values based on mechanical drawings of the robot
        expected_pos = expected_points()
        expected = [
            expected_pos[p] for p in expected_pos.keys()]
        # measured data
        actual = [session_wrapper.session.points[p] for p in
                  sorted(session_wrapper.session.points.keys())]

        # Generate a 2 dimensional transform matrix from the two matricies
        flat_matrix = solve(expected, actual).round(4)

        # replace relevant X, Y and angular components
        # [[cos_x, sin_y, const_zero, delta_x___],
        # [-sin_x, cos_y, const_zero, delta_y___],
        # [const_zero, const_zero, const_one_, delta_z___],
        # [const_zero, const_zero, const_zero, const_one_]]
        session_wrapper.session.current_transform = \
            add_z(flat_matrix, session_wrapper.session.z_value)
        session_wrapper.session.adapter.update_config(
            gantry_calibration=list(
                list(i) for i in session_wrapper.session.current_transform)
        )
        new_gantry_cal =\
            session_wrapper.session.adapter.config.gantry_calibration
        session_wrapper.session.backup_gantry_cal = new_gantry_cal

        robot_configs.save_deck_calibration(
            session_wrapper.session.adapter.config)

        message = "Config file saved and backed up"
        status = True

    return CommandResult(success=status, message=message)


async def release(data) -> CommandResult:
    """
    Release a session

    :param data: unused
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    session_wrapper.session.adapter.cache_instruments()
    full_gantry_cal = session_wrapper.session.backup_gantry_cal
    session_wrapper.session.adapter.update_config(
        gantry_calibration=full_gantry_cal)
    session_wrapper.session = None

    return CommandResult(success=True, message="calibration session released")


# ---------------------- End Route Fns -------------------------

# The description of the routes
class CalibrationCommand(str, Enum):
    run_jog = "jog"
    move = "move"
    save_xy = "save xy"
    attach_tip = "attach tip"
    detach_tip = "detach tip"
    save_z = "save z"
    save_transform = "save transform"
    release = "release"


# Router must be defined after all route functions
router = {
    CalibrationCommand.run_jog: run_jog,
    CalibrationCommand.move: move,
    CalibrationCommand.save_xy: save_xy,
    CalibrationCommand.attach_tip: attach_tip,
    CalibrationCommand.detach_tip: detach_tip,
    CalibrationCommand.save_z: save_z,
    CalibrationCommand.save_transform: save_transform,
    CalibrationCommand.release: release
}


class SessionInProgress(Exception):
    pass


class NoSessionInProgress(Exception):
    pass


class SessionForbidden(Exception):
    pass


class CreateSessionResult(NamedTuple):
    token: str
    pipette: Dict


async def create_session(force: bool, hardware) -> CreateSessionResult:
    """
    Begins the session manager for factory calibration, if a session is not
    already in progress, or if the "force" key is specified in the request. To
    force, use the following body:

    :param force: force creation of a session
    :param hardware: hardware instance
    :return: The current session ID token or an error message
    """
    if session_wrapper.session and not force:
        raise SessionInProgress(
            'Error, session in progress. Use "force" key in request '
            'body to override')

    if force and session_wrapper.session:
        await release({})

    session_wrapper.session = SessionManager(hardware)
    res = init_pipette(session_wrapper.session)
    if not res:
        session_wrapper.session = None
        raise SessionForbidden('Error, pipette not recognized')

    return CreateSessionResult(token=session_wrapper.session.id,
                               pipette=res)


async def dispatch(token: str, command: str, command_data) -> CommandResult:
    """
    Routes commands to subhandlers based on the command field in the body.

    :param token: The session token. Must match the current session
    :param command: The calibration command
    :param command_data: The data to pass to command router
    """
    if not session_wrapper.session:
        raise NoSessionInProgress("Session must be started before "
                                  "issuing commands")

    log.info("Dispatching token=%s, command=%s, command_data=%s",
             token, command, command_data)

    if token != session_wrapper.session.id:
        raise SessionForbidden(f"Invalid token: {token}")

    try:
        command = CalibrationCommand(command)
        res = await router[command](data=command_data)

    except (ValueError, KeyError):
        raise SessionForbidden(
            f"Command \"{command}\" is unknown and cannot be executed")

    return res
