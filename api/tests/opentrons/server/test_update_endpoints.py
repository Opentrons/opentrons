import os
import json
import tempfile
from aiohttp import web
from opentrons.server.main import init
from opentrons.server.endpoints import update
import ot2serverlib
from ot2serverlib import ignore_update


async def test_restart(virtual_smoothie_env, monkeypatch, loop, test_client):
    test_data = {"test": "pass"}

    async def mock_restart(request):
        return web.json_response(test_data)
    monkeypatch.setattr(ot2serverlib.endpoints, 'restart', mock_restart)

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    expected = json.dumps(test_data)
    resp = await cli.post('/server/restart')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_update(virtual_smoothie_env, monkeypatch, loop, test_client):
    msg = "success"
    whl_name = "testy.whl"
    serverlib_name = "testylib.whl"
    fw_name = "testy.fw"
    tmpdir = tempfile.mkdtemp("files")
    for filename in [whl_name, serverlib_name, fw_name]:
        with open(os.path.join(tmpdir, filename), 'w') as fd:
            fd.write("test")

    async def mock_install(filename, loop):
        return msg
    monkeypatch.setattr(ot2serverlib, '_install', mock_install)
    monkeypatch.setattr(update, '_update_firmware', mock_install)

    app = init(loop)
    cli = await loop.create_task(test_client(app))

    data = {
        'whl': open(os.path.join(tmpdir, whl_name)),
        'serverlib': open(os.path.join(tmpdir, serverlib_name)),
        'fw': open(os.path.join(tmpdir, fw_name))
    }

    # Note: hits API server update endpoint--this test covers backward
    # compatibility until the update server is universally available
    resp = await cli.post(
        '/server/update',
        data=data)

    expected = json.dumps({
        'message': [msg, msg, msg],
        'filename': [whl_name, serverlib_name, fw_name]
    })
    text = await resp.text()
    assert resp.status == 200
    assert text == expected


async def test_feature_flags(
        virtual_smoothie_env, loop, test_client):
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


async def test_ignore_updates(
        virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    # Test no ignore file found
    r0 = await cli.get('/server/update/ignore')
    r0body = await r0.text()
    assert json.loads(r0body) == {'version': None}

    # Test that values are set correctly
    ignore_name = "testy_ignore.json"
    tmpdir = tempfile.mkdtemp("files")
    ignore_update.filepath = os.path.join(tmpdir, ignore_name)

    ignore = {'version': '3.1.3'}
    r1 = await cli.post('server/update/ignore', json=ignore)
    assert r1.status == 200

    # Test that you cannot pass an empty version
    ignore2 = {'version': ''}
    r2 = await cli.post('server/update/ignore', json=ignore2)
    assert r2.status == 400

    # Test that version in the temporary directory is still '3.1.3'
    r3 = await cli.get('/server/update/ignore')
    r3body = await r3.text()
    assert json.loads(r3body) == {'version': '3.1.3'}
