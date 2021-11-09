from functools import partial
from g_code_test_data.http.http_settings import HTTP_SETTINGS, S3_BASE
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.tempdeck import SERIAL as SERIAL_NUM

TEMPDECK_DEACTIVATE = HTTPGCodeConfirmConfig(
    name='tempdeck_deactivate',
    s3_path=f"{S3_BASE}/tempdeck_deactivate.txt",
    executable=partial(
        post_serial_command,
        command=SerialCommand(command_type='deactivate'),
        serial=SERIAL_NUM,
    ),
    settings=HTTP_SETTINGS,
)

TEMPDECK_SET_TEMPERATURE = HTTPGCodeConfirmConfig(
    name='tempdeck_set_temperature',
    s3_path=f"{S3_BASE}/tempdeck_set_temperature.txt",
    executable=partial(
        post_serial_command,
        # Keep the args at a low value because the temp starts and 0.0 and only
        # changes 0.25 degrees every second
        command=SerialCommand(command_type='set_temperature', args=[2.0]),
        serial=SERIAL_NUM,
    ),
    settings=HTTP_SETTINGS,
)

TEMPDECK_START_SET_TEMPERATURE = HTTPGCodeConfirmConfig(
    name='tempdeck_start_set_temperature',
    s3_path=f"{S3_BASE}/tempdeck_start_set_temperature.txt",
    executable=partial(
        post_serial_command,
        # This function does not wait on the tempdeck to finish coming to temp
        # so no need to set to a low value
        command=SerialCommand(command_type='start_set_temperature', args=[40.0]),
        serial=SERIAL_NUM,
    ),
    settings=HTTP_SETTINGS,
)

TEMPDECK_CONFIGURATIONS = [
    TEMPDECK_DEACTIVATE,
    TEMPDECK_SET_TEMPERATURE,
    TEMPDECK_START_SET_TEMPERATURE,
]