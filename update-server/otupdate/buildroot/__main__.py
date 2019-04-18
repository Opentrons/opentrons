"""
Entrypoint for the buildroot update server
"""
import argparse
import asyncio
import logging
import logging.config

from . import (get_app, BR_BUILTIN_VERSION_FILE,
               config, constants, name_management)
from aiohttp import web

LOG = logging.getLogger(__name__)


def configure_logging(level: int):
    config = {
        'version': 1,
        'formatters': {
            'noTime': {
                'format': '%(name)s %(levelname)s %(message)s'
            }
        },
        'handlers': {
            'journald': {
                'class': 'logging.StreamHandler',
                'formatter': 'noTime',
                'level': level,
            },
        },
        'loggers': {
            'aiohttp.access': {
                'handlers': ['journald'],
                'level': logging.ERROR,
                'propagate': False
            },
            'otupdate': {
                'handlers': ['journald'],
                'level': level,
                'propagate': False
            },
        },
        'root': {
            'handlers': ['journald'],
            'level': level
        }
    }
    logging.config.dictConfig(config)


def main():
    parser = argparse.ArgumentParser(
        description='Opentrons update server for buildroot systems')
    parser.add_argument('-p', '--port', dest='port', type=int,
                        help='Port to listen on. Passed to aiohttp')
    parser.add_argument('--host', dest='host', type=str, default='127.0.0.1',
                        help='Host to listen on. Passed to aiohttp')
    parser.add_argument('--version-file', dest='version_file',
                        type=str, default=BR_BUILTIN_VERSION_FILE,
                        help='Version file path if not default')
    parser.add_argument('--log-level', dest='log_level',
                        choices=['debug', 'info', 'warning', 'error'],
                        help='Log level', default='info')
    parser.add_argument('--config-file', dest='config_file',
                        type=str, default=None,
                        help='Config file path. If not specified, falls back '
                        f'to {config.PATH_ENVIRONMENT_VARIABLE} env var and '
                        f'then default path {config.DEFAULT_PATH}')
    args = parser.parse_args()
    loop = asyncio.get_event_loop()
    configure_logging(getattr(logging, args.log_level.upper()))

    LOG.info("Setting hostname")
    hostname = loop.run_until_complete(name_management.setup_hostname())
    LOG.info(f"Set hostname to {hostname}")

    LOG.info(f'Building buildroot update server')
    app = get_app(args.version_file, args.config_file)

    name = app[constants.DEVICE_NAME_VARNAME]
    LOG.info(f"Setting advertised name to {name}")
    loop.run_until_complete(name_management.set_name(name))

    LOG.info(
        f'Starting buildroot update server on http://{args.host}:{args.port}')
    web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
