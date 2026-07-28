"""HTTP routes and handlers for /system endpoints.

Endpoints include:

- /system/time: allows the client to read & update robot system time
"""

from datetime import datetime

from fastapi import Depends

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api.resource_links import (
    ResourceLink,
    ResourceLinkKey,
)

from .models import SystemTimeRequest, SystemTimeResponse, SystemTimeResponseAttributes
from .time_utils import get_system_time, set_system_time

system_router = LightRouter()
"""Router for /system endpoints."""


def _create_time_response(dt: datetime) -> SystemTimeResponse:
    """Create a SystemTimeResponse from a datetime."""
    return SystemTimeResponse(
        data=SystemTimeResponseAttributes(id="time", systemTime=dt),
        links={ResourceLinkKey.self: ResourceLink(href="/system/time")},
    )


@system_router.get(
    "/system/time",
    summary="Fetch system time & date",
    description=(
        "Get robot's time status, which includes- current UTC "
        "date & time, local timezone, whether robot time is "
        "synced with an NTP server &/or it has an active RTC."
    ),
    response_model=SystemTimeResponse,
)
async def get_time() -> SystemTimeResponse:
    """Get the robot's system time."""
    sys_time = await get_system_time()
    return _create_time_response(sys_time)


@system_router.put(
    "/system/time",
    description="Update system time",
    summary="Set robot time",
    response_model=SystemTimeResponse,
    dependencies=[
        Depends(require_scopes(Scope.SYSTEM_TIME_WRITE)),
        Depends(get_audit_logger("update system time")),
    ],
)
async def set_time(new_time: SystemTimeRequest) -> SystemTimeResponse:
    """Set the robot's system time."""
    sys_time = await set_system_time(new_time.data.systemTime)
    return _create_time_response(sys_time)
