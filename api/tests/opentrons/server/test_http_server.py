import pytest
from aiohttp import web

import opentrons
from opentrons.server import util


async def fake_handler(request):
    version = request.get('requested_version')
    stuff = {'version': version}
    return web.json_response(data=stuff, status=200)


@pytest.fixture
async def fake_server():
    from opentrons.server import version_middleware
    app = web.Application(middlewares=[version_middleware])
    app.router.add_get('/fake_request', fake_handler)
    yield app
    await app.shutdown()


async def test_version_middleware(
        aiohttp_client, fake_server, loop, monkeypatch):
    cli = await loop.create_task(aiohttp_client(fake_server))
    old_header = {'accept': 'application/vnd.opentrons.http+json;version=1'}
    new_header = {'accept': 'application/vnd.opentrons.http+json;version=2'}
    # Test request has new key added
    resp = await cli.get('/fake_request', headers=old_header)
    text = await resp.json()
    assert text['version'] == 1

    # Test determined accept version correct
    resp2 = await cli.get('/fake_request', headers=new_header)
    text = await resp2.json()
    assert text['version'] == 1

    # Test response adds in correct version specified
    monkeypatch.setattr(opentrons.server, 'MAX_VERSION', 2)
    monkeypatch.setattr(
        opentrons.server, 'determine_requested_version', lambda v: 2)
    cli = await loop.create_task(aiohttp_client(fake_server))
    resp = await cli.get('/fake_request')
    text = await resp.json()
    assert text['version'] == 2
    if cli.app.on_shutdown.frozen:
        await cli.close()


async def test_response_header(
        virtual_smoothie_env, async_client, monkeypatch):
    # Test a match and success
    # Test a mismatch and correct handling
    # 1. version higher 2. version lower
    old_header = {'accept': 'application/vnd.opentrons.http+json;version=1'}
    new_header = {'accept': 'application/vnd.opentrons.http+json;version=2'}

    old_return_header = 'vnd.opentrons.api.1'
    new_return_header = 'vnd.opentrons.api.2'
    resp = await async_client.get('/health', headers=old_header)
    assert resp.status == 200
    assert resp.headers['X-Opentrons-Media-Type'] == old_return_header

    resp2 = await async_client.get('/health/2', headers=new_header)
    assert resp2.status == 404
    assert 'X-Opentrons-Media-Type' not in resp2.headers.keys()

    monkeypatch.setattr(opentrons.server, 'MAX_VERSION', 2)
    monkeypatch.setattr(
        opentrons.server, 'determine_requested_version', lambda v: 2)
    resp3 = await async_client.get('/health', headers=new_header)
    assert resp3.status == 200
    assert resp3.headers['X-Opentrons-Media-Type'] == new_return_header


async def test_new_error_msg(async_client):
    resp = await async_client.get('/health/2')
    text = await resp.json()
    expected = {
        'type': 'error',
        'errorId': 2,
        'errorType': 'HTTPNotFound',
        'message': 'Request was not found at <Request GET /health/2 >',
        'supportedHttpApiVersions': util.SUPPORTED_VERSIONS,
        'maxHttpApiVersion': util.MAX_VERSION,
        'links': {}}
    assert text == expected
