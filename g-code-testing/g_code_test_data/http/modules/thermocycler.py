from functools import partial
from g_code_test_data.http.http_settings import HTTP_SETTINGS
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from robot_server.service.legacy.routers.modules import post_serial_command
from robot_server.service.legacy.models.modules import SerialCommand
from opentrons.hardware_control.emulation.thermocycler import SERIAL as SERIAL_NUM


THERMOCYCLER_CLOSE = HTTPGCodeConfirmConfig(
        name='thermocycler_close',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='close'),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_OPEN = HTTPGCodeConfirmConfig(
        name='thermocycler_open',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='open'),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_DEACTIVATE = HTTPGCodeConfirmConfig(
        name='thermocycler_deactivate',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='deactivate'),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_DEACTIVATE_BLOCK = HTTPGCodeConfirmConfig(
        name='thermocycler_deactivate_block',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='deactivate_block'),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_DEACTIVATE_LID = HTTPGCodeConfirmConfig(
        name='thermocycler_deactivate_lid',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='deactivate_lid'),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_CYCLE_TEMPERATURES = HTTPGCodeConfirmConfig(
        name='thermocycler_cycle_temperatures',
        executable=partial(
            post_serial_command,
            command=SerialCommand(
                command_type='cycle_temperatures', args=[
                    [{'temperature': 1.0}, {'temperature': 2.0}, {'temperature': 1.0}]
                    , 1
                ]
            ),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_SET_LID_TEMPERATURE = HTTPGCodeConfirmConfig(
        name='thermocycler_set_lid_temperature',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='set_lid_temperature', args=[37.0]),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_SET_TEMPERATURE = HTTPGCodeConfirmConfig(
        name='thermocycler_set_temperature',
        executable=partial(
            post_serial_command,
            command=SerialCommand(command_type='set_temperature', args=[1.0]),
            serial=SERIAL_NUM,
        ),
        settings=HTTP_SETTINGS,
    )

THERMOCYCLER_CONFIGURATIONS = [
    THERMOCYCLER_CLOSE.generate_pytest_param(),
    THERMOCYCLER_OPEN.generate_pytest_param(),
    THERMOCYCLER_DEACTIVATE.generate_pytest_param(),
    THERMOCYCLER_DEACTIVATE_BLOCK.generate_pytest_param(),
    THERMOCYCLER_DEACTIVATE_LID.generate_pytest_param(),
    THERMOCYCLER_CYCLE_TEMPERATURES.generate_pytest_param(),
    THERMOCYCLER_SET_LID_TEMPERATURE.generate_pytest_param(),
    THERMOCYCLER_SET_TEMPERATURE.generate_pytest_param(),
]