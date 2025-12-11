import typing

from pydantic import BaseModel, Field

from opentrons_shared_data.util import StrEnum


class ResourceLink(BaseModel):
    """https://jsonapi.org/format/#document-links"""

    href: str = Field(..., description="The link’s URL")
    meta: typing.Optional[typing.Dict[str, typing.Any]] = Field(
        None,
        description="Metadata about the link",
    )


class ResourceLinkKey(StrEnum):
    # The key indicating the link to own resource
    self = "self"
    protocols = "protocols"
    protocol_by_id = "protocolById"
    sessions = "sessions"
    session_by_id = "sessionById"
    session_command_execute = "commandExecute"


ResourceLinks = typing.Dict[str, ResourceLink]
