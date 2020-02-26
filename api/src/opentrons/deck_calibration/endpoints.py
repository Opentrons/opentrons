from aiohttp import web
from uuid import uuid1

from typing import Dict, Tuple

import logging
import json
try:
    from opentrons import instruments
except ImportError:
    pass
from opentrons.config import pipette_config, robot_configs, feature_flags
from opentrons.types import Mount, Point
from opentrons.hardware_control.types import CriticalPoint
from . import jog, position, dots_set, z_pos
from opentrons.util.linal import add_z, solve, identity_deck_transform

session = None
mount_by_name = {'left': Mount.LEFT, 'right': Mount.RIGHT}
log = logging.getLogger(__name__)


def hw_from_req(req):
    """ Utility function to get the hardware resource from requests """
    return req.app['com.opentrons.hardware']


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


# -------------- Route Fns -----------------------------------------------
# Note: endpoints should not call these functions directly, to ensure that
# session protections are applied--should be called through the dispatch
# endpoint
# ------------------------------------------------------------------------
def init_pipette():
    """
    Finds pipettes attached to the robot currently and chooses the correct one
    to add to the session.

    :return: The pipette type and mount chosen for deck calibration
    """
    global session
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


def get_pipettes(sess):
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


def set_current_mount(session):
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


async def attach_tip(data):
    """
    Attach a tip to the current pipette

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'attach tip'
      'tipLength': a float representing how much the length of a pipette
        increases when a tip is added
    }
    """
    global session
    tip_length = data.get('tipLength')

    if not tip_length:
        message = 'Error: "tipLength" must be specified in request'
        status = 400
    else:
        if not feature_flags.use_protocol_api_v2():
            pipette = session.pipettes[session.current_mount]
            if pipette.tip_attached:
                log.warning('attach tip called while tip already attached')
                pipette._remove_tip(pipette._tip_length)
            pipette._add_tip(tip_length)
        else:
            session.adapter.add_tip(session.current_mount, tip_length)
            if session.cp == CriticalPoint.NOZZLE:
                session.cp = CriticalPoint.TIP
        session.tip_length = tip_length

        message = "Tip length set: {}".format(tip_length)
        status = 200

    return web.json_response({'message': message}, status=status)


async def detach_tip(data):
    """
    Detach the tip from the current pipette

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'detach tip'
    }
    """
    global session

    if not feature_flags.use_protocol_api_v2():
        pipette = session.pipettes[session.current_mount]
        if not pipette.tip_attached:
            log.warning('detach tip called with no tip')
        pipette._remove_tip(session.tip_length)
    else:
        session.adapter.remove_tip(session.current_mount)
        if session.cp == CriticalPoint.TIP:
            session.cp = CriticalPoint.NOZZLE
    session.tip_length = None

    return web.json_response({'message': "Tip removed"}, status=200)


async def run_jog(data):
    """
    Allow the user to jog the selected pipette around the deck map

    :param data: Information obtained from a POST request.
    The content type is application/json
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'jog'
      'axis': The current axis you wish to move
      'direction': The direction you wish to move (+ or -)
      'step': The increment you wish to move
    }
    :return: The position you are moving to based on axis, direction, step
    given by the user.
    """
    axis = data.get('axis')
    direction = data.get('direction')
    step = data.get('step')

    if axis not in ('x', 'y', 'z'):
        message = '"axis" must be "x", "y", or "z"'
        status = 400
    elif direction not in (-1, 1):
        message = '"direction" must be -1 or 1'
        status = 400
    elif step is None:
        message = '"step" must be specified'
        status = 400
    else:
        position = jog(
            axis,
            direction,
            step,
            session.adapter,
            session.current_mount,
            session.cp)
        message = 'Jogged to {}'.format(position)
        status = 200

    return web.json_response({'message': message}, status=status)


async def move(data):
    """
    Allow the user to move the selected pipette to a specific point

    :param data: Information obtained from a POST request.
    The content type is application/json
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'move'
      'point': The name of the point to move to. Must be one of
               ["1", "2", "3", "safeZ", "attachTip"]
    }
    :return: The position you are moving to
    """
    global session
    point_name = data.get('point')
    point = safe_points().get(point_name)
    if point and len(point) == 3:
        if not feature_flags.use_protocol_api_v2():
            pipette = session.pipettes[session.current_mount]
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

            pipette.move_to((session.adapter.deck, point), strategy='arc')
        else:
            if not point_name == 'attachTip':
                intermediate_pos = position(
                    session.current_mount, session.adapter, session.cp)
                session.adapter.move_to(
                    session.current_mount,
                    Point(
                        x=intermediate_pos[0],
                        y=intermediate_pos[1],
                        z=session.tip_length),
                    critical_point=session.cp)
                session.adapter.move_to(
                    session.current_mount,
                    Point(x=point[0], y=point[1], z=session.tip_length),
                    critical_point=session.cp)
                session.adapter.move_to(
                    session.current_mount,
                    Point(x=point[0], y=point[1], z=point[2]),
                    critical_point=session.cp)
            else:
                if session.cp == CriticalPoint.TIP:
                    session.cp = CriticalPoint.NOZZLE
                session.adapter.move_to(
                    session.current_mount,
                    Point(x=point[0], y=point[1], z=point[2]),
                    critical_point=session.cp)
        message = 'Moved to {}'.format(point)
        status = 200
    else:
        message = '"point" must be one of "1", "2", "3", "safeZ", "attachTip"'
        status = 400

    return web.json_response({'message': message}, status=status)


async def save_xy(data):
    """
    Save the current XY values for the calibration data

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'save xy'
      'point': a string ID ['1', '2', or '3'] of the calibration point to save
    }
    """
    global session
    valid_points = list(session.points.keys())
    point = data.get('point')
    if point not in valid_points:
        message = 'point must be one of {}'.format(valid_points)
        status = 400
    elif not session.current_mount:
        message = "Mount must be set before calibrating"
        status = 400
    else:
        if not feature_flags.use_protocol_api_v2():
            mount = 'Z' if session.current_mount == 'left' else 'A'
            x, y, _ = position(mount, session.adapter)
            if session.pipettes[session.current_mount].channels != 1:
                # See note in `move`
                y = y - pipette_config.Y_OFFSET_MULTI
            if session.current_mount == 'left':
                dx, dy, _ = session.adapter.config.mount_offset
                x = x + dx
                y = y + dy
        else:
            x, y, _ = position(
                session.current_mount, session.adapter, session.cp)

        session.points[point] = (x, y)
        message = "Saved point {} value: {}".format(
            point, session.points[point])
        status = 200
    return web.json_response({'message': message}, status=status)


async def save_z(data):
    """
    Save the current Z height value for the calibration data

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'save z'
    }
    """
    if not session.tip_length:
        message = "Tip length must be set before calibrating"
        status = 400
    else:
        if not feature_flags.use_protocol_api_v2():
            mount = 'Z' if session.current_mount == 'left' else 'A'
            actual_z = position(
                mount, session.adapter)[-1]
            length_offset = pipette_config.load(
                session.current_model, session.pipette_id).model_offset[-1]
            session.z_value = actual_z - session.tip_length + length_offset
        else:
            session.z_value = position(
                session.current_mount, session.adapter, session.cp)[-1]

        session.current_transform[2][3] = session.z_value

        session.adapter.update_config(gantry_calibration=list(
                map(lambda i: list(i), session.current_transform)))

        message = "Saved z: {}".format(session.z_value)
        status = 200
    return web.json_response({'message': message}, status=status)


async def save_transform(data):
    """
    Calculate the transormation matrix that calibrates the gantry to the deck
    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'save transform'
    }
    """
    if any([v is None for v in session.points.values()]):
        message = "Not all points have been saved"
        status = 400
    else:
        # expected values based on mechanical drawings of the robot
        expected_pos = expected_points()
        expected = [
            expected_pos[p] for p in expected_pos.keys()]
        # measured data
        actual = [session.points[p] for p in sorted(session.points.keys())]

        # Generate a 2 dimensional transform matrix from the two matricies
        flat_matrix = solve(expected, actual).round(4)

        # replace relevant X, Y and angular components
        # [[cos_x, sin_y, const_zero, delta_x___],
        # [-sin_x, cos_y, const_zero, delta_y___],
        # [const_zero, const_zero, const_one_, delta_z___],
        # [const_zero, const_zero, const_zero, const_one_]]
        session.current_transform = add_z(flat_matrix, session.z_value)
        session.adapter.update_config(gantry_calibration=list(
                map(lambda i: list(i), session.current_transform)))

        robot_configs.save_deck_calibration(session.adapter.config)

        message = "Config file saved and backed up"
        status = 200
    return web.json_response({'message': message}, status=status)


async def release(data):
    """
    Release a session

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'release'
    }
    """
    global session
    if not feature_flags.use_protocol_api_v2():
        session.adapter.remove_instrument('left')
        session.adapter.remove_instrument('right')
    else:
        session.adapter.cache_instruments()
    session = None
    return web.json_response({"message": "calibration session released"})

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


async def start(request):
    """
    Begins the session manager for factory calibration, if a session is not
    already in progress, or if the "force" key is specified in the request. To
    force, use the following body:
    {
      "force": true
    }
    :return: The current session ID token or an error message
    """
    global session

    try:
        body = await request.json()
    except json.decoder.JSONDecodeError:
        # Body will be null for requests without parameters (normal operation)
        log.debug("No body in {}".format(request))
        body = {}

    if not session or body.get('force'):
        hardware = hw_from_req(request)
        if body.get('force') and session:
            await release(data={})

        session = SessionManager(hardware)
        res = init_pipette()
        if res:
            status = 201
            data = {'token': session.id, 'pipette': res}
        else:
            session = None
            status = 403
            data = {'message': 'Error, pipette not recognized'}
    else:
        data = {'message': 'Error, session in progress. Use "force" key in'
                           ' request body to override'}
        status = 409
    return web.json_response(data, status=status)


async def dispatch(request):
    """
    Routes commands to subhandlers based on the command field in the body.
    """
    if session:
        message = ''
        data = await request.json()
        try:
            log.info("Dispatching {}".format(data))
            _id = data.get('token')
            if not _id:
                message = '"token" field required for calibration requests'
                raise AssertionError
            command = data.get('command')
            if not command:
                message = '"command" field required for calibration requests'
                raise AssertionError

            if _id == session.id:
                res = await router[command](data)
            else:
                res = web.json_response(
                    {'message': 'Invalid token: {}'.format(_id)}, status=403)
        except AssertionError:
            res = web.json_response({'message': message}, status=400)
        except Exception as e:
            res = web.json_response(
                {'message': 'Exception {} raised by dispatch of {}: {}'.format(
                    type(e), data, e)},
                status=500)
    else:
        res = web.json_response(
            {'message': 'Session must be started before issuing commands'},
            status=418)
    return res
