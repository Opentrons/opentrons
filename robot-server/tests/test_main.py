from unittest.mock import patch
from robot_server.main import run


@patch("robot_server.main.ff")
@patch("opentrons.server.run")
def test_aiohttp(patch_run, patch_ff):
    """Test that we launch the opentrons aiohttp app"""
    patch_ff.use_fast_api.return_value = False
    run(None, "h", 1234, None)
    patch_run.assert_called_once_with(None, "h", 1234, None)


@patch("robot_server.main.ff")
@patch("robot_server.service.run")
def test_fastapi(patch_run, patch_ff):
    """Test that we launch the fastapi based app"""
    patch_ff.use_fast_api.return_value = True
    run(None, "h", 1234, None)
    patch_run.assert_called_once_with(None, "h", 1234, None)


@patch("robot_server.main.ff")
@patch("opentrons.server.run")
def test_use_unix_domain_socket(patch_run, patch_ff):
    patch_ff.use_fast_api.return_value = False
    run(None, "h", 1234, "hello")
    patch_run.assert_called_once_with(None, None, None, "hello")
