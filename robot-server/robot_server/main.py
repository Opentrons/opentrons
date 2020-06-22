import typing
import logging
from pathlib import Path

from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.main import initialize as initialize_api
from robot_server.service import run as fastapi_run

from robot_server.settings import get_settings


log = logging.getLogger(__name__)


def run(hardware: ThreadManager,
        hostname: typing.Optional[str],
        port: typing.Optional[int],
        path: str = None):
    """
    The arguments are not all optional. Either a path or hostname+port should
    be specified; you have to specify one.
    """
    if path:
        log.debug(f"Starting Opentrons application on {path}")
        hostname, port = None, None
    else:
        log.debug(f"Starting Opentrons application on {hostname}:{port}")
        path = None

    fastapi_run(hardware, hostname, port, path)


def main():
    """ The main entrypoint for the Opentrons robot API server stack.

    This function
    - creates and starts the server for both the RPC routes
      handled by :py:mod:`opentrons.server.rpc` and the HTTP routes handled
      by :py:mod:`opentrons.server.http`
    - initializes the hardware interaction handled by either
      :py:mod:`opentrons.legacy_api` or :py:mod:`opentrons.hardware_control`

    This function does not return until the server is brought down.
    """
    app_settings = get_settings()

    if app_settings.simulator_configuration_file_path:
        # A path to a simulation configuration is defined. Let's use it.
        checked_hardware = ThreadManager(
            load_simulator,
            Path(app_settings.simulator_configuration_file_path))
    else:
        # Create the hardware
        checked_hardware = initialize_api(
                hardware_server=app_settings.hardware_server_enable,
                hardware_server_socket=app_settings.hardware_server_socket_path
        )

    run(hardware=checked_hardware,
        hostname=app_settings.ws_host_name,
        port=app_settings.ws_port,
        path=app_settings.ws_domain_socket)


if __name__ == "__main__":
    main()
