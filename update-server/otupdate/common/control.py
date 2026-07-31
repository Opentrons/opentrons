"""
otupdate.common.control: non-update-specific endpoints for otupdate

This has endpoints like /restart that aren't specific to update tasks or machines.
"""

import asyncio
import logging
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any, Mapping, Optional

import fastapi
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .api_error import APIError, ErrorBody
from .name_management import NameSynchronizer, get_name_synchronizer
from .update_actions import UpdateActionsInterface, get_update_actions

LOG = logging.getLogger(__name__)

router = fastapi.APIRouter()

_restart_lock_accessor = AppStateAccessor[asyncio.Lock]("otupdate_restart_lock")
_shutdown_lock_accessor = AppStateAccessor[asyncio.Lock]("otupdate_shutdown_lock")
_boot_id_accessor = AppStateAccessor[str]("otupdate_boot_id")
_health_response_accessor = AppStateAccessor[Mapping[str, Any]](
    "otupdate_health_response"
)


def install_control(
    app_state: AppState,
    *,
    boot_id: str,
    health_response: Mapping[str, Any],
) -> None:
    """Set up the state that this module's endpoints need.

    This should be done as part of server startup.
    """
    _restart_lock_accessor.set_on(app_state, asyncio.Lock())
    _shutdown_lock_accessor.set_on(app_state, asyncio.Lock())
    _boot_id_accessor.set_on(app_state, boot_id)
    _health_response_accessor.set_on(app_state, health_response)


def get_restart_lock(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> asyncio.Lock:
    """A FastAPI dependency to retrieve the server's restart lock."""
    restart_lock = _restart_lock_accessor.get_from(app_state)
    assert restart_lock is not None, "Forgot to install_control() during startup?"
    return restart_lock


def get_shutdown_lock(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> asyncio.Lock:
    """A FastAPI dependency to retrieve the server's shutdown lock."""
    shutdown_lock = _shutdown_lock_accessor.get_from(app_state)
    assert shutdown_lock is not None, "Forgot to install_control() during startup?"
    return shutdown_lock


class ControlMessageResponse(BaseModel):
    """The response to a successful restart or shutdown request."""

    message: str


def no_actions_set_error() -> APIError:
    """Build the error returned when the hardware update actions are missing."""
    return APIError(
        500,
        ErrorBody(
            error="no-actions-set",
            message="Internal error: no actions object for hardware",
        ),
    )


@router.post(
    "/server/restart",
    summary="Restart the robot.",
    dependencies=[fastapi.Depends(require_scopes(Scope.RESTART_WRITE))],
)
async def restart(
    actions: Annotated[
        Optional[UpdateActionsInterface], fastapi.Depends(get_update_actions)
    ],
    restart_lock: Annotated[asyncio.Lock, fastapi.Depends(get_restart_lock)],
) -> ControlMessageResponse:
    """Restart the robot.

    Blocks while the restart lock is held.
    """
    if not actions:
        raise no_actions_set_error()

    async with restart_lock:
        asyncio.get_event_loop().call_later(1, actions.restart)
    return ControlMessageResponse(message="Restarting in 1s")


@router.post(
    "/server/shutdown",
    summary="Shut down the robot.",
    dependencies=[fastapi.Depends(require_scopes(Scope.SHUTDOWN_WRITE))],
)
async def shutdown(
    actions: Annotated[
        Optional[UpdateActionsInterface], fastapi.Depends(get_update_actions)
    ],
    shutdown_lock: Annotated[asyncio.Lock, fastapi.Depends(get_shutdown_lock)],
) -> ControlMessageResponse:
    """Shut down the robot.

    Blocks while the shutdown lock is held.
    """
    if not actions:
        raise no_actions_set_error()

    async with shutdown_lock:
        asyncio.get_event_loop().call_later(1, actions.shutdown)
    return ControlMessageResponse(message="Shutting down in 1s")


@router.get(
    "/server/update/health", summary="Report the robot's identity and versions."
)
async def health(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    name_synchronizer: Annotated[
        NameSynchronizer, fastapi.Depends(get_name_synchronizer)
    ],
) -> JSONResponse:
    """Report version info that clients use to discover and identify the robot."""
    health_response = _health_response_accessor.get_from(app_state)
    assert health_response is not None, "Forgot to install_control() during startup?"
    return JSONResponse(
        content={
            **health_response,
            "name": await name_synchronizer.get_name(),
            "serialNumber": get_serial(),
            "bootId": _boot_id_accessor.get_from(app_state),
        },
        headers={"Access-Control-Allow-Origin": "*"},
    )


def get_serial() -> str:
    """Get the device serial number."""
    try:
        return Path("/var/serial").read_text().strip()
    except OSError:
        return "unknown"


@lru_cache(maxsize=1)
def get_boot_id() -> str:
    # See the "/proc Interface" section in man(4) random.
    return Path("/proc/sys/kernel/random/boot_id").read_text().strip()
