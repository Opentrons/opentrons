"""Models for /system/register."""

from typing import Annotated

from pydantic import BaseModel, Field


class Connection(BaseModel):
    """Model for a single entry in response to GET /system/connected."""

    subject: Annotated[
        str, Field(description="the human registered to this connection")
    ]
    agent: Annotated[str, Field(description="the application type for this connection")]
    agentId: Annotated[
        str, Field(description="a unique identifier for the instance of the agent")
    ]


class GetConnectedResponse(BaseModel):
    """Model for the response to GET /system/connected."""

    connections: Annotated[
        list[Connection], Field(description="the current active connections")
    ]
