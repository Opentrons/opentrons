from __future__ import annotations
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import Field, BaseModel
from pydantic.generics import GenericModel
from fastapi.responses import JSONResponse
from .resource_links import ResourceLinks as DeprecatedResourceLinks


class ResourceModel(BaseModel):
    """A model representing an identifiable resource of the server."""

    id: str = Field(..., description="Unique identifier of the resource.")


ResponseDataT = TypeVar("ResponseDataT", bound=BaseModel)
ResponseLinksT = TypeVar("ResponseLinksT")


DESCRIPTION_DATA = "The document’s primary data"

DESCRIPTION_LINKS = "A links object related to the primary data."


class BaseResponseBody(BaseModel):
    """Base model to for HTTP responses.

    This model contains configuration and overrides to ensure returned
    JSON responses adhere to the server's generated OpenAPI Spec.
    """

    def dict(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Always exclude `None` when serializing to an object.

        The OpenAPI spec marks `Optional` BaseModel fields as omittable, but
        not nullable. This `dict` method override ensures that `null` is never
        returned in a response, which would violate the spec.
        """
        kwargs["exclude_none"] = True
        return super().dict(*args, **kwargs)


class SimpleBody(BaseResponseBody, GenericModel, Generic[ResponseDataT]):
    """A response that returns a single resource."""

    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)


class Body(BaseResponseBody, GenericModel, Generic[ResponseDataT, ResponseLinksT]):
    """A response that returns a single resource and stateful links."""

    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


class SimpleEmptyBody(BaseResponseBody):
    """A response that returns no data and no links."""


class EmptyBody(BaseResponseBody, GenericModel, Generic[ResponseLinksT]):
    """A response that returns no data except stateful links."""

    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


class SimpleMultiBody(BaseResponseBody, GenericModel, Generic[ResponseDataT]):
    """A response that returns multiple resources."""

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)


class MultiBody(
    BaseResponseBody,
    GenericModel,
    Generic[ResponseDataT, ResponseLinksT],
):
    """A response that returns multiple resources and stateful links."""

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)


ResponseBodyT = TypeVar("ResponseBodyT", bound=BaseResponseBody)


class PydanticResponse(JSONResponse, Generic[ResponseBodyT]):
    """A custom JSON response that uses Pydantic for JSON serialization.

    Returning this class from an endpoint function is much more performant
    than returning a plain Pydantic model and letting FastAPI serialize it.
    """

    def __init__(
        self,
        content: ResponseBodyT,
        status_code: int = 200,
    ) -> None:
        super().__init__(content, status_code)
        self.content = content

    def render(self, content: ResponseBodyT) -> bytes:
        return content.json().encode(self.charset)


# TODO(mc, 2021-12-09): remove this model
class DeprecatedResponseDataModel(BaseModel):
    """A model representing an identifiable resource of the server.

    .. deprecated::
        Prefer ResourceModel, which requires ID to be specified
    """

    id: str = Field(None, description="Unique identifier for the resource object.")


# TODO(mc, 2021-12-09): remove this model
class DeprecatedResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns a single resource and stateful links.

    This deprecated response model may serialize `Optional` fields to `null`,
    which violates our generated OpenAPI Spec.

    Note:
        Do not use this response model for new endpoints.
    """

    data: ResponseDataT = Field(..., description=DESCRIPTION_DATA)
    links: Optional[DeprecatedResourceLinks] = Field(
        None,
        description=DESCRIPTION_LINKS,
    )


# TODO(mc, 2021-12-09): remove this model
class DeprecatedMultiResponseModel(
    GenericModel,
    Generic[ResponseDataT],
):
    """A response that returns multiple resources and stateful links.

    This deprecated response model may serialize `Optional` fields to `null`,
    which violates our generated OpenAPI Spec.

    Note:
        Do not use this response model for new endpoints.
    """

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
    links: Optional[DeprecatedResourceLinks] = Field(
        None,
        description=DESCRIPTION_LINKS,
    )
