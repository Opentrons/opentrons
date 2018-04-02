from aiohttp import web
from uuid import uuid1
from opentrons.instruments import pipette_config
from opentrons import instruments, robot
from opentrons.robot import robot_configs
from opentrons.deck_calibration import jog, position
from opentrons.deck_calibration.linal import add_z, solve
import logging
import json

session = None
log = logging.getLogger(__name__)

slot_1_lower_left = (12.13, 6.0)
slot_3_lower_right = (380.87, 6.0)
slot_10_upper_left = (12.13, 351.5)

# Safe points are defined as 5mm toward the center of the deck in x and y, and
# 10mm above the deck. User is expect to jog to the critical point from the
# corresponding safe point, to avoid collision depending on direction of
# misalignment between the deck and the gantry.
slot_1_safe_point = (slot_1_lower_left[0] + 5, slot_1_lower_left[1] + 5, 10)
slot_3_safe_point = (slot_3_lower_right[0] - 5, slot_3_lower_right[1] + 5, 10)
slot_10_safe_point = (slot_10_upper_left[0] + 5, slot_10_upper_left[1] - 5, 10)

expected_points = {
    '1': slot_1_lower_left,
    '2': slot_3_lower_right,
    '3': slot_10_upper_left}


safe_points = {
    '1': slot_1_safe_point,
    '2': slot_3_safe_point,
    '3': slot_10_safe_point}


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
    def __init__(self):
        self.id = _get_uuid()
        self.pipettes = {}
        self.current_mount = None
        self.tip_length = None
        self.points = {k: None for k in expected_points.keys()}
        self.z_value = None


# -------------- Route Fns -----------------------------------------------
# Note: endpoints should not call these functions directly, to ensure that
# session protections are applied--should be called through the dispatch
# endpoint
# ------------------------------------------------------------------------
async def init_pipette(data):
    """
    Initializes pipette on a mount

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'init pipette'
      'mount': Can be 'right' or 'left' represents pipette mounts
      'model': Can be from the list of pipettes found
          in `pipette_config.configs`
    }
    :return: The pipette types currently mounted.
    """
    global session
    assert data['mount'] in ['left', 'right']
    assert data['model'] in pipette_config.configs.keys()

    config = pipette_config.load(data['model'])
    pipette = instruments._create_pipette_from_config(
        mount=data['mount'], config=config)
    session.pipettes[data['mount']] = pipette

    log.info("Pipette info {}".format(session.pipettes))

    res = {'pipettes': {}}
    left = session.pipettes.get('left')
    right = session.pipettes.get('right')

    if left:
        res['pipettes']['left'] = left.name
    if right:
        res['pipettes']['right'] = right.name
    status = 200
    return web.json_response(res, status=status)


async def set_current_mount(params):
    """
    Choose the pipette in which to execute commands

    :param params: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'select pipette'
      'mount': Can be 'right' or 'left' represents pipette mounts
    }
    :return: The selected pipette
    """
    global session
    mount = params.get('mount')
    if mount in ['left', 'right']:
        session.current_mount = 'A' if params['mount'] is 'right' else 'Z'
        msg = 'Mount: {}'.format(session.current_mount)
        status = 200
    else:
        msg = 'Error: mount must be "left" or "right", got "{}"'.format(
                mount)
        status = 400
    return web.json_response({'message': msg}, status=status)


async def attach_tip(data):
    """
    Attach a tip to the current pipette

    :param data: Information obtained from a POST request.
    The content type is application/json.
    The correct packet form should be as follows:
    {
      'token': UUID token from current session start
      'command': 'attach tip'
      'tip-length': a float representing how much the length of a pipette
        increases when a tip is added
    }
    """
    global session
    tip_length = data.get('tip-length')
    mount = 'left' if session.current_mount == 'Z' else 'right'
    if not session.current_mount:
        message = "Error: current mount must be set before attaching tip"
        status = 400
    elif not tip_length:
        message = 'Error: "tip-length" must be specified in request'
        status = 400
    elif session.pipettes[mount].tip_attached:
        message = "Error: tip already attached"
        status = 400
    else:
        session.tip_length = tip_length
        session.pipettes[mount]._add_tip(tip_length)
        message = "Tip length set: {}".format(session.tip_length)
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
    mount = 'left' if session.current_mount == 'Z' else 'right'
    if not session.current_mount:
        message = "Error: current mount must be set before attaching tip"
        status = 400
    elif not session.pipettes[mount].tip_attached:
        message = "Error: no tip attached"
        status = 400
    else:
        pip = session.pipettes[mount]
        pip._remove_tip(session.tip_length)
        session.tip_length = None
        message = "Tip removed"
        status = 200
    return web.json_response({'message': message}, status=status)


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
    if session.current_mount:
        message = jog(
            data['axis'],
            float(data['direction']),
            float(data['step']))
        status = 200
    else:
        message = "Current mount must be set before jogging"
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
      'point': an integer [1, 2, or 3] of the calibration point to save
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
        x, y, _ = position(session.current_mount)
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
        actual_z = position(session.current_mount)[-1]
        session.z_value = actual_z - session.tip_length
        message = "Saved z: {}".format(session.z_value)
        status = 200
    return web.json_response({'message': message}, status=status)


def save_transform(data):
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
        expected = [expected_points[p] for p in sorted(expected_points.keys())]
        # measured data
        actual = [session.points[p] for p in sorted(session.points.keys())]
        # Generate a 2 dimensional transform matrix from the two matricies
        flat_matrix = solve(expected, actual)
        # Add the z component to form the 3 dimensional transform
        calibration_matrix = add_z(flat_matrix, session.z_value)

        robot.config = robot.config._replace(
            gantry_calibration=list(
                map(lambda i: list(i), calibration_matrix)))

        robot_configs.save(robot.config)
        robot_configs.backup_configuration(robot.config)
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
    session = None
    return web.json_response({"message": "calibration session released"})

# ---------------------- End Route Fns -------------------------

# Router must be defined after all route functions
router = {'jog': run_jog,
          'init pipette': init_pipette,
          'select pipette': set_current_mount,
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
        session = SessionManager()
        data = {'token': session.id}
        status = 201
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
        data = await request.post()
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
