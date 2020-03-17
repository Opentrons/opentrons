from uuid import uuid1

from typing import Dict, Tuple, Optional, NamedTuple

import logging

try:
    from opentrons import instruments
except ImportError:
    pass
from opentrons.config import pipette_config, robot_configs, feature_flags
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


def expected_points():
    slot_1_lower_left,\
        slot_3_lower_right,\
        slot_7_upper_left = dots_set()

    return {
        '1': slot_1_lower_left,
        '2': slot_3_lower_right,
        '3': slot_7_upper_left}


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
        '1': slot_1_safe_point,
        '2': slot_3_safe_point,
        '3': slot_7_safe_point,
        'safeZ': z_pos,
        'attachTip': attach_tip_point
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
    pipette_info = set_current_mount(session)
    pipette = pipette_info['pipette']
    res = {}
    if pipette:
        session.current_model = pipette_info['model']
        if not feature_flags.use_protocol_api_v2():
            mount = pipette.mount
            session.current_mount = mount
        else:
            mount = pipette.get('mount')
            session.current_mount = mount_by_name[mount]
        session.pipettes[mount] = pipette
        res = {'mount': mount, 'model': pipette_info['model']}

    log.info("Pipette info {}".format(session.pipettes))

    return res


def get_pipettes(sess: SessionManager):
    if not feature_flags.use_protocol_api_v2():
        attached_pipettes = sess.adapter.get_attached_pipettes()
        left_pipette = None
        right_pipette = None
        left = attached_pipettes.get('left')
        right = attached_pipettes.get('right')
        if left['model'] in pipette_config.config_models:
            left_pipette = instruments.pipette_by_name(
                'left', left['name'])
        if right['model'] in pipette_config.config_models:
            right_pipette = instruments.pipette_by_name(
                'right', right['name'])
    else:
        attached_pipettes = sess.adapter.attached_instruments
        left_pipette = attached_pipettes.get(Mount.LEFT)
        right_pipette = attached_pipettes.get(Mount.RIGHT)
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
        if not feature_flags.use_protocol_api_v2():
            right_channel = right_pipette.channels
        else:
            right_channel = right_pipette.get('channels')
            right_pipette['mount'] = 'right'

    if left_pipette:
        if not feature_flags.use_protocol_api_v2():
            left_channel = left_pipette.channels
        else:
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
        if not feature_flags.use_protocol_api_v2():
            model = pipette.model
            pip_info = adapter.get_attached_pipettes()[pipette.mount]
            pip_id = pip_info['id']
        else:
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

class Result(NamedTuple):
    success: bool
    message: str


async def attach_tip(data) -> Result:
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
        if not feature_flags.use_protocol_api_v2():
            pipette = session_wrapper.session.pipettes[
                session_wrapper.session.current_mount]
            if pipette.tip_attached:
                log.warning('attach tip called while tip already attached')
                pipette._remove_tip(pipette._tip_length)
            pipette._add_tip(tip_length)
        else:
            session_wrapper.session.adapter.add_tip(
                session_wrapper.session.current_mount, tip_length)
            if session_wrapper.session.cp == CriticalPoint.NOZZLE:
                session_wrapper.session.cp = CriticalPoint.TIP
        session_wrapper.session.tip_length = tip_length

        message = "Tip length set: {}".format(tip_length)
        status = True

    return Result(success=status, message=message)


async def detach_tip(data) -> Result:
    """
    Detach the tip from the current pipette

    :param data: unused
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    if not feature_flags.use_protocol_api_v2():
        pipette = session_wrapper.session.pipettes[
            session_wrapper.session.current_mount]
        if not pipette.tip_attached:
            log.warning('detach tip called with no tip')
        pipette._remove_tip(session_wrapper.session.tip_length)
    else:
        session_wrapper.session.adapter.remove_tip(
            session_wrapper.session.current_mount)
        if session_wrapper.session.cp == CriticalPoint.TIP:
            session_wrapper.session.cp = CriticalPoint.NOZZLE
    session_wrapper.session.tip_length = None

    return Result(success=True, message="Tip removed")


async def run_jog(data: dict) -> Result:
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

    return Result(success=status, message=message)


async def move(data) -> Result:
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
    point = safe_points().get(str(point_name))
    if point and len(point) == 3:
        if not feature_flags.use_protocol_api_v2():
            pipette = session_wrapper.session.pipettes[
                session_wrapper.session.current_mount]
            channels = pipette.channels
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
            if not channels == 1:
                x = point[0]
                y = point[1] + pipette_config.Y_OFFSET_MULTI * 2
                z = point[2]
                point = (x, y, z)
            # hack: z=150mm is not a safe point for a gen2 pipette with a tip
            # attached, since their home location is z=+172mm and both 300ul
            # and 1000ul tips are more than 22mm long. This isn't an issue for
            # apiv2 because it can select the NOZZLE critical point.
            if pipette.tip_attached and point_name == 'attachTip':
                point = (point[0],
                         point[1],
                         point[2]-pipette._tip_length)

            pipette.move_to((session_wrapper.session.adapter.deck, point),
                            strategy='arc')
        else:
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

    return Result(success=status, message=message)


async def save_xy(data) -> Result:
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
        if not feature_flags.use_protocol_api_v2():
            mount = 'Z' if session_wrapper.session.current_mount == 'left'\
                else 'A'
            x, y, _ = position(mount, session_wrapper.session.adapter)
            if session_wrapper.session.pipettes[
                    session_wrapper.session.current_mount].channels != 1:
                # See note in `move`
                y = y - pipette_config.Y_OFFSET_MULTI
            if session_wrapper.session.current_mount == 'left':
                dx, dy, _ = session_wrapper.session.adapter.config.mount_offset
                x = x + dx
                y = y + dy
        else:
            x, y, _ = position(
                session_wrapper.session.current_mount,
                session_wrapper.session.adapter,
                session_wrapper.session.cp)

        session_wrapper.session.points[point] = (x, y)
        message = "Saved point {} value: {}".format(
            point, session_wrapper.session.points[point])
        status = True

    return Result(success=status, message=message)


async def save_z(data) -> Result:
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
        if not feature_flags.use_protocol_api_v2():
            mount = 'Z' if session_wrapper.session.current_mount == 'left' \
                else 'A'
            actual_z = position(
                mount, session_wrapper.session.adapter)[-1]
            length_offset = pipette_config.load(
                session_wrapper.session.current_model,
                session_wrapper.session.pipette_id).model_offset[-1]
            session_wrapper.session.z_value =\
                actual_z - session_wrapper.session.tip_length + length_offset
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

    return Result(success=status, message=message)


async def save_transform(data) -> Result:
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

        robot_configs.save_deck_calibration(
            session_wrapper.session.adapter.config)

        message = "Config file saved and backed up"
        status = True

    return Result(success=status, message=message)


async def release(data) -> Result:
    """
    Release a session

    :param data: unused
    """
    if not session_wrapper.session:
        raise NoSessionInProgress()

    if not feature_flags.use_protocol_api_v2():
        session_wrapper.session.adapter.remove_instrument('left')
        session_wrapper.session.adapter.remove_instrument('right')
    else:
        session_wrapper.session.adapter.cache_instruments()
    session_wrapper.session = None

    return Result(success=True, message="calibration session released")


# ---------------------- End Route Fns -------------------------

# Router must be defined after all route functions
router = {'jog': run_jog,
          'move': move,
          'save xy': save_xy,
          'attach tip': attach_tip,
          'detach tip': detach_tip,
          'save z': save_z,
          'save transform': save_transform,
          'release': release}


class SessionInProgress(Exception):
    pass


class NoSessionInProgress(Exception):
    pass


class SessionForbidden(Exception):
    pass


class StartSessionResult(NamedTuple):
    token: str
    pipette: Dict


async def create_session(force: bool, hardware) -> StartSessionResult:
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

    return StartSessionResult(token=session_wrapper.session.id,
                              pipette=res)


async def dispatch(token: str, command: str, command_data) -> Result:
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

    res = await router[command](data=command_data)

    return res
