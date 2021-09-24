"""
Entrypoint for the openembedded update server
"""
import argparse
import logging
import logging.config
from otupdate.openembedded_server import get_app
from aiohttp import web
LOG = logging.getLogger(__name__)


def _handler_for(topic_name: str,
                 log_level: int):
    return {
        'class': 'logging.StreamHandler',
        'formatter': 'basic',
        'level': log_level,
    }


def main():
    parser = argparse.ArgumentParser(
        description='Opentrons update server for buildroot systems')
    parser.add_argument('-p', '--port', dest='port', type=int,
                        help='Port to listen on. Passed to aiohttp')
    parser.add_argument('--host', dest='host', type=str, default='127.0.0.1',
                        help='Host to listen on. Passed to aiohttp')
    parser.add_argument('--version-file', dest='version_file',
                        type=str, default='BR_BUILTIN_VERSION_FILE',
                        help='Version file path if not default')
    parser.add_argument('--log-level', dest='log_level',
                        choices=['debug', 'info', 'warning', 'error'],
                        help='Log level', default='info')
    parser.add_argument('--config-file', dest='config_file',
                        type=str, default=None,
                        help='Config file path. If not specified, falls back '
                        )
    args = parser.parse_args()

    LOG.info('check logger for OE server')

    LOG.info('Building buildroot update server')
    app = get_app(args.version_file, 'testingconfig', None, None, None)

    LOG.info(
       f'Starting openembedded update server on http://{args.host}:{args.port}')
    web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
