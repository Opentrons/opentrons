from typing import Generic, Optional, List, TypeVar
from typing_extensions import Literal
from pydantic import Field, BaseModel
from pydantic.generics import GenericModel

from .resource_links import ResourceLinks


class ResponseDataModel(BaseModel):
    """A model representing an identifiable resource of the server.

    .. deprecated::
        Prefer ResourceModel, which requires ID to be specified
    """

    id: str = Field(None, description="Unique identifier for the resource object.")


class ResourceModel(ResponseDataModel):
    """A model representing an identifiable resource of the server."""

    id: str = Field(..., description="Unique identifier of the resource.")


ResponseDataT = TypeVar("ResponseDataT", bound=BaseModel)


DESCRIPTION_DATA = "the document’s primary data"

DESCRIPTION_LINKS = "a links object related to the primary data."

DESCRIPTION_META = "a meta object that contains non-standard meta-information."


class ResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns a single resource."""

    links: Optional[ResourceLinks] = Field(None, description=DESCRIPTION_LINKS)
    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)


class EmptyResponseModel(BaseModel):
    """A response that returns no data."""

    links: Optional[ResourceLinks] = Field(None, description=DESCRIPTION_LINKS)
    data: Literal[None] = Field(None, description=DESCRIPTION_DATA)


class MultiResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns multiple resources."""

    links: Optional[ResourceLinks] = Field(None, description=DESCRIPTION_LINKS)
    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
