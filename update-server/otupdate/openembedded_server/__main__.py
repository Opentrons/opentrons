"""
Entrypoint for the openembedded update server
"""
import logging
import logging.config
# import sys

# from . import get_app
# from aiohttp import web
# from openembedded import (root_fs, oe_server_mode)
LOG = logging.getLogger(__name__)


def _handler_for(topic_name: str,
                 log_level: int):
    return {
        'class': 'logging.StreamHandler',
        'formatter': 'basic',
        'level': log_level,
    }


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
            'openembedded_server': {
                'handlers': ['journald'],
                'level': level,
                'propagate': False
            },
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

    configure_logging(20)
    LOG.info('check logger for OE server')

    # configure_logging(getattr(logging, args.log_level.upper()))
    # oesi = oe_server_mode.OEServerMode()
    # options = oesi.parse_args(sys.argv[1:])
    # args = options
    # rfs = root_fs.RootFS()
    LOG.info('Building buildroot update server')
    # app = get_app(args.version_file, 'testingconfig', None, None, rfs, None)

    # LOG.info(
    #    f'Starting openembedded update server on http://{args.host}:{args.port}')
    # options.func(options)
    # web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
