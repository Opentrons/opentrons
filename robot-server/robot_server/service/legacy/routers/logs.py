from fastapi import APIRouter, Query, Response
from typing import Dict

from opentrons.system import log_control
from robot_server.service.legacy.models.logs import LogIdentifier, LogFormat

router = APIRouter()

IDENTIFIER_TO_SYSLOG_ID: Dict[LogIdentifier, str] = {
    LogIdentifier.api: "opentrons-api",
    LogIdentifier.serial: "opentrons-api-serial",
    LogIdentifier.server: "uvicorn",
    LogIdentifier.api_server: "opentrons-robot-server",
    LogIdentifier.odd: "opentrons-robot-app",
}


@router.get("/logs/{log_identifier}", description="Get logs from the robot.")
async def get_logs(
    log_identifier: LogIdentifier,
    response: Response,
    format: LogFormat = Query(LogFormat.text, title="Log format type"),
    records: int = Query(
        log_control.DEFAULT_RECORDS,
        title="Number of records to retrieve",
        gt=0,
        le=log_control.MAX_RECORDS,
    ),
) -> Response:
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
