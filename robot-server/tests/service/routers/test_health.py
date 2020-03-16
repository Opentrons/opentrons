from opentrons import __version__
from opentrons.protocol_api import MAX_SUPPORTED_VERSION


def test_health(api_client, hardware):
    hardware.fw_version = "FW111"

    expected = {
        'name': 'opentrons-dev',
        'api_version': __version__,
        'fw_version': 'FW111',
        'logs': ['/logs/serial.log', '/logs/api.log'],
        'system_version': '0.0.0',
        'protocol_api_version': list(MAX_SUPPORTED_VERSION),
        "links": {
            "apiLog": "/logs/api.log",
            "serialLog": "/logs/serial.log",
            "apiSpec": "/openapi.json"
        }
    }
    resp = api_client.get('/health')
    text = resp.json()
    assert resp.status_code == 200
    assert text == expected
