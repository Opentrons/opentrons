import os
import sys
from mock import patch, MagicMock, PropertyMock

import pytest

from robot_server.service.protocol.contents import Contents
from robot_server.service.protocol.environment import protocol_environment


@pytest.fixture
def mock_contents() -> Contents:
    mock_temp_dir = MagicMock()
    type(mock_temp_dir).name = PropertyMock(return_value="some_path")
    return Contents(protocol_file=None, directory=mock_temp_dir)


@pytest.fixture
def mock_os_chdir():
    with patch.object(os, "chdir") as p:
        yield p


def test_protocol_runner_context(mock_contents, mock_os_chdir):
    cwd = os.getcwd()
    path = sys.path.copy()
    with protocol_environment(mock_contents):
        # We are changing directory to the temp directory
        mock_os_chdir.assert_called_with(mock_contents.directory.name)
        # Adding it to sys.path
        assert mock_contents.directory.name in sys.path

    # Done with context manager. Let's make sure we clean up
    assert mock_contents.directory.name not in sys.path
    assert sys.path == path
    mock_os_chdir.assert_called_with(cwd)
