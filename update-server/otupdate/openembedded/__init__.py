"""update-server implementation for openembedded systems"""

import logging
from typing import Any, Mapping, Optional

from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from server_utils.auth.resource_server.authentication_checker import (
    AuthenticationChecker,
)
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    handle_authorization_error,
    install_authentication_checker,
)

from otupdate._version import version as package_version
from otupdate.common import (
    config,
    constants,
    control,
    name_management,
    ssh_key_management,
    update,
    update_actions,
)
from otupdate.common.api_error import APIError, handle_api_error
from otupdate.common.file_actions import load_version_file
from otupdate.openembedded.update_actions import (
    OT3UpdateActions,
    PartitionManager,
    RootFSInterface,
)

OE_BUILTIN_VERSION_FILE = "/etc/VERSION.json"

_REDOC_CDN_URL = "https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"


LOG = logging.getLogger(__name__)


class LogErrorMiddleware:
    """Log a traceback for any exception that escapes a request handler.

    This is raw ASGI rather than a Starlette `BaseHTTPMiddleware` so that it
    doesn't interpose on the request body stream, which system update uploads
    read incrementally.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except Exception:
            LOG.exception(f"Exception serving {scope['method']} {scope['path']}")
            raise


async def get_app(
    name_synchronizer: name_management.NameSynchronizer,
    authentication_checker: AuthenticationChecker,
    system_version_file: Optional[str] = None,
    config_file_override: Optional[str] = None,
    name_override: Optional[str] = None,
    boot_id_override: Optional[str] = None,
) -> FastAPI:
    """Build and return the FastAPI application that runs the server"""
    if not system_version_file:
        system_version_file = OE_BUILTIN_VERSION_FILE

    version = load_version_file(system_version_file)
    boot_id = boot_id_override or control.get_boot_id()
    config_obj = config.load(config_file_override)

    app = FastAPI(
        title="Opentrons Update Server",
        description=(
            "The HTTP API that updates the robot's software and controls its"
            " power state, name, and authorized ssh keys."
        ),
        version=package_version,
        openapi_url="/server/openapi.json",
        docs_url=None,
        # redoc_url is replaced by our own /redoc router, below.
        redoc_url=None,
    )

    app.add_middleware(LogErrorMiddleware)
    app.exception_handler(APIError)(handle_api_error)
    app.exception_handler(AuthorizationError)(handle_authorization_error)

    config.install_config(app.state, config_obj)
    control.install_control(
        app.state,
        boot_id=boot_id,
        health_response=health_response(version_dict=version),
    )
    update_actions.install_update_actions(
        app.state, OT3UpdateActions(RootFSInterface(), PartitionManager())
    )
    name_management.install_name_synchronizer(name_synchronizer, app.state)
    install_authentication_checker(app.state, authentication_checker)

    app.include_router(control.router)
    app.include_router(update.router)
    app.include_router(ssh_key_management.router)
    app.include_router(name_management.router)

    # This is a workaround for a broken /redoc page in versions of FastAPI <0.115.3.
    # The page loads Redoc from a CDN, and the problem is that the default CDN URL
    # uses a fragile version tag.
    # https://github.com/Redocly/redoc/issues/2743
    # https://github.com/fastapi/fastapi/pull/9700
    @app.get("/server/redoc", include_in_schema=False)
    async def redoc_html() -> HTMLResponse:  # noqa: D103
        if app.openapi_url is None:
            raise RuntimeError(
                "Couldn't get OpenAPI URL from FastAPI."
                + " This is probably some kind of misconfiguration."
            )
        return get_redoc_html(
            openapi_url=app.openapi_url,
            title=app.title,
            redoc_js_url=_REDOC_CDN_URL,
        )

    LOG.info(
        "Setup: "
        + "\n\t".join(
            [
                f"Device name: {await name_synchronizer.get_name()}",
                "Openembedded version:         "
                f"{version.get('openembedded_version', 'unknown')}",
                f"\t(from git sha      {version.get('openembedded_sha', 'unknown')}",
                "API version:               "
                f"{version.get('opentrons_api_version', 'unknown')}",
                f"\t(from git sha      {version.get('opentrons_api_sha', 'unknown')}",
                "Update server version:     "
                f"{version.get('update_server_version', 'unknown')}",
                f"\t(from git sha      {version.get('update_server_sha', 'unknown')}",
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
            "shutdown": "/server/shutdown",
        },
        "robotModel": constants.MODEL_OT3,
    }
