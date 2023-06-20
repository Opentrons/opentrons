from __future__ import annotations
from anyio import to_thread
from typing import Any, Dict, Generic, List, Optional, TypeVar, Sequence
from pydantic import Field, BaseModel
from pydantic.generics import GenericModel
from fastapi.responses import JSONResponse
from .resource_links import ResourceLinks as DeprecatedResourceLinks


class ResourceModel(BaseModel):
    """A model representing an identifiable resource of the server."""

    id: str = Field(..., description="Unique identifier of the resource.")


ResponseDataT = TypeVar("ResponseDataT")
ResponseLinksT = TypeVar("ResponseLinksT")


DESCRIPTION_DATA = "The document’s primary data"

DESCRIPTION_LINKS = "A links object related to the primary data."


class BaseResponseBody(BaseModel):
    """Base model for HTTP responses.

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


class MultiBodyMeta(BaseModel):
    cursor: int = Field(
        ...,
        description=(
            "The index of the response's cursor in the overall collection"
            " the response represents."
        ),
    )
    totalLength: int = Field(
        ...,
        description="Total number of items in the overall collection.",
    )


class SimpleMultiBody(BaseResponseBody, GenericModel, Generic[ResponseDataT]):
    """A response that returns multiple resources."""

    data: Sequence[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
    # note: the type of data is the protocol Sequence even though this is an actual
    # object. this is normally something you shouldn't do - the type should be described -
    # but it's done here because the type definition of the constructor and the construct()
    # non-validating classmethod is taken from the type of this member, and there we really
    # want the arguments to be Sequence so they can accept narrower subtypes. For instance,
    # if you define a function as returning SimpleMultiBody[Union[A, B]], you should really
    # be able to do return SimpleMultiBody.construct([A(), A(), A()]) or even
    # SimpleMultiBody[Union[A, B]].construct([A(), A(), A()]). However, because construct's
    # params are defined based on the dataclass fields, the only way to get the arguments
    # to be covariant is to make data the covariant Sequence protocol.
    meta: MultiBodyMeta = Field(
        ...,
        description="Metadata about the colletion response.",
    )


class MultiBody(
    BaseResponseBody,
    GenericModel,
    Generic[ResponseDataT, ResponseLinksT],
):
    """A response that returns multiple resources and stateful links."""

    data: List[ResponseDataT] = Field(..., description=DESCRIPTION_DATA)
    links: ResponseLinksT = Field(..., description=DESCRIPTION_LINKS)
    meta: MultiBodyMeta = Field(
        ...,
        description="Metadata about the colletion response.",
    )


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
        """Initialize the response object and render the response body."""
        super().__init__(content, status_code)
        self.content = content

    @classmethod
    async def create(
        cls,
        content: ResponseBodyT,
        status_code: int = 200,
    ) -> PydanticResponse[ResponseBodyT]:
        """Asynchronously create a response object.

        This factory creates the response in a worker thread, thus moving
        JSON rendering off the main thread. This can help resolve blocking
        issues with large responses.
        """
        return await to_thread.run_sync(cls, content, status_code)

    def render(self, content: ResponseBodyT) -> bytes:
        """Render the response body to JSON bytes."""
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


class ResponseList(BaseModel, Generic[ResponseDataT]):
    """A response that returns a list resource."""

    __root__: List[ResponseDataT]
