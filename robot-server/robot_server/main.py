import logging
import typing

import uvicorn  # type: ignore

from robot_server.settings import get_settings

log = logging.getLogger(__name__)


def run(hostname: typing.Optional[str],
        port: typing.Optional[int],
        path: typing.Optional[str]):
    """Start the uvicorn service."""
    if path:
        log.debug(f"Starting Opentrons application on {path}")
        hostname, port = None, None
    else:
        log.debug(f"Starting Opentrons application on {hostname}:{port}")
        path = None

    from robot_server.service.app import app
    uvicorn.run(app, host=hostname, port=port, uds=path, access_log=False)


def main():
    """ The main entrypoint for the Opentrons robot API server stack.

    This function does not return until the server is brought down.
    """

    # TODO Amit 7/14/2020
    #  Now that aiohttp is goine, we can start the robot-server using uvicorn
    #  command line.
    #  This function is just here for backwards compatibility.

    app_settings = get_settings()

    run(hostname=app_settings.ws_host_name,
        port=app_settings.ws_port,
        path=app_settings.ws_domain_socket)


if __name__ == "__main__":
    main()
