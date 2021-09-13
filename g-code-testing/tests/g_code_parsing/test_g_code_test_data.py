from typing import List, Union

import pytest
import os
import json

from g_code_parsing.errors import ConfigurationNotFoundError
from g_code_parsing.g_code_test_data import (
    GCodeTestFile,
    HTTPTestData,
    ProtocolTestData,
)
from pydantic.error_wrappers import ValidationError


def hello_world():
    return "Hello World"


CONFIG_1_NAME = "config_1"
CONFIG_1_EXECUTABLE = hello_world

CONFIG_2_NAME = "config_2"
CONFIG_2_PATH = os.path.join("/my/fake/path", CONFIG_2_NAME)


def _get_test_file(dir_path, content):
    file = dir_path / "test_data.json"
    file.write_text(json.dumps(content))
    return file


@pytest.fixture
def seed_data() -> List[Union[ProtocolTestData, HTTPTestData]]:
    return [
        HTTPTestData(name=CONFIG_1_NAME, executable=CONFIG_1_EXECUTABLE),
        ProtocolTestData(name=CONFIG_2_NAME, path=CONFIG_2_PATH),
    ]


@pytest.fixture
def non_unique_names_seed_data(
    seed_data,
) -> List[Union[ProtocolTestData, HTTPTestData]]:
    seed_data[1].name = CONFIG_1_NAME
    return seed_data


def test_from_config_file(seed_data):
    """
    If everything is cleaning up correctly then 2 runs of the same protocol
    should return the same exact G-Code
    """

    test_file = GCodeTestFile(configs=seed_data)

    config_1 = test_file.configs[0]
    config_2 = test_file.configs[1]

    assert config_1.name == CONFIG_1_NAME
    assert config_1.executable == CONFIG_1_EXECUTABLE  # type: ignore
    assert isinstance(config_1, HTTPTestData)

    assert config_2.name == CONFIG_2_NAME
    assert config_2.path == CONFIG_2_PATH  # type: ignore
    assert isinstance(config_2, ProtocolTestData)


def test_names_must_be_unique(non_unique_names_seed_data):
    with pytest.raises(ValidationError):
        GCodeTestFile(configs=non_unique_names_seed_data)


def test_get_nonexistent_config(seed_data):
    test_file = GCodeTestFile(configs=seed_data)
    with pytest.raises(ConfigurationNotFoundError):
        test_file.get_by_name("This for sure does not exist")
