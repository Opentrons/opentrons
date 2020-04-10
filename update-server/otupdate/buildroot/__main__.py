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

try:
    # systemd journal is available, we can use its handler
    import systemd.journal  # noqa(F401)
    import systemd.daemon

    def _handler_for(topic_name: str,
                     log_level: int):
        return {'class': 'systemd.journal.JournalHandler',
                'formatter': 'message_only',
                'level': log_level,
                'SYSLOG_IDENTIFIER': topic_name}

    # By using sd_notify
    # (https://www.freedesktop.org/software/systemd/man/sd_notify.html)
    # and type=notify in the unit file, we can prevent systemd from starting
    # dependent services until we actually say we're ready. By calling this
    # after we change the hostname, we make anything with an After= on us
    # be guaranteed to see the correct hostname
    def _notify_up():
        systemd.daemon.notify("READY=1")

except ImportError:
    # systemd journal isn't available, probably running tests

    def _handler_for(topic_name: str,
                     log_level: int):
        return {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
            'level': log_level,
        }

    def _notify_up():
        LOG.info("systemd couldn't be imported (host? test?), not notifying")


def configure_logging(level: int):
    config = {
        'version': 1,
        'formatters': {
            'basic': {
                'format': '%(name)s %(levelname)s %(message)s'
            },
            'message_only': {
                'format': '%(message)s'
            },
        },
        'handlers': {
            'journald': _handler_for('opentrons-update', level)
        },
        'loggers': {
            'otupdate': {
                'handlers': ['journald'],
                'level': level,
                'propagate': False
            },
            '__main__': {
                'handlers': ['journald'],
                'level': level,
                'propagate': False,
            }
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

    LOG.info('Building buildroot update server')
    app = get_app(args.version_file, args.config_file)

    name = app[constants.DEVICE_NAME_VARNAME]
    LOG.info(f"Setting advertised name to {name}")
    loop.run_until_complete(name_management.set_name(name))

    LOG.info('Notifying systemd')
    _notify_up()

    LOG.info(
        f'Starting buildroot update server on http://{args.host}:{args.port}')
    web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
