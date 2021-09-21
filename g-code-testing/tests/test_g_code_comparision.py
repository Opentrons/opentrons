import pytest
from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_test_data.g_code_configuration import ProtocolGCodeConfirmConfig
from g_code_test_data.protocol.protocol_configurations import PROTOCOL_CONFIGURATIONS
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from g_code_test_data.http.http_configurations import HTTP_CONFIGURATIONS


@pytest.mark.parametrize(
    "g_code_configuration",
    [conf.generate_pytest_param() for conf in HTTP_CONFIGURATIONS],
)
def test_http(g_code_configuration: HTTPGCodeConfirmConfig):
    print(PROTOCOL_CONFIGURATIONS)
    expected_output = g_code_configuration.get_master_file()
    actual_output = g_code_configuration.execute()

    assert actual_output == expected_output, GCodeDiffer(
        actual_output, expected_output
    ).get_html_diff()


@pytest.mark.parametrize(
    "g_code_configuration",
    [conf.generate_pytest_param() for conf in PROTOCOL_CONFIGURATIONS],
)
def test_protocols(g_code_configuration: ProtocolGCodeConfirmConfig):

    actual_output = g_code_configuration.execute()
    expected_output = g_code_configuration.get_master_file()
    assert actual_output == expected_output, GCodeDiffer(
        actual_output, expected_output
    ).get_html_diff()
