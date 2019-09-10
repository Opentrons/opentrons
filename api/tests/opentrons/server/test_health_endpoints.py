import json
from opentrons import __version__


async def test_health(virtual_smoothie_env, loop, async_client):

    expected = json.dumps({
        'name': 'opentrons-dev',
        'api_version': __version__,
        'fw_version': 'Virtual Smoothie',
        'logs': ['/logs/serial.log', '/logs/api.log'],
        'system_version': '0.0.0'
    })
    resp = await async_client.get('/health')
    text = await resp.text()
    assert resp.status == 200
    assert text == expected
