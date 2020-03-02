import typing
import logging
from argparse import ArgumentParser

from opentrons.hardware_control import HardwareAPILike
from opentrons.main import initialize as initialize_api
from opentrons.config import feature_flags as ff


log = logging.getLogger(__name__)


def build_arg_parser():
    arg_parser = ArgumentParser(
            description="Opentrons application"
    )
    arg_parser.add_argument(
        "-H", "--hostname",
        help="TCP/IP hostname to serve on (default: %(default)r)",
        default="localhost"
    )
    arg_parser.add_argument(
        "-P", "--port",
        help="TCP/IP port to serve on (default: %(default)r)",
        type=int,
        default="8080"
    )
    arg_parser.add_argument(
        "-U", "--path",
        help="Unix file system path to serve on. Specifying a path will cause "
             "hostname and port arguments to be ignored.",
    )
    arg_parser.add_argument(
        '--hardware-server', action='store_true',
        help="Run a jsonrpc server allowing rpc to the "
             "hardware controller. Only works on buildroot "
             "because extra dependencies are required.")
    arg_parser.add_argument(
        '--hardware-server-socket', action='store',
        default='/var/run/opentrons-hardware.sock',
        help='Override for the hardware server socket')
    return arg_parser


def run(hardware: HardwareAPILike,
        hostname,
        port,
        path: typing.Optional[str] = None):
    """
    The arguments are not all optional. Either a path or hostname+port should
    be specified; you have to specify one.
    """
    if path:
        log.debug("Starting Opentrons application on {}".format(
            path))
        hostname, port = None, None
    else:
        log.debug("Starting Opentrons application on {}:{}".format(
            hostname, port))
        path = None

    if not ff.use_fast_api():
        from opentrons.server import run as aiohttp_run
        aiohttp_run(hardware, hostname, port, path)
    else:
        from robot_server.service import run as fastapi_run
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
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()

    # Create the hardware
    checked_hardware = initialize_api(
            hardware_server=args.hardware_server,
            hardware_server_socket=args.hardware_server_socket
    )

    run(hardware=checked_hardware,
        hostname=args.hostname,
        port=args.port,
        path=args.path)

    arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
