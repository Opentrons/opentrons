from aiohttp import web
from uuid import uuid1
from opentrons.instruments import pipette_config
from opentrons import instruments, robot
from opentrons.deck_calibration import jog, position, get_z, set_z
import logging
import json

session = None
log = logging.getLogger(__name__)


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
    'model': Can be from the list of pipettes found in `pipette_config.configs`
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


async def save_z(data):
    """
    Save the current Z height value for the calibration data
        The correct packet form should be as follows:
    {
    'token': UUID token from current session start
    'command': 'save z'
    'tip-length': a float representing how much the length of a pipette
        increases when a tip is added
    }
    """
    tip_length = data.get('tip-length')
    if not tip_length:
        message = "tip-length must be specified"
        status = 400
    else:
        actual_z = position(session.current_mount)[-1]
        set_z(robot, actual_z - tip_length)
        message = "Saved z: {}".format(get_z(robot))
        status = 200
    return web.json_response({'message': message}, status=status)


async def release(data):
    """
    Release a session
    """
    global session
    session = None
    return web.json_response({"message": "calibration session released"})

# ---------------------- End Route Fns -------------------------

# Router must be defined after all route functions
router = {'jog': run_jog,
          'init pipette': init_pipette,
          'select pipette': set_current_mount,
          'save z': save_z,
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
