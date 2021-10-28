"""
Entrypoint for the openembedded update server
"""
import asyncio
import logging
import logging.config
from . import get_app
from otupdate.common import name_management, cli, systemd
from aiohttp import web
LOG = logging.getLogger(__name__)



def main():
    parser = cli.build_root_parser()
    args = parser.parse_args()
    loop = asyncio.get_event_loop()

    systemd.configure_logging(getattr(logging, args.log_level.upper()))

    LOG.info("Setting hostname")
    hostname = loop.run_until_complete(name_management.setup_hostname())
    LOG.info(f"Set hostname to {hostname}")

    LOG.info('Building openembedded update server')
    app = get_app(args.version_file, args.config_file)

    systemd.notify_up()

    LOG.info(
       f'Starting openembedded update server on http://{args.host}:{args.port}')
    web.run_app(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
