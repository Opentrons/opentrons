from functools import partial
from g_code_test_data.http.http_settings import HTTP_SETTINGS, S3_BASE
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand


MAGDECK_CALIBRATE = HTTPGCodeConfirmConfig(
    name='magdeck_calibrate',
    s3_path=f"{S3_BASE}/magdeck_calibrate.txt",
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='calibrate'),
        serial=HTTP_SETTINGS.magdeck.serial_number,
    ),
    settings=HTTP_SETTINGS,
)

MAGDECK_DEACTIVATE = HTTPGCodeConfirmConfig(
    name='magdeck_deactivate',
    s3_path=f"{S3_BASE}/magdeck_deactivate.txt",
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='deactivate'),
        serial=HTTP_SETTINGS.magdeck.serial_number,
    ),
    settings=HTTP_SETTINGS,
)

MAGDECK_ENGAGE = HTTPGCodeConfirmConfig(
    name='magdeck_engage',
    s3_path=f"{S3_BASE}/magdeck_engage.txt",
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='engage', args=[5.1]),
        serial=HTTP_SETTINGS.magdeck.serial_number,
    ),
    settings=HTTP_SETTINGS,
)

MAGDECK_CONFIGURATIONS = [
    MAGDECK_CALIBRATE,
    MAGDECK_DEACTIVATE,
    MAGDECK_ENGAGE,
]