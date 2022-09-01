import pytest
from opentrons import APIVersion

from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_test_data.g_code_configuration import ProtocolGCodeConfirmConfig
from g_code_test_data.protocol.protocol_configurations import PROTOCOL_CONFIGURATIONS
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from g_code_test_data.http.http_configurations import HTTP_CONFIGURATIONS


@pytest.mark.parametrize(
    "g_code_configuration",
    [
        pytest.param(conf, marks=conf.marks, id=f"test_{conf.name}")
        for conf in HTTP_CONFIGURATIONS
    ],
)
def test_http(g_code_configuration: HTTPGCodeConfirmConfig):
    expected_output = g_code_configuration.get_comparison_file()
    actual_output = g_code_configuration.execute()
    assert actual_output == expected_output, GCodeDiffer(
        actual_output, expected_output
    ).get_html_diff()


@pytest.mark.parametrize(
    "g_code_configuration,version",
    [
        pytest.param(
            conf,
            version,
            marks=conf.marks,
            id=f"test_{conf.name}_api_version_{version}",
        )
        for conf in PROTOCOL_CONFIGURATIONS
        for version in conf.versions
    ],
)
def test_protocols(
    g_code_configuration: ProtocolGCodeConfirmConfig, version: APIVersion
):
    expected_output = g_code_configuration.get_comparison_file(version)
    actual_output = g_code_configuration.execute(version)
    assert actual_output == expected_output, GCodeDiffer(
        actual_output, expected_output
    ).get_html_diff()
