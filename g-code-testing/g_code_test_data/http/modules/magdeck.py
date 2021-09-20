from functools import partial
from g_code_test_data.http.http_settings import HTTP_SETTINGS
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.magdeck import SERIAL as SERIAL_NUM

MAGDECK_CALIBRATE = HTTPGCodeConfirmConfig(
    name='magdeck_calibrate',
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='calibrate'),
        serial=SERIAL_NUM,
    ),
    settings=HTTP_SETTINGS,
)

MAGDECK_DEACTIVATE = HTTPGCodeConfirmConfig(
    name='magdeck_deactivate',
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='deactivate'),
        serial=SERIAL_NUM,
    ),
    settings=HTTP_SETTINGS,
)

MAGDECK_ENGAGE = HTTPGCodeConfirmConfig(
    name='magdeck_engage',
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='engage', args=[5.1]),
        serial=SERIAL_NUM,
    ),
    settings=HTTP_SETTINGS,
)

MAGDECK_CONFIGURATIONS = [
    MAGDECK_CALIBRATE.generate_pytest_param(),
    MAGDECK_DEACTIVATE.generate_pytest_param(),
    MAGDECK_ENGAGE.generate_pytest_param(),
]