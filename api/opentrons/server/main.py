#!/usr/bin/env python

import sys
import logging
import os
from aiohttp import web
from opentrons.api import MainRouter
from opentrons.server.rpc import Server
from opentrons.server import endpoints as endp
from opentrons.server.endpoints import (wifi, control, update)
from opentrons.deck_calibration import endpoints as dc_endp
from logging.config import dictConfig

from argparse import ArgumentParser

log = logging.getLogger(__name__)


def log_init():
    """
    Function that sets log levels and format strings. Checks for the
    OT_LOG_LEVEL environment variable otherwise defaults to DEBUG.
    """
    default_log_level = 'INFO'
    ot_log_level = os.environ.get('OT_LOG_LEVEL', default_log_level)
    if ot_log_level not in logging._nameToLevel:
        log.info("OT Log Level {} not found. Defaulting to {}".format(
            ot_log_level, default_log_level))
        ot_log_level = default_log_level

    level_value = logging._nameToLevel[ot_log_level]

    logging_config = dict(
        version=1,
        formatters={
            'basic': {
                'format':
                '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s'  # noqa: E501
            }
        },
        handlers={
            'debug': {
                'class': 'logging.StreamHandler',
                'formatter': 'basic',
            }
        },
        loggers={
            '__main__': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.server': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.api': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.drivers.smoothie_drivers.driver_3_0': {
                'handlers': ['debug'],
                'level': level_value
            }
        }
    )
    dictConfig(logging_config)


# Support for running using aiohttp CLI.
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli  # NOQA
def init(loop=None):
    """
    Builds an application including the RPC server, and also configures HTTP
    routes for methods defined in opentrons.server.endpoints
    """
    server = Server(MainRouter(), loop=loop)

    server.app.router.add_get(
        '/health', endp.health)
    server.app.router.add_get(
        '/wifi/list', wifi.list_networks)
    server.app.router.add_post(
        '/wifi/configure', wifi.configure)
    server.app.router.add_get(
        '/wifi/status', wifi.status)
    server.app.router.add_post(
        '/identify', control.identify)
    server.app.router.add_post(
        '/lights/on', control.turn_on_rail_lights)
    server.app.router.add_post(
        '/lights/off', control.turn_off_rail_lights)
    server.app.router.add_post(
        '/server/update', update.install_api)
    server.app.router.add_post(
        '/server/update_firmware', update.update_firmware)
    server.app.router.add_post(
        '/server/restart', control.restart)
    server.app.router.add_post(
        '/calibration/deck/start', dc_endp.start)
    server.app.router.add_post(
        '/calibration/deck/release', dc_endp.release)
    server.app.router.add_post(
        '/calibration/deck', dc_endp.dispatch)
    server.app.router.add_get(
        '/pipettes', control.get_attached_pipettes)
    server.app.router.add_get(
        '/motors/engaged', control.get_engaged_axes)
    server.app.router.add_post(
        '/motors/disengage', control.disengage_axes)
    server.app.router.add_get(
        '/robot/positions', control.position_info)
    server.app.router.add_post(
        '/robot/move', control.move)

    return server.app


def main():
    """
    This application creates and starts the server for both the RPC routes
    handled by opentrons.server.rpc and HTTP endpoints defined here
    """
    log_init()

    arg_parser = ArgumentParser(
        description="Opentrons application server",
        prog="opentrons.server.main"
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
    args, _ = arg_parser.parse_known_args(sys.argv[1:])

    if args.path:
        log.debug("Starting Opentrons server application on {}".format(
            args.path))
    else:
        log.debug("Starting Opentrons server application on {}:{}".format(
            args.hostname, args.port))
    web.run_app(init(), host=args.hostname, port=args.port, path=args.path)
    arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
