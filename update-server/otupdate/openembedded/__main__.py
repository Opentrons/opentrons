"""
Entrypoint for the openembedded update server
"""

import asyncio
import logging

from server_utils.auth.resource_server.fastapi import (
    build_authentication_checker,
)

from . import get_app
from otupdate.common import cli, constants, name_management, systemd
from otupdate.common.run_application import run_and_notify_up

# The Unix domain socket where opentrons-auth-server is configured to listen,
# on this type of robot. Used unless the command line overrides it.
_DEFAULT_AUTH_SERVER_UDS = "/run/opentrons-auth-server.sock"

LOG = logging.getLogger(__name__)


async def main() -> None:
    parser = cli.build_root_parser()
    args = parser.parse_args()

    systemd.configure_logging(getattr(logging, args.log_level.upper()))

    auth_server_uds = args.auth_server_uds
    auth_server_url = args.auth_server_url
    if auth_server_uds is None and auth_server_url is None:
        auth_server_uds = _DEFAULT_AUTH_SERVER_UDS

    # Because this involves restarting Avahi, this must happen early,
    # before the NameSynchronizer starts up and connects to Avahi.
    LOG.info("Setting static hostname")
    static_hostname = await name_management.set_up_static_hostname()
    LOG.info(f"Set static hostname to {static_hostname}")

    async with (
        build_authentication_checker(
            auth_server_uds=auth_server_uds,
            auth_server_url=auth_server_url,
        ) as authentication_checker,
        name_management.NameSynchronizer.start(
            constants.MODEL_OT3
        ) as name_synchronizer,
    ):
        LOG.info("Building openembedded update server")
        app = await get_app(
            name_synchronizer=name_synchronizer,
            authentication_checker=authentication_checker,
            system_version_file=args.version_file,
            config_file_override=args.config_file,
        )

        LOG.info(
            f"Starting openembedded update server on http://{args.host}:{args.port}"
        )
        await run_and_notify_up(app=app, host=args.host, port=args.port)


if __name__ == "__main__":
    asyncio.run(main())
