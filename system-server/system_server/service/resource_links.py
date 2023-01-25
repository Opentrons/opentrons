"""Default set of resource links for system-server responses."""
import typing
from enum import Enum
from pydantic import BaseModel, Field


class ResourceLink(BaseModel):
    """See https://jsonapi.org/format/#document-links for details."""

    href: str = Field(..., description="The link’s URL")
    meta: typing.Optional[typing.Dict[str, typing.Any]] = Field(
        None,
        description="Metadata about the link",
    )


class ResourceLinkKey(str, Enum):
    """Enumerated keys for resource links."""

    # The key indicating the link to own resource
    self = "self"


ResourceLinks = typing.Dict[str, ResourceLink]
