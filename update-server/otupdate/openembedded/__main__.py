"""
Entrypoint for the openembedded update server
"""

import asyncio
import logging
from typing import NoReturn

from server_utils.auth.resource_server.fastapi import (
    build_authorization_checker,
)

from . import get_app
from otupdate.common import cli, constants, name_management, systemd
from otupdate.common.run_application import run_and_notify_up

# The Unix domain socket where opentrons-auth-server is configured to listen,
# on this type of robot.
_AUTH_SERVER_UDS = "/run/opentrons-auth-server.sock"

LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    parser = cli.build_root_parser()
    args = parser.parse_args()

    systemd.configure_logging(getattr(logging, args.log_level.upper()))

    # Because this involves restarting Avahi, this must happen early,
    # before the NameSynchronizer starts up and connects to Avahi.
    LOG.info("Setting static hostname")
    static_hostname = await name_management.set_up_static_hostname()
    LOG.info(f"Set static hostname to {static_hostname}")

    async with (
        build_authorization_checker(
            auth_server_uds=_AUTH_SERVER_UDS, auth_server_url=None
        ) as authorization_checker,
        name_management.NameSynchronizer.start(
            constants.MODEL_OT3
        ) as name_synchronizer,
    ):
        LOG.info("Building openembedded update server")
        app = await get_app(
            name_synchronizer=name_synchronizer,
            authorization_checker=authorization_checker,
            system_version_file=args.version_file,
            config_file_override=args.config_file,
        )

        LOG.info(
            f"Starting openembedded update server on http://{args.host}:{args.port}"
        )
        await run_and_notify_up(app=app, host=args.host, port=args.port)


if __name__ == "__main__":
    asyncio.run(main())
