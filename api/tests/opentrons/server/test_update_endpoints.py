import os
import json
import tempfile
from aiohttp import web
from opentrons.server.main import init, log_init
from opentrons.server import endpoints


async def test_restart(virtual_smoothie_env, monkeypatch, loop, test_client):
    test_data = {"test": "pass"}

    async def mock_restart(request):
        return web.json_response(test_data)
    monkeypatch.setattr(endpoints, 'restart', mock_restart)

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
    monkeypatch.setattr(endpoints, '_install', mock_install)

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
