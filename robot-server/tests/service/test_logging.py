from unittest.mock import patch, MagicMock
import logging
import pytest
from robot_server.service import logging as rs_logging


@pytest.fixture
def mock_robot_config():
    with patch("robot_server.service.logging.robot_configs") as m:
        mock = MagicMock(spec=rs_logging.robot_configs.robot_config)
        m.load.return_value = mock
        yield mock


@pytest.fixture
def mock_dict_config():
    with patch("robot_server.service.logging.dictConfig") as m:
        yield m


@pytest.mark.parametrize(
    argnames=["is_robot", "level_str", "expected_dict_conf"],
    argvalues=[
        [False, "debug", rs_logging._dev_log_config(logging.DEBUG)],
        [False, "booboo", rs_logging._dev_log_config(logging.INFO)],
        [True, "ERROR", rs_logging._robot_log_config(logging.ERROR)],
        [True, "booboo", rs_logging._robot_log_config(logging.INFO)],
    ]
)
def test_logging(mock_robot_config, mock_dict_config,
                 is_robot, level_str, expected_dict_conf):
    mock_robot_config.log_level = level_str
    with patch("robot_server.service.logging.IS_ROBOT", new=is_robot):
        rs_logging.initialize_logging()

        mock_dict_config.assert_called_once_with(expected_dict_conf)
