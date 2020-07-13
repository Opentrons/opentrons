from unittest.mock import patch
from robot_server.main import run


@patch("robot_server.main.fastapi_run")
def test_fastapi(patch_run):
    """Test that we launch the fastapi based app"""
    run(None, "h", 1234, None)
    patch_run.assert_called_once_with(None, "h", 1234, None)


@patch("robot_server.main.fastapi_run")
def test_use_unix_domain_socket(patch_run):
    run(None, "h", 1234, "hello")
    patch_run.assert_called_once_with(None, None, None, "hello")
