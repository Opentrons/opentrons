import opentrons.server as server
import logging
from argparse import ArgumentParser

log = logging.getLogger(__name__)


def build_arg_parser():
    arg_parser = ArgumentParser(
        description="Opentrons application server",
        prog="opentrons.server.main",
        add_help=False
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
    return arg_parser


def main():
    arg_parser = build_arg_parser()
    # System 3.0 server startup is:
    # python -m opentrons.server.main -U $OT_SERVER_UNIX_SOCKET_PATH
    # opentrons.server.main:init
    # In which case, we add a mock argument specifically to indicate that
    # this is a system 3.0 init path. This argument otherwise has no meaning
    arg_parser.add_argument(
        'patch_old_init',
        metavar='OLD_STYLE_INIT',
        nargs='?',
        default=None,
        help="The old-style way to initialize the server with a function name."
             " Use to force the system to start with opentrons.main "
             "instead of server.main"
    )
    args = arg_parser.parse_args()

    # If running system 3.0, then redirect to new 3.4 entrypoint
    # in opentrons.main
    if args.patch_old_init is not None:
        import opentrons.main
        opentrons.main.run(**vars(args))
    else:
        server.run(args.hostname, args.port, args.path)
        arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
