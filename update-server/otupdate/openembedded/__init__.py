""" update-server implementation for openembedded systems """
import asyncio
import logging

from aiohttp import web
from typing import Optional, Mapping, Any

from otupdate.common import (
    config,
    constants,
    control,
    name_management,
    ssh_key_management,
    update,
)

from otupdate.openembedded.update_actions import (
    RootFSInterface,
    PartitionManager,
    OT3UpdateActions,
)
from otupdate.common.file_actions import load_version_file
from otupdate.common.update_actions import FILE_ACTIONS_VARNAME

OE_BUILTIN_VERSION_FILE = "/etc/VERSION.json"


LOG = logging.getLogger(__name__)


@web.middleware
async def log_error_middleware(request, handler):
    try:
        resp = await handler(request)
    except Exception:
        LOG.exception(f"Exception serving {request.method} {request.path}")
        raise
    return resp


async def get_app(
    name_synchronizer: name_management.NameSynchronizer,
    system_version_file: Optional[str] = None,
    config_file_override: Optional[str] = None,
    name_override: Optional[str] = None,
    boot_id_override: Optional[str] = None,
) -> web.Application:
    """Build and return the aiohttp.web.Application that runs the server"""
    if not system_version_file:
        system_version_file = OE_BUILTIN_VERSION_FILE

    version = load_version_file(system_version_file)
    boot_id = boot_id_override or control.get_boot_id()
    config_obj = config.load(config_file_override)

    app = web.Application(middlewares=[log_error_middleware])

    app[config.CONFIG_VARNAME] = config_obj
    app[constants.RESTART_LOCK_NAME] = asyncio.Lock()
    app[constants.DEVICE_BOOT_ID_NAME] = boot_id

    rfs = RootFSInterface()
    part_mgr = PartitionManager()
    updater = OT3UpdateActions(rfs, part_mgr)
    app[FILE_ACTIONS_VARNAME] = updater

    name_management.install_name_synchronizer(name_synchronizer, app)

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
            web.post("/server/ssh_keys/from_local", ssh_key_management.add_from_local),
            web.delete("/server/ssh_keys", ssh_key_management.clear),
            web.delete("/server/ssh_keys/{key_md5}", ssh_key_management.remove),
            web.post("/server/name", name_management.set_name_endpoint),
            web.get("/server/name", name_management.get_name_endpoint),
        ]
    )

    LOG.info(
        "Setup: "
        + "\n\t".join(
            [
                f"Device name: {await name_synchronizer.get_name()}",
                "Openembedded version:         "
                f'{version.get("openembedded_version", "unknown")}',
                "\t(from git sha      " f'{version.get("buildroot_sha", "unknown")}',
                "API version:               "
                f'{version.get("opentrons_api_version", "unknown")}',
                "\t(from git sha      "
                f'{version.get("opentrons_api_sha", "unknown")}',
                "Update server version:     "
                f'{version.get("update_server_version", "unknown")}',
                "\t(from git sha      "
                f'{version.get("update_server_sha", "unknown")}',
            ]
        )
    )

    return app


def health_response(version_dict: Mapping[str, str]) -> Mapping[str, Any]:
    """Create the openembedded specific health response."""
    return {
        "updateServerVersion": version_dict.get("update_server_version", "unknown"),
        "apiServerVersion": version_dict.get("opentrons_api_version", "unknown"),
        "systemVersion": version_dict.get("openembedded_version", "unknown"),
        "capabilities": {
            "systemUpdate": "/server/update/begin",
            "restart": "/server/restart",
        },
        "robotModel": constants.MODEL_OT3,
    }
