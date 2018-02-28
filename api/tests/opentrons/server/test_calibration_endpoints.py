import json
from opentrons import robot
from opentrons.server.main import init
from opentrons.deck_calibration import endpoints
from aiohttp import web
from opentrons.instruments import pipette_config
from opentrons import instruments


## Session and token tests
async def test_create_session(
        virtual_smoothie_env, loop, test_client, monkeypatch):

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    expected = {'token': dummy_token}
    resp = await cli.get('/calibration/deck')
    text = await resp.json()
    assert resp.status == 201
    assert text == expected


async def test_incorrect_token(
        virtual_smoothie_env, test_client, loop, monkeypatch):
    robot.reset()
    app = init(loop)
    client = await loop.create_task(test_client(app))

    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await client.get('/calibration/deck')

    resp = await client.post(
        '/calibration/deck',
        data={
            'token': 'FAKE TOKEN',
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single'
        })

    assert resp.status == 403


## Router tests
async def test_init_pipette(
        virtual_smoothie_env, test_client, loop, monkeypatch):
    robot.reset()
    app = init(loop)
    client = await loop.create_task(test_client(app))

    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await client.get('/calibration/deck')
    token_text = await token_res.json()
    token = token_text['token']

    resp = await client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single'
        })

    body = await resp.json()

    assert body['pipettes']['left'] == 'p10_single'
    assert endpoints.session.pipettes.get('right') is None


async def test_set_and_jog(
        virtual_smoothie_env, test_client, loop, monkeypatch):

    robot.reset()
    app = init(loop)
    client = await loop.create_task(test_client(app))

    dummy_token = 'Test Token'

    def uuid_mock():
        return dummy_token

    monkeypatch.setattr(endpoints, '_get_uuid', uuid_mock)

    token_res = await client.get('/calibration/deck')
    token_text = await token_res.json()
    token = token_text['token']

    await client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'init pipette',
            'mount': 'left',
            'model': 'p10_single'
        })

    await client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'select pipette',
            'mount': 'left'
        })

    axis = 'Z'
    direction = '1'
    step = '3'

    resp = await client.post(
        '/calibration/deck',
        data={
            'token': token,
            'command': 'jog',
            'mount': 'left',
            'axis': axis,
            'direction': direction,
            'step': step
        })

    print(resp)
    body = await resp.json()

    assert body['result'] == [0, 0, float(step)]
