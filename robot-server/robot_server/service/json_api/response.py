from __future__ import annotations
from anyio import to_thread
from typing import (
    Any,
    Dict,
    Generic,
    List,
    Optional,
    TypeVar,
    Sequence,
    ParamSpec,
    Callable,
)
from pydantic import Field, BaseModel
from pydantic.generics import GenericModel
from pydantic.typing import get_args
from fastapi.responses import JSONResponse
from fastapi.dependencies.utils import get_typed_return_annotation
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

    def json(self, *args: Any, **kwargs: Any) -> str:
        """See notes in `.dict()`."""
        kwargs["exclude_none"] = True
        return super().json(*args, **kwargs)


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

RouteMethodSig = ParamSpec("RouteMethodSig")
DecoratedEndpoint = TypeVar("DecoratedEndpoint", bound=Callable[..., Any])
RouteMethodReturn = TypeVar(
    "RouteMethodReturn", bound=Callable[[DecoratedEndpoint], DecoratedEndpoint]
)


class PydanticResponse(JSONResponse, Generic[ResponseBodyT]):
    """A custom JSON response that uses Pydantic for JSON serialization.

    Returning this class from an endpoint function is much more performant
    than returning a plain Pydantic model and letting FastAPI serialize it.
    """

    @classmethod
    def wrap_route(
        cls,
        route_method: Callable[RouteMethodSig, RouteMethodReturn],
        *route_args: RouteMethodSig.args,
        **route_kwargs: RouteMethodSig.kwargs,
    ) -> Callable[[DecoratedEndpoint], DecoratedEndpoint]:
        """Use this classmethod as a decorator to wrap routes that return PydanticResponses.

        The route method (i.e. the .post() method of the router) is the first argument and the rest of the
        arguments are keyword args that are forwarded to the route handler.

        For instance:
        @PydanticResponse.wrap_route(
            some_router.post,
            path='/some/path',
            ...
        )
        def my_some_path_handler(...) -> PydanticResponse[SimpleBody[whatever]]:
            ...

        The reason this exists is that if you do not specify a response_model, pydantic will parse the return
        value annotation and try to stuff it in a pydantic field. Pydantic fields can't handle arbitrary classes,
        like fastapi.JSONResponse; therefore, you get an exception while parsing the file (since this all happens
        in a decorator). The fix for this is to always specify a response_model, even if you're also doing a return
        value annotation and/or responses={} arguments.

        This decorator does that for you! Just take any route handler that returns a PydanticResponse (you still have to
        annotate it as such, and return PydanticResponse.create(...) yourself, this only handles the decorating part) and
        replace its route decoration with this one, passing the erstwhile route decorator in.
        """
        # our outermost function exists to capture the arguments that you want to forward to the route decorator
        assert (
            "response_model" not in route_kwargs
        ), "Do not use PydanticResponse.wrap_route if you are already specifying a response model"

        def decorator(
            endpoint_method: DecoratedEndpoint,
        ) -> DecoratedEndpoint:
            # the return annotation is e.g. PydanticResponse[SimpleBody[Whatever]]
            return_annotation = get_typed_return_annotation(endpoint_method)
            # the first arg of the outermost type is the argument to the generic,
            # in this case SimpleBody[Whatever]
            response_model = get_args(return_annotation)[0]
            # and that's what we want to pass to the route method as response_model, so we do it and get the actual
            # function transformer
            route_decorator = route_method(
                **route_kwargs, response_model=response_model
            )
            # which we then call on the endpoint method to get it registered with the router, and return the results
            return route_decorator(endpoint_method)

        # and finally we return our own function transformer with the route method args closed over
        return decorator

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

    id: str = Field(..., description="Unique identifier for the resource object.")


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


class NotifyRefetchBody(BaseResponseBody):
    "A notification response that returns a flag for refetching via HTTP."
    refetchUsingHTTP: bool = True
