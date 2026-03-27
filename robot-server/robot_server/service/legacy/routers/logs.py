import dataclasses
from typing import Annotated

from fastapi import APIRouter, Query, Response

from robot_server.service.legacy.models.logs import LogFormat, LogIdentifier
from robot_server.service.legacy.routers import _log_control as log_control

MAX_RECORDS = 100000
DEFAULT_RECORDS = 50000


router = APIRouter()


@router.get(
    path="/logs/{log_identifier}",
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
            le=MAX_RECORDS,
        ),
    ] = DEFAULT_RECORDS,
) -> Response:
    filter_args = _get_filter_args(log_identifier)

    modes = {
        LogFormat.json: ("json", "application/json"),
        LogFormat.text: ("short-precise", "text/plain"),
    }
    format_type, media_type = modes[format]

    output = await log_control.get_records_dumb(
        units=filter_args.units,
        syslog_ids=filter_args.syslog_ids,
        records=records,
        mode=format_type,
    )

    return Response(
        content=output.decode("utf-8"),
        media_type=media_type,
        headers=dict(response.headers),
    )


@dataclasses.dataclass
class _FilterArgs:
    units: list[str] = dataclasses.field(default_factory=list[str])
    syslog_ids: list[str] = dataclasses.field(default_factory=list[str])


def _get_filter_args(identifier: LogIdentifier) -> _FilterArgs:
    # This is a match statement, as opposed to a dict, for exhaustiveness checking.
    match identifier:
        case LogIdentifier.api:
            return _FilterArgs(syslog_ids=["opentrons-api"])
        case LogIdentifier.serial:
            return _FilterArgs(
                syslog_ids=[
                    "opentrons-api-serial",
                    "opentrons-api-serial-can",
                    "opentrons-api-serial-usbbin",
                ]
            )
        case LogIdentifier.server:
            return _FilterArgs(syslog_ids=["uvicorn"])
        case LogIdentifier.api_server:
            return _FilterArgs(units=["opentrons-robot-server"])
        case LogIdentifier.update_server:
            return _FilterArgs(units=["opentrons-update-server"])
        case LogIdentifier.touchscreen:
            return _FilterArgs(units=["opentrons-robot-app"])
        case LogIdentifier.can:
            return _FilterArgs(syslog_ids=["opentrons-api-serial-can"])
