import os
import json
import tempfile
from aiohttp import web
from opentrons.server.main import init, log_init
from opentrons.server.endpoints import (control, update)


async def test_restart(virtual_smoothie_env, monkeypatch, loop, test_client):
    test_data = {"test": "pass"}

    async def mock_restart(request):
        return web.json_response(test_data)
    monkeypatch.setattr(control, 'restart', mock_restart)

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    expected = json.dumps(test_data)
    resp = await cli.post('/server/restart')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_update(virtual_smoothie_env, monkeypatch, loop, test_client):
    log_init()

    msg = "success"
    filename = "testy.whl"
    tmpdir = tempfile.mkdtemp("files")
    with open(os.path.join(tmpdir, filename), 'w') as fd:
        fd.write("test")

    async def mock_install(filename, loop):
        return msg
    monkeypatch.setattr(update, '_install', mock_install)

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    data = {'whl': open(os.path.join(tmpdir, filename))}

    resp = await cli.post(
        '/server/update',
        data=data)

    expected = json.dumps({
        'message': msg,
        'filename': filename
    })
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_feature_flags(
        virtual_smoothie_env, loop, test_client):
    log_init()

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    r0 = await cli.get('/settings')
    r0body = await r0.text()
    assert json.loads(r0body) == {}

    flag_name = 'testy'
    flag_value = '1'
    flag = {'key': flag_name, 'value': flag_value}
    r1 = await cli.post('/settings/set', json=flag)
    assert r1.status == 200

    r2 = await cli.get('/settings')
    r2body = await r2.text()
    expected = {flag_name: flag_value}
    assert json.loads(r2body) == expected
