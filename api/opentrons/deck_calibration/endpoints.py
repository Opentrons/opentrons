from aiohttp import web
from uuid import uuid1
from opentrons.instruments import pipette_config
from opentrons import instruments
from opentrons.deck_calibration import jog

session = None


def _get_uuid() -> str:
    return str(uuid1())


class SessionManager:
    def __init__(self):
        self.id = _get_uuid()
        self.pipettes = {}
        self.current_mount = None
        self.router = {'jog': self.run_jog,
                       'init pipette': self.init_pipette,
                       'select pipette': self.set_current_mount}

    async def init_pipette(self, data):
        assert data['mount'] in ['left', 'right']
        assert data['model'] in pipette_config.configs.keys()

        config = pipette_config.load(data['model'])
        pipette = instruments._create_pipette_from_config(
            mount=data['mount'], config=config)
        self.pipettes[data['mount']] = pipette

        res = {'pipettes': {}}
        left = self.pipettes.get('left')
        right = self.pipettes.get('right')

        if left:
            res['pipettes']['left'] = left.name
        if right:
            res['pipettes']['right'] = right.name

        return web.json_response(res)

    async def set_current_mount(self, params):
        assert params['mount'] in ['left', 'right']
        self.current_mount = params['mount']

        return web.json_response({'mount': self.current_mount})

    async def run_jog(self, data):
        if self.current_mount:
            res = jog(
                data['axis'],
                float(data['direction']),
                float(data['step']))
        else:
            res = None
        return web.json_response({'result': res})


async def start(request):
    global session
    session = SessionManager()
    return web.json_response({'token': session.id}, status=201)


async def dispatch(request):
    data = await request.post()
    _id = data['token']
    command = data['command']

    if _id == session.id:
        res = await session.router[command](data)
    else:
        res = web.json_response(
            {'error': 'Invalid token: {}'.format(_id)}, status=403)
    return res



