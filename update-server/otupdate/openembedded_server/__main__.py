"""
Entrypoint for the openembedded update server
"""
import logging
import logging.config
import sys

from . import get_app
from aiohttp import web
from openembedded import (root_fs, oe_server_mode)
LOG = logging.getLogger(__name__)

try:
    # systemd journal is available, we can use its handler
    import systemd.journal
    import systemd.daemon
# whats this _handler_for and _notify_up being defined here for, (function definition)

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

# look into logging module to figure out this crap


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
        'root': {
            'handlers': ['journald'],
            'level': level
        }
    }
    LOG.debug(config)


def main():

    oesi = oe_server_mode.OEServerMode()
    options = oesi.parse_args(sys.argv[1:])
    args = options
    configure_logging(getattr(logging, args.log_level.upper()))
    rfs = root_fs.RootFS()
    LOG.info('Building buildroot update server')
    app = get_app(args.version_file, 'testingconfig', None, None, rfs, None)

    LOG.info('Notifying systemd')
    _notify_up()

    LOG.info(
        f'Starting openembedded update server on http://{args.host}:{args.port}')
    options.func(options)
    web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
