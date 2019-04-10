"""
Entrypoint for the buildroot update server
"""
import argparse
import logging

from . import get_app, BR_BUILTIN_VERSION_FILE, config
from aiohttp import web

LOG = logging.getLogger(__name__)


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
    logging.basicConfig(**{
        'level': getattr(logging, args.log_level.upper())
    })
    LOG.info(f'Building buildroot update server')
    app = get_app(args.version_file, args.config_file)
    LOG.info(
        f'Starting buildroot update server on http://{args.host}:{args.port}')
    web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
