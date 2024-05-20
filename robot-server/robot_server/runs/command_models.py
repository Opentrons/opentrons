"""Request and response models for dealing with run commands.

These are shared between the `/runs` and `/maintenance_runs` endpoints.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from opentrons.protocol_engine import commands as pe_commands

from robot_server.service.json_api.request import RequestModel


class RequestModelWithCommandCreate(RequestModel[pe_commands.CommandCreate]):
    """Equivalent to RequestModel[CommandCreate].

    This works around a Pydantic v<2 bug where RequestModel[CommandCreate]
    doesn't parse using the CommandCreate union discriminator.
    https://github.com/pydantic/pydantic/issues/3782
    """

    data: pe_commands.CommandCreate


class CommandLinkMeta(BaseModel):
    """Metadata about a command resource referenced in `links`."""

    runId: str = Field(..., description="The ID of the command's run.")
    commandId: str = Field(..., description="The ID of the command.")
    index: int = Field(..., description="Index of the command in the overall list.")
    key: str = Field(..., description="Value of the current command's `key` field.")
    createdAt: datetime = Field(
        ...,
        description="When the current command was created.",
    )


class CommandLink(BaseModel):
    """A link to a command resource."""

    href: str = Field(..., description="The path to a command")
    meta: CommandLinkMeta = Field(..., description="Information about the command.")


class CommandCollectionLinks(BaseModel):
    """Links returned along with a collection of commands."""

    current: Optional[CommandLink] = Field(
        None,
        description=(
            'Information about the "current" command.'
            ' The "current" command is the one that\'s running right now,'
            " or, if there is none, the one that was running most recently."
        ),
    )
