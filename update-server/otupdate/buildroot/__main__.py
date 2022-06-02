"""
Entrypoint for the buildroot update server
"""
import asyncio
import logging

from . import get_app

from otupdate.common import name_management, cli, systemd
from aiohttp import web

LOG = logging.getLogger(__name__)


def main() -> None:
    parser = cli.build_root_parser()
    args = parser.parse_args()
    loop = asyncio.get_event_loop()
    systemd.configure_logging(getattr(logging, args.log_level.upper()))

    # Because this involves restarting Avahi, this must happen early,
    # before the NameSynchronizer starts up and connects to Avahi.
    LOG.info("Setting static hostname")
    static_hostname = loop.run_until_complete(name_management.set_up_static_hostname())
    LOG.info(f"Set static hostname to {static_hostname}")

    LOG.info("Building buildroot update server")
    app = get_app(args.version_file, args.config_file)

    LOG.info(f"Notifying {systemd.SOURCE} that service is up")
    systemd.notify_up()

    LOG.info(f"Starting buildroot update server on http://{args.host}:{args.port}")
    web.run_app(app, host=args.host, port=args.port)  # type: ignore[no-untyped-call]


if __name__ == "__main__":
    main()
