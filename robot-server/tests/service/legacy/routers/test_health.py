from unittest.mock import Mock

from opentrons import __version__
from opentrons.protocol_api import MAX_SUPPORTED_VERSION

from opentrons.hardware_control.util import DeckTransformState


def test_health(api_client, hardware):
    hardware.fw_version = "FW111"
    hardware.board_revision = "BR2.1"

    hardware.validate_calibration = \
        Mock(return_value=DeckTransformState.IDENTITY)
    expected = {
        'name': 'opentrons-dev',
        'api_version': __version__,
        'fw_version': 'FW111',
        'board_revision': 'BR2.1',
        'logs': ['/logs/serial.log', '/logs/api.log'],
        'system_version': '0.0.0',
        'protocol_api_version': list(MAX_SUPPORTED_VERSION),
        'calibration': "IDENTITY",
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
