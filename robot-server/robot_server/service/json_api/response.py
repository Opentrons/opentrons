from typing import Generic, List, TypeVar
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


DESCRIPTION_DATA = "The document’s primary data"

DESCRIPTION_LINKS = "A links object related to the primary data."


class SimpleResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns a sinle resource."""

    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)


class ResponseModel(GenericModel, Generic[ResponseDataT, ResponseLinksT]):
    """A response that returns a single resource and stateful links."""

    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


class SimpleEmptyResponseModel(BaseModel):
    """A response that returns no data and no links."""


class EmptyResponseModel(GenericModel, Generic[ResponseLinksT]):
    """A response that returns no data except stateful links."""

    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


class SimpleMultiResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns multiple resources."""

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)


class MultiResponseModel(GenericModel, Generic[ResponseDataT, ResponseLinksT]):
    """A response that returns multiple resources and stateful links."""

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)
