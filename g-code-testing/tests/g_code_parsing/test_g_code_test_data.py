from typing import List, Dict

import pytest
import os
import json

from g_code_parsing.errors import ConfigurationNotFoundError
from g_code_parsing.g_code_test_data import GCodeTestFile
from pydantic.error_wrappers import ValidationError

PATH_PREFIX = "/my/fake/path"
CONFIG_1_NAME = "config_1.json"
CONFIG_1_PATH = os.path.join(PATH_PREFIX, CONFIG_1_NAME)
CONFIG_1_DRIVER = "http"

CONFIG_2_NAME = "config_2.json"
CONFIG_2_PATH = os.path.join(PATH_PREFIX, CONFIG_2_NAME)
CONFIG_2_DRIVER = "protocol"


def _get_test_file(dir_path, content):
    file = dir_path / "test_data.json"
    file.write_text(json.dumps(content))
    return file


@pytest.fixture
def seed_data() -> List[Dict[str, str]]:
    return [
        {"name": CONFIG_1_NAME, "path": CONFIG_1_PATH, "driver": CONFIG_1_DRIVER},
        {"name": CONFIG_2_NAME, "path": CONFIG_2_PATH, "driver": CONFIG_2_DRIVER},
    ]


@pytest.fixture
def non_unique_names_seed_data(seed_data) -> GCodeTestFile:
    seed_data[1]["name"] = CONFIG_1_NAME
    return seed_data


@pytest.fixture
def non_unique_paths_seed_data(seed_data) -> GCodeTestFile:
    seed_data[1]["path"] = CONFIG_1_PATH
    return seed_data


def test_from_config_file(tmp_path, seed_data):
    """
    If everything is cleaning up correctly then 2 runs of the same protocol
    should return the same exact G-Code
    """

    test_file = GCodeTestFile.from_config_file(_get_test_file(tmp_path, seed_data))

    config_1 = test_file.configs[0]
    config_2 = test_file.configs[1]

    assert config_1.name == CONFIG_1_NAME
    assert config_1.path == CONFIG_1_PATH
    assert config_1.driver == CONFIG_1_DRIVER

    assert config_2.name == CONFIG_2_NAME
    assert config_2.path == CONFIG_2_PATH
    assert config_2.driver == CONFIG_2_DRIVER


def test_names_must_be_unique(tmp_path, non_unique_names_seed_data):
    with pytest.raises(ValidationError):
        GCodeTestFile.from_config_file(
            _get_test_file(tmp_path, non_unique_names_seed_data)
        )


def test_paths_must_be_unique(tmp_path, non_unique_paths_seed_data):
    with pytest.raises(ValidationError):
        GCodeTestFile.from_config_file(
            _get_test_file(tmp_path, non_unique_paths_seed_data)
        )


def test_get_nonexistent_config(tmp_path, seed_data):
    test_file = GCodeTestFile.from_config_file(_get_test_file(tmp_path, seed_data))
    with pytest.raises(ConfigurationNotFoundError):
        test_file.get_by_name("This for sure does not exist")


def test_get_paths(tmp_path, seed_data):
    test_file = GCodeTestFile.from_config_file(_get_test_file(tmp_path, seed_data))
    expected_paths = sorted([item["path"] for item in seed_data])
    actual_paths = sorted(test_file.paths)

    assert expected_paths == actual_paths
