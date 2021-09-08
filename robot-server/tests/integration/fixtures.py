from opentrons.protocol_api import MAX_SUPPORTED_VERSION, MIN_SUPPORTED_VERSION
from opentrons import __version__, config

minimum_version = list(MIN_SUPPORTED_VERSION)
maximum_version = list(MAX_SUPPORTED_VERSION)


def check_health_response(response):
    expected = {
        "name": "opentrons-dev",
        "api_version": __version__,
        "fw_version": "Virtual Smoothie",
        "board_revision": "2.1",
        "logs": ["/logs/serial.log", "/logs/api.log", "/logs/server.log"],
        "system_version": config.OT_SYSTEM_VERSION,
        "minimum_protocol_api_version": minimum_version,
        "maximum_protocol_api_version": maximum_version,
        "links": {
            "apiLog": "/logs/api.log",
            "serialLog": "/logs/serial.log",
            "apiSpec": "/openapi.json",
            "systemTime": "/system/time",
            "serverLog": "/logs/server.log",
        },
    }

    assert response.json() == expected
