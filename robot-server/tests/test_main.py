from unittest.mock import patch
from robot_server.main import run
from robot_server.service.app import app


@patch("robot_server.main.uvicorn.run")
def test_use_host_port(patch_run):
    """Test that we launch the app using host and port"""
    run("h", 1234, None)
    patch_run.assert_called_once_with(app,
                                      host="h",
                                      port=1234,
                                      uds=None,
                                      access_log=False)


@patch("robot_server.main.uvicorn.run")
def test_use_unix_domain_socket(patch_run):
    run("h", 1234, "hello")
    patch_run.assert_called_once_with(app,
                                      host=None,
                                      port=None,
                                      uds="hello",
                                      access_log=False)
