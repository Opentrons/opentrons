import sys
from dataclasses import dataclass
from typing import (
    Dict,
    Set,
    Union,
)

import pytest
from opentrons import APIVersion

from cli import (
    GCodeCLI,
    RunnableConfiguration,
)
from g_code_test_data.g_code_configuration import (
    HTTPGCodeConfirmConfig,
    ProtocolGCodeConfirmConfig,
)
from g_code_test_data.http.modules.magdeck import (
    MAGDECK_CALIBRATE,
    MAGDECK_DEACTIVATE,
    MAGDECK_ENGAGE,
)

from g_code_test_data.http.modules.tempdeck import (
    TEMPDECK_DEACTIVATE,
    TEMPDECK_START_SET_TEMPERATURE,
)

from g_code_test_data.protocol.protocol_configurations import (
    TWO_MODULES,
    TWO_SINGLE_CHANNEL,
    BASIC_SMOOTHIE,
)


@dataclass
class DataForTest:
    config_path: str
    expected_configurations: Set[RunnableConfiguration]


ALL_MAGDECK_CONFIGS = {
    RunnableConfiguration(MAGDECK_CALIBRATE, None),
    RunnableConfiguration(MAGDECK_DEACTIVATE, None),
    RunnableConfiguration(MAGDECK_ENGAGE, None),
}
ALL_TEMPDECK_CONFIGS = {
    RunnableConfiguration(TEMPDECK_DEACTIVATE, None),
    RunnableConfiguration(TEMPDECK_START_SET_TEMPERATURE, None),
}
ALL_MODULE_CONFIGS = ALL_MAGDECK_CONFIGS.union(ALL_TEMPDECK_CONFIGS)

BASIC_SMOOTHIE_212 = RunnableConfiguration(BASIC_SMOOTHIE, APIVersion(2, 12))
BASIC_SMOOTHIE_213 = RunnableConfiguration(BASIC_SMOOTHIE, APIVersion(2, 13))
TWO_MODULES_212 = RunnableConfiguration(TWO_MODULES, APIVersion(2, 12))
TWO_MODULES_213 = RunnableConfiguration(TWO_MODULES, APIVersion(2, 13))
TWO_SINGLE_CHANNEL_212 = RunnableConfiguration(TWO_SINGLE_CHANNEL, APIVersion(2, 12))
TWO_SINGLE_CHANNEL_213 = RunnableConfiguration(TWO_SINGLE_CHANNEL, APIVersion(2, 13))


CONFIGS = [
    DataForTest(
        "http/magdeck_calibrate", {RunnableConfiguration(MAGDECK_CALIBRATE, None)}
    ),
    DataForTest("http/magdeck*", ALL_MAGDECK_CONFIGS),
    DataForTest("http/*", ALL_MODULE_CONFIGS),
    DataForTest("http/", ALL_MODULE_CONFIGS),
    DataForTest("protocols/basic_smoothie/2.13", {BASIC_SMOOTHIE_213}),
    DataForTest(
        "protocols/basic_smoothie/2.*", {BASIC_SMOOTHIE_212, BASIC_SMOOTHIE_213}
    ),
    DataForTest(
        "protocols/basic_smoothie/2*", {BASIC_SMOOTHIE_212, BASIC_SMOOTHIE_213}
    ),
    DataForTest("protocols/basic_smoothie/*", {BASIC_SMOOTHIE_212, BASIC_SMOOTHIE_213}),
    DataForTest("protocols/basic_smoothie/", {BASIC_SMOOTHIE_212, BASIC_SMOOTHIE_213}),
    DataForTest(
        "protocols/*/*",
        {
            BASIC_SMOOTHIE_212,
            BASIC_SMOOTHIE_213,
            TWO_MODULES_212,
            TWO_MODULES_213,
            TWO_SINGLE_CHANNEL_212,
            TWO_SINGLE_CHANNEL_213,
        },
    ),
]
PRETTY_CONFIGS = [pytest.param(config, id=config.config_path) for config in CONFIGS]

MOCK_CONFIGURATIONS_DICT: Dict[
    str, Union[HTTPGCodeConfirmConfig, ProtocolGCodeConfirmConfig]
] = {
    "http/magdeck_calibrate": MAGDECK_CALIBRATE,
    "http/magdeck_deactivate": MAGDECK_DEACTIVATE,
    "http/magdeck_engage": MAGDECK_ENGAGE,
    "http/tempdeck_deactivate": TEMPDECK_DEACTIVATE,
    "http/tempdeck_start_set_temperature": TEMPDECK_START_SET_TEMPERATURE,
    "protocols/2_modules/2.12": TWO_MODULES,
    "protocols/2_modules/2.13": TWO_MODULES,
    "protocols/2_single_channel/2.12": TWO_SINGLE_CHANNEL,
    "protocols/2_single_channel/2.13": TWO_SINGLE_CHANNEL,
    "protocols/basic_smoothie/2.12": BASIC_SMOOTHIE,
    "protocols/basic_smoothie/2.13": BASIC_SMOOTHIE,
}


@pytest.mark.parametrize("config", PRETTY_CONFIGS)
def test_glob(config: DataForTest):
    sys.argv = ["cli.py", "run", config.config_path]
    cli = GCodeCLI()
    cli.configurations = MOCK_CONFIGURATIONS_DICT
    arg_list = []
    for command in cli.get_runnable_commands():
        arg_list.extend(command.args)

    assert set(arg_list) == config.expected_configurations
