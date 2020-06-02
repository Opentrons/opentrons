import typing
from pydantic import BaseModel, Field


class ResourceLink(BaseModel):
    """https://jsonapi.org/format/#document-links"""
    href: str = \
        Field(...,
              description="The link’s URL")
    meta: typing.Optional[typing.Dict[typing.Any, typing.Any]] = \
        Field(None, description="Meta data about the link")


ResourceLinks = typing.Dict[str, typing.Union[str, ResourceLink]]
