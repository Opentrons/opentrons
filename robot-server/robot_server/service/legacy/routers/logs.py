from fastapi import APIRouter, Query, Response
from typing import Dict

from opentrons.system import log_control

from robot_server.docs_helpers.xrefs import OperationId as OpId, xref
from robot_server.service.legacy.models.logs import LogIdentifier, LogFormat

router = APIRouter()

IDENTIFIER_TO_SYSLOG_ID: Dict[LogIdentifier, str] = {
    LogIdentifier.api: "opentrons-api",
    LogIdentifier.serial: "opentrons-api-serial",
    LogIdentifier.server: "uvicorn",
    LogIdentifier.api_server: "opentrons-robot-server",
    LogIdentifier.touchscreen: "opentrons-robot-app",
}


@router.get(
    path="/logs/{log_identifier}",
    summary="Get troubleshooting logs",
    description=(
        f"Get the robot's troubleshooting logs."
        f"\n\n"
        f'If you want the list of steps executed in a protocol,'
        f' like "aspirated 5 µL from well A1...", you probably want the'
        f' {xref(OpId.GET_PROTOCOL_ANALYSIS, "*protocol analysis commands*")} or'
        f' {xref(OpId.GET_RUN_COMMANDS, "*run commands*")} instead.'
    ),
)
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
