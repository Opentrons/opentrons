from typing import Generic, List, TypeVar
from typing_extensions import Literal
from pydantic import Field, BaseModel
from pydantic.generics import GenericModel


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
ResponseLinksT = TypeVar("ResponseLinksT")


DESCRIPTION_DATA = "the document’s primary data"

DESCRIPTION_LINKS = "a links object related to the primary data."


class ResponseModel(GenericModel, Generic[ResponseDataT, ResponseLinksT]):
    """A response that returns a single resource."""

    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


class EmptyResponseModel(GenericModel, Generic[ResponseLinksT]):
    """A response that returns no data."""

    data: Literal[None] = Field(None, description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


class MultiResponseModel(GenericModel, Generic[ResponseDataT, ResponseLinksT]):
    """A response that returns multiple resources."""

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)
