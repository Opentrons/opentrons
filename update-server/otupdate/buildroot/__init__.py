""" update-server implementation for buildroot systems """
import asyncio
import logging
import textwrap
import json
from typing import Any, AsyncGenerator, Mapping, Optional
from aiohttp import web

from otupdate.common import (
    config,
    control,
    ssh_key_management,
    name_management,
    constants,
    update,
    systemd,
)
from . import update_actions


BR_BUILTIN_VERSION_FILE = "/etc/VERSION.json"
#: Location of the builtin system version

LOG = logging.getLogger(__name__)


@web.middleware
async def log_error_middleware(request, handler):
    try:
        resp = await handler(request)
    except Exception:
        LOG.exception(f"Exception serving {request.method} {request.path}")
        raise
    return resp


def get_version(version_file: str) -> Mapping[str, str]:
    LOG.debug(f"Loading version file {version_file}")
    return json.load(open(version_file, "r"))


def get_app(
    system_version_file: Optional[str] = None,
    config_file_override: Optional[str] = None,
    name_override: Optional[str] = None,
    boot_id_override: Optional[str] = None,
    loop: Optional[asyncio.AbstractEventLoop] = None,
) -> web.Application:
    """Build and return the aiohttp.web.Application that runs the server

    The params can be overloaded for testing.
    """
    if not system_version_file:
        system_version_file = BR_BUILTIN_VERSION_FILE

    version = get_version(system_version_file)
    boot_id = boot_id_override or control.get_boot_id()
    config_obj = config.load(config_file_override)

    app = web.Application(middlewares=[log_error_middleware])

    async def _setup_and_cleanup_ctx(
        app: web.Application
    ) -> AsyncGenerator[None, None]:
        # Stuff everything inside here so that:
        # - Getting the order right is more foolproof
        # - We can log it all together

        # FIX BEFORE MERGE: Do name override.

        app[config.CONFIG_VARNAME] = config_obj
        app[constants.RESTART_LOCK_NAME] = asyncio.Lock()
        app[constants.DEVICE_BOOT_ID_NAME] = boot_id

        update_actions.OT2UpdateActions.build_and_insert(app)

        async with name_management.build_and_insert(app):
            name = name_management.NameManager.from_app(app).get_name()
            LOG.info(
                "Setup: "
                + "\n\t".join(
                    [
                        f"Device name: {name}",
                        "Buildroot version:         "
                        f'{version.get("buildroot_version", "unknown")}',
                        "\t(from git sha      " f'{version.get("buildroot_sha", "unknown")}',
                        "API version:               "
                        f'{version.get("opentrons_api_version", "unknown")}',
                        "\t(from git sha      "
                        f'{version.get("opentrons_api_sha", "unknown")}',
                        "Update server version:     "
                        f'{version.get("update_server_version", "unknown")}',
                        "\t(from git sha      "
                        f'{version.get("update_server_sha", "unknown")}',
                        "Smoothie firmware version: TODO",
                    ]
                )
            )

            LOG.info(f"Notifying {systemd.SOURCE} that service is up.")
            systemd.notify_up()

            LOG.info(f"Serving requests.")
            yield
            LOG.info("Running teardown code.")

        LOG.info("Done running teardown code.")

    app.cleanup_ctx.append(_setup_and_cleanup_ctx)

    app.router.add_routes(
        [
            web.get(
                "/server/update/health",
                control.build_health_endpoint(health_response(version_dict=version)),
            ),
            web.post("/server/update/begin", update.begin),
            web.post("/server/update/cancel", update.cancel),
            web.get("/server/update/{session}/status", update.status),
            web.post("/server/update/{session}/file", update.file_upload),
            web.post("/server/update/{session}/commit", update.commit),
            web.post("/server/restart", control.restart),
            web.get("/server/ssh_keys", ssh_key_management.list_keys),
            web.post("/server/ssh_keys", ssh_key_management.add),
            web.delete("/server/ssh_keys", ssh_key_management.clear),
            web.delete("/server/ssh_keys/{key_md5}", ssh_key_management.remove),
            web.post("/server/name", name_management.set_name_endpoint),
            web.get("/server/name", name_management.get_name_endpoint),
        ]
    )
    return app


def health_response(version_dict: Mapping[str, str]) -> Mapping[str, Any]:
    """Create the buildroot specific health response."""
    return {
        "updateServerVersion": version_dict.get("update_server_version", "unknown"),
        "apiServerVersion": version_dict.get("opentrons_api_version", "unknown"),
        "smoothieVersion": "unimplemented",
        "systemVersion": version_dict.get("buildroot_version", "unknown"),
        "capabilities": {
            "buildrootUpdate": "/server/update/begin",
            "restart": "/server/restart",
        },
    }
