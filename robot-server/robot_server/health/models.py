"""HTTP request and response models for /health endpoints."""
import typing
from pydantic import BaseModel, Field
from opentrons_shared_data.deck.dev_types import RobotModel
from robot_server.service.json_api import BaseResponseBody


class HealthLinks(BaseModel):
    """Useful server links."""

    apiLog: str = Field(
        ...,
        description="The path to the API logs endpoint",
    )
    serialLog: str = Field(
        ...,
        description="The path to the motor control serial communication logs endpoint",
    )
    serverLog: str = Field(
        ...,
        description="The path to the HTTP server logs endpoint",
    )
    oddLog: typing.Optional[str] = Field(
        None,
        description="The path to the ODD app logs endpoint",
    )
    apiSpec: str = Field(
        ...,
        description="The path to the OpenAPI specification of the server",
    )
    systemTime: str = Field(
        ...,
        description="The path to the system time endpoints",
    )


class Health(BaseResponseBody):
    """Information about the server and system."""

    name: str = Field(
        ...,
        description="The robot's name. In most cases the same as its "
        "mDNS advertisement domain name, but this can get out "
        "of sync. Mostly useful for user-facing titles.",
    )
    robot_model: RobotModel = Field(
        ...,
        description="Which model of Opentrons robot this is",
    )
    api_version: str = Field(
        ...,
        description="The API server's software version",
    )
    fw_version: str = Field(
        ...,
        description="The motor controller's firmware version. Doesn't "
        "follow a pattern; suitable only for display or exact matching.",
    )
    board_revision: str = Field(
        ...,
        description="The hardware revision of the OT-2's central routing board.",
    )
    logs: typing.List[str] = Field(
        ...,
        description="List of paths at which to find log endpoints",
    )
    system_version: str = Field(
        ...,
        description="The robot's operating system version.",
    )
    maximum_protocol_api_version: typing.List[int] = Field(
        ...,
        description="The system's maximum supported Protocol API version, "
        "in the format `[major_version, minor_version]`",
        min_items=2,
        max_items=2,
    )
    minimum_protocol_api_version: typing.List[int] = Field(
        ...,
        description="The system's minimum supported Protocol API version, "
        "in the format `[major_version, minor_version]`",
        min_items=2,
        max_items=2,
    )
    links: HealthLinks

    class Config:
        """Health response model schema configuration."""

        schema_extra = {
            "example": {
                "name": "OT2CEP20190604A02",
                "api_version": "3.15.2",
                "fw_version": "v2.15.0",
                "board_revision": "2.1",
                "logs": ["/logs/serial.log", "/logs/api.log"],
                "system_version": "1.2.1",
                "maximum_protocol_api_version": [2, 8],
                "minimum_protocol_api_version": [2, 0],
                "links": {
                    "apiLog": "/logs/api.log",
                    "serialLog": "/logs/serial.log",
                    "apiSpec": "/openapi.json",
                    "systemTime": "/system/time",
                },
            }
        }
