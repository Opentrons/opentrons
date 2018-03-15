from aiohttp import web
from uuid import uuid1
from opentrons.instruments import pipette_config
from opentrons import instruments
from opentrons.deck_calibration import jog
import logging

session = None
log = logging.getLogger(__name__)


def _get_uuid() -> str:
    return str(uuid1())


class SessionManager:
    """
    Creates a session manager to handle all commands required for changing
    pipettes.
    Before issuing a movement command, the following must be done:
    1. Create a session manager
    2. Initialize a pipette
    3. Select the current pipette
    """
    def __init__(self):
        self.id = _get_uuid()
        self.pipettes = {}
        self.current_mount = None
        self.router = {'jog': self.run_jog,
                       'init pipette': self.init_pipette,
                       'select pipette': self.set_current_mount}

    async def init_pipette(self, data):
        """
        Initializes pipette on a mount

        :param data: Information obtained from a POST request.
        The content type is application/json.
        The correct packet form should be as follows:
        {
        'token': UUID token from current session start
        'command': 'init pipette'
        'mount': Can be 'right' or 'left' represents pipette mounts
        'model': Can be from the list of pipettes found under
        pipette_config.configs
        }
        :return: The pipette types currently mounted.
        """
        assert data['mount'] in ['left', 'right']
        assert data['model'] in pipette_config.configs.keys()

        config = pipette_config.load(data['model'])
        pipette = instruments._create_pipette_from_config(
            mount=data['mount'], config=config)
        self.pipettes[data['mount']] = pipette

        log.info("Pipette info {}".format(self.pipettes))

        res = {'pipettes': {}}
        left = self.pipettes.get('left')
        right = self.pipettes.get('right')

        if left:
            res['pipettes']['left'] = left.name
        if right:
            res['pipettes']['right'] = right.name

        return web.json_response(res)

    async def set_current_mount(self, params):
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
        assert params['mount'] in ['left', 'right']
        self.current_mount = params['mount']

        return web.json_response({'mount': self.current_mount})

    async def run_jog(self, data):
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
        if self.current_mount:
            res = jog(
                data['axis'],
                float(data['direction']),
                float(data['step']))
        else:
            res = None
        return web.json_response({'result': res})


async def start(request):
    """
    Begins the session manager for factory calibration
    :return: The current session ID token
    """
    global session
    session = SessionManager()
    return web.json_response({'token': session.id}, status=201)


async def dispatch(request):
    """
    Routes commands to subhandlers based on the command field in the body.
    """
    data = await request.post()
    try:
        log.info("Dispatching {}".format(data))
        _id = data['token']
        command = data['command']

        if _id == session.id:
            res = await session.router[command](data)
        else:
            res = web.json_response(
                {'error': 'Invalid token: {}'.format(_id)}, status=403)
    except Exception as e:
        res = web.json_response(
            {'error': 'Exception {} raised by dispatch of {}: {}'.format(
                type(e), data, e)},
            status=500)
    return res
