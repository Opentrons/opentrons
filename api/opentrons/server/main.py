#!/usr/bin/env python

import sys
import logging
import os
import tempfile
import traceback
import atexit
from aiohttp import web
from opentrons import robot, __version__
from opentrons.api import MainRouter
from opentrons.server.rpc import Server
from opentrons.server import endpoints as endp
from opentrons.server.endpoints import (wifi, control)
from opentrons.config import feature_flags as ff
from opentrons.util import environment
from opentrons.deck_calibration import endpoints as dc_endp
from logging.config import dictConfig
try:
    from ot2serverlib import endpoints
except ModuleNotFoundError:
    print("Module ot2serverlib not found--using fallback implementation")
    from opentrons.server.endpoints import serverlib_fallback as endpoints

from argparse import ArgumentParser

log = logging.getLogger(__name__)
lock_file_path = 'tmp/resin/resin-updates.lock'
if os.environ.get('RUNNING_ON_PI'):
    log_file_path = '/data/user_storage/opentrons_data/logs'
else:
    tmpdir = tempfile.mkdtemp("logs")
    log_file_path = os.path.abspath(tmpdir)


def lock_resin_updates():
    if os.environ.get('RUNNING_ON_PI'):
        import fcntl

        try:
            with open(lock_file_path, 'w') as fd:
                fd.write('a')
                fcntl.flock(fd, fcntl.LOCK_EX)
                fd.close()
        except OSError:
            log.warning('Unable to create resin-update lock file')


def unlock_resin_updates():
    if os.environ.get('RUNNING_ON_PI') and os.path.exists(lock_file_path):
        os.remove(lock_file_path)


def log_init():
    """
    Function that sets log levels and format strings. Checks for the
    OT_LOG_LEVEL environment variable otherwise defaults to DEBUG.
    """
    fallback_log_level = 'INFO'
    ot_log_level = robot.config.log_level
    if ot_log_level not in logging._nameToLevel:
        log.info("OT Log Level {} not found. Defaulting to {}".format(
            ot_log_level, fallback_log_level))
        ot_log_level = fallback_log_level

    level_value = logging._nameToLevel[ot_log_level]

    serial_log_filename = environment.get_path('SERIAL_LOG_FILE')

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
                'level': level_value
            },
            'serial': {
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'basic',
                'filename': serial_log_filename,
                'maxBytes': 5000000,
                'level': logging.DEBUG,
                'backupCount': 3
            }
        },
        loggers={
            '__main__': {
                'handlers': ['debug'],
                'level': logging.INFO
            },
            'opentrons.server': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.api': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.instruments': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.robot.robot_configs': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.drivers.smoothie_drivers.driver_3_0': {
                'handlers': ['debug'],
                'level': level_value
            },
            'opentrons.drivers.serial_communication': {
                'handlers': ['serial'],
                'level': logging.DEBUG
            }
        }
    )
    dictConfig(logging_config)


@web.middleware
async def error_middleware(request, handler):
    try:
        response = await handler(request)
    except web.HTTPNotFound:
        log.exception("Exception handler for request {}".format(request))
        data = {
            'message': 'File was not found at {}'.format(request)
        }
        response = web.json_response(data, status=404)
    except Exception as e:
        log.exception("Exception in handler for request {}".format(request))
        data = {
            'message': 'An unexpected error occured - {}'.format(e),
            'traceback': traceback.format_exc()
        }
        response = web.json_response(data, status=500)

    return response


# Support for running using aiohttp CLI.
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli  # NOQA
def init(loop=None):
    """
    Builds an application including the RPC server, and also configures HTTP
    routes for methods defined in opentrons.server.endpoints
    """
    server = Server(MainRouter(), loop=loop, middlewares=[error_middleware])

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
    server.app.router.add_get(
        '/modules', control.get_attached_modules)
    server.app.router.add_post(
        '/camera/picture', control.take_picture)
    server.app.router.add_post(
        '/server/update', endpoints.update_api)
    server.app.router.add_post(
        '/server/update/firmware', endpoints.update_firmware)
    server.app.router.add_get(
        '/server/update/ignore', endpoints.get_ignore_version)
    server.app.router.add_post(
        '/server/update/ignore', endpoints.set_ignore_version)
    server.app.router.add_static(
        '/logs', log_file_path, show_index=True)
    server.app.router.add_post(
        '/server/restart', endpoints.restart)
    server.app.router.add_post(
        '/calibration/deck/start', dc_endp.start)
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
    server.app.router.add_post(
        '/robot/home', control.home)
    server.app.router.add_get(
        '/robot/lights', control.get_rail_lights)
    server.app.router.add_post(
        '/robot/lights', control.set_rail_lights)
    server.app.router.add_get(
        '/settings', endp.get_advanced_settings)
    server.app.router.add_post(
        '/settings', endp.set_advanced_setting)

    return server.app


def setup_udev_rules_file():
    """
    Copy the udev rules file for Opentrons Modules to opentrons_data directory
    and trigger the new rules.
    This rules file in opentrons_data is symlinked into udev rules directory
    NOTE: This setup can also be run after python package install (which would
    mean that it is performed only once, which might be sufficient)
    instead of running it every time on server boot. Revisit this once the
    redundant api-server-lib setup has been fixed
    """
    import shutil
    import subprocess
    import opentrons

    rules_file = os.path.join(
        os.path.abspath(os.path.dirname(opentrons.__file__)),
        'config', 'modules', '95-opentrons-modules.rules')

    shutil.copy2(
        rules_file,
        '/data/user_storage/opentrons_data/95-opentrons-modules.rules')

    res0 = subprocess.run('udevadm control --reload-rules',
                          shell=True, stdout=subprocess.PIPE).stdout.decode()
    if res0 is not '':
        log.warning(res0.strip())

    res1 = subprocess.run('udevadm trigger',
                          shell=True, stdout=subprocess.PIPE).stdout.decode()
    if res1 is not '':
        log.warning(res1.strip())


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

    try:
        robot.connect()
    except Exception as e:
        log.exception("Error while connecting to motor-driver: {}".format(e))

    log.info("API server version:  {}".format(__version__))
    log.info("Smoothie FW version: {}".format(robot.fw_version))

    if not ff.disable_home_on_boot():
        log.info("Homing Z axes")
        robot.home_z()

    if not os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        setup_udev_rules_file()
    atexit.register(unlock_resin_updates)
    lock_resin_updates()
    web.run_app(init(), host=args.hostname, port=args.port, path=args.path)
    arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
