"""
Entrypoint for the openembedded update server
"""

import asyncio
import logging
import sys
import traceback
from logging.config import dictConfig

from server_utils.audit.fastapi import (
    build_audit_client,
)
from server_utils.auth.resource_server.fastapi import (
    build_authentication_checker,
)
from server_utils.logging_utils import get_dict_config

from . import get_app
from otupdate.common import cli, constants, name_management
from otupdate.common.run_application import run_and_notify_up

# The Unix domain socket where opentrons-auth-server is configured to listen,
# on this type of robot. Used unless the command line overrides it.
_DEFAULT_AUTH_SERVER_UDS = "/run/opentrons-auth-server.sock"

# The Unix domain socket where opentrons-audit-server is configured to listen,
# on this type of robot. Used unless the command line overrides it.
_DEFAULT_AUDIT_SERVER_UDS = "/run/opentrons-audit-server.sock"

LOG = logging.getLogger(__name__)


async def main() -> None:
    parser = cli.build_root_parser()
    args = parser.parse_args()

    try:
        log_config = get_dict_config(args.log_level.upper(), "opentrons-update")
        dictConfig(log_config)
    except Exception as e:
        # needs to be a print because logging doesn't work yet!
        print("Error: Couldn't configure logging!", file=sys.stderr)  # noqa: T201
        traceback.print_exception(e, file=sys.stderr)

    auth_server_uds = args.auth_server_uds
    auth_server_url = args.auth_server_url
    if auth_server_uds is None and auth_server_url is None:
        auth_server_uds = _DEFAULT_AUTH_SERVER_UDS

    audit_server_uds = args.audit_server_uds
    audit_server_url = args.audit_server_url
    if audit_server_uds is None and audit_server_url is None:
        audit_server_uds = _DEFAULT_AUDIT_SERVER_UDS

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
        build_audit_client(
            audit_server_uds=audit_server_uds, audit_server_url=audit_server_url
        ) as audit_client,
    ):
        LOG.info("Building openembedded update server")
        app = await get_app(
            name_synchronizer=name_synchronizer,
            authentication_checker=authentication_checker,
            system_version_file=args.version_file,
            config_file_override=args.config_file,
            audit_client=audit_client,
        )

        LOG.info(
            f"Starting openembedded update server on http://{args.host}:{args.port}"
        )
        await run_and_notify_up(app=app, host=args.host, port=args.port)


if __name__ == "__main__":
    asyncio.run(main())
