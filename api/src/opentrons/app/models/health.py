import typing
from pydantic import BaseModel, Field


class Links(BaseModel):
    """A set of useful links"""
    apiLog: str = \
        Field(...,
              description="The URI of the api logs")
    serialLog: str = \
        Field(...,
              description="The URI of the serial logs")
    apiSpec: str = \
        Field(...,
              description="The URI to this API specification")


class Health(BaseModel):
    """A set of information about the name and versions."""
    name: str = \
        Field(...,
              description="The robot's name. In most cases the same as its "
                          "mDNS advertisement domain name but this can get out"
                          " of sync. Mostly useful for user-facing titles.")
    api_version: str = \
        Field(...,
              description="The SemVer dotted-int version of the API server and"
                          " by extension robot software.")
    fw_version: str = \
        Field(...,
              description="The version of the firmware flashed to the OT-2's "
                          "motor controller board. Doesn't follow a pattern, "
                          "suitable only for display or exact matching.")
    logs: typing.List[str] = \
        Field(...,
              description="List of URL paths at which to find logs")
    system_version: str = \
        Field(...,
              description="The SemVer dotted-int version of the robot OS")
    protocol_api_version: typing.List[int] = \
        Field(...,
              description="A major.minor Protocol API version",
              min_items=2,
              max_items=2)
    links: Links

    class Config:
        schema_extra = {
            "example": {
                  "name": "OT2CEP20190604A02",
                  "api_version": "3.15.2",
                  "fw_version": "v2.15.0",
                  "logs": ["/logs/serial.log", "/logs/api.log"],
                  "system_version": "1.2.1",
                  "protocol_api_version": [2, 0],
                  "links": {
                    "apiLog": "/logs/api.log",
                    "serialLog": "/logs/serial.log",
                    "apiSpec": "/openapi.json"
                  }
                }
        }
