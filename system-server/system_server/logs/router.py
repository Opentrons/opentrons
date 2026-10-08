"""Router for /system/logs endpoints."""

from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from . import journald, log_control
from .models import LogFormat, LogIdentifier, LogLevel, SetLogLevelResponse

logs_router = APIRouter()

IDENTIFIER_TO_SYSLOG_ID: Dict[LogIdentifier, str] = {
    LogIdentifier.api: "opentrons-api",
    LogIdentifier.serial: log_control.SERIAL_SPECIAL,
    LogIdentifier.server: "uvicorn",
    LogIdentifier.api_server: "opentrons-robot-server",
    LogIdentifier.update_server: "opentrons-update-server",
    LogIdentifier.touchscreen: "opentrons-robot-app",
    LogIdentifier.can: "opentrons-api-serial-can",
    LogIdentifier.auth: "opentrons-auth-server",
    LogIdentifier.audit: "opentrons-audit-server",
    LogIdentifier.kernel: log_control.KERNEL_SPECIAL,
    LogIdentifier.remote_access: log_control.REMOTE_ACCESS_SPECIAL,
}


@logs_router.get(
    path="/system/logs/{log_identifier}",
    summary="Get troubleshooting logs",
    description=(
        "Get the robot's troubleshooting logs."
        "\n\n"
        "If you want the list of steps executed in a protocol,"
        ' like "aspirated 5 µL from well A1...", you probably want the'
        " *protocol analysis commands* (`GET /protocols/{id}/analyses/{id}`)"
        " or *run commands* (`GET /runs/{id}/commands`) instead."
    ),
)
async def get_logs(
    log_identifier: LogIdentifier,
    response: Response,
    format: Annotated[LogFormat, Query(title="Log format type")] = LogFormat.text,
    records: Annotated[
        int,
        Query(
            title="Number of records to retrieve",
            gt=0,
            le=log_control.MAX_RECORDS,
        ),
    ] = log_control.DEFAULT_RECORDS,
) -> Response:
    """Get troubleshooting logs for the given identifier."""
    syslog_id = IDENTIFIER_TO_SYSLOG_ID[log_identifier]
    modes = {
        LogFormat.json: ("json", "application/json"),
        LogFormat.text: ("short-precise", "text/plain"),
    }
    format_type, media_type = modes[format]
    output = await log_control.get_records_dumb(syslog_id, records, format_type)
    return Response(
        content=output.decode("utf-8"),
        media_type=media_type,
        headers=dict(response.headers),
    )


@logs_router.post(
    path="/system/settings/log_level/local",
    summary="Set the local log level",
    description=(
        "Set the minimum level of logs saved locally by writing"
        " `MaxLevelStore` to journald's runtime configuration and"
        " signaling journald to reload."
    ),
    response_model=SetLogLevelResponse,
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "log_level was missing or invalid",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Failed to update or reload journald configuration",
        },
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("change log level")),
    ],
)
async def post_log_level_local(log_level: LogLevel) -> SetLogLevelResponse:
    """Update journald's local MaxLevelStore and reload the daemon."""
    level = log_level.log_level
    if level is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="log_level must be set",
        )

    try:
        journald.set_max_level_store(level)
    except OSError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write journald configuration: {e}",
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reload journald: {e}",
        ) from e

    return SetLogLevelResponse(message=f"log_level set to {level.value}")
