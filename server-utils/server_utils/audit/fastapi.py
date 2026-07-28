"""FastAPI-specific helpers for submitting audit log messages to audit-server."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import (
    Annotated,
    AsyncGenerator,
    Awaitable,
    Callable,
)

from fastapi import Depends
from starlette.requests import Request
from starlette.responses import Response

from .audit_logger import AuditLogger
from .audit_server import Client, LocalHTTPClient, NoOpClient
from server_utils.auth.resource_server.fastapi import (
    RequireAuthenticationResult,
    require_authentication,
)
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from server_utils.fastapi_utils.documented_interaction import get_supplied_user_notes

_log = logging.getLogger(__name__)

_audit_client_accessor = AppStateAccessor[Client]("audit_client")

MUTATING_HTTP_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def install_audit_client(app_state: AppState, client: Client) -> None:
    """Store a singleton audit `Client` in global server state for later retrieval.

    This should be called once during server initialization.
    """
    _audit_client_accessor.set_on(app_state, client)


def get_audit_client(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> Client:
    """A FastAPI dependency to retrieve the server's singleton audit `Client`.

    Endpoints can take this as a dependency to submit audit log messages.
    """
    client = _audit_client_accessor.get_from(app_state)
    assert client is not None, (
        "Forgot to initialize audit client as part of server startup?"
    )
    return client


@asynccontextmanager
async def build_audit_client(
    *,
    audit_server_uds: str | None = None,
    audit_server_url: str | None = None,
) -> AsyncGenerator[Client, None]:
    """Build an audit `Client` appropriately configured for most servers.

    `audit_server_uds` (a path to a Unix domain socket) or `audit_server_url` (a URL
    like http://localhost:1234) describes how to connect to audit-server. These should
    typically be taken from CLI options or environment variables. If neither is
    specified, a `NoOpClient` is returned that logs messages locally without
    contacting any server.
    """
    if audit_server_uds is None and audit_server_url is None:
        _log.info(
            "Not configured to talk to audit-server."
            " Audit log messages will only be logged locally."
            " (This is normal when CRS is not enabled)."
        )
        yield NoOpClient()

    else:
        async with LocalHTTPClient(
            audit_server_uds=audit_server_uds, audit_server_url=audit_server_url
        ) as client:
            yield client


async def _do_call(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> tuple[Response, None] | tuple[None, BaseException]:
    try:
        response = await call_next(request)
        if None is response:
            _log.error(f"Endpoint function returned {response} but did not raise")
            raise RuntimeError(
                f"Endpoint function for {request.method} {request.url.path} did not response"
            )
        return response, None
    except BaseException as exc:
        return None, exc


async def _return_or_raise(
    response: Response | None, exc: BaseException | None
) -> Response:
    if exc is not None:
        raise exc
    assert response is not None, "Unexpected lack of response in logging"
    return response


async def _handle_autolog(
    audit_logger: AuditLogger, request: Request, response: Response | None
) -> None:
    if audit_logger.auto_log_request_head:
        audit_logger.append_request_head_to_message(request)
    if audit_logger.auto_log_request_body:
        await audit_logger.append_request_body_to_message(request)
    if audit_logger.auto_log_response_head:
        audit_logger.append_response_head_to_message(response)
    if audit_logger.auto_log_response_body:
        audit_logger.append_response_body_to_message(response)


async def audit_logger_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """A middleware driving audit logging to handle logging route handler responses.

    This looks for an audit logger hung off the request state by the get_audit_logger dependency
    and builds whatever's required for the rest of the log object after the request completes.
    """
    response, cached_exc = await _do_call(request, call_next)

    if not hasattr(request.state, "audit_logger"):
        if request.method in MUTATING_HTTP_METHODS:
            _log.error(
                f"Request {request.method} {request.url.path} should add an audit log or explicitly skip audit logging but does not"
            )
        return await _return_or_raise(response, cached_exc)
    if request.method not in MUTATING_HTTP_METHODS:
        return await _return_or_raise(response, cached_exc)
    audit_logger = getattr(request.state, "audit_logger", None)
    if not isinstance(audit_logger, AuditLogger):
        _log.debug("not logging because request skipped with skip_audit_logger")
        return await _return_or_raise(response, cached_exc)
    if audit_logger.did_log or not audit_logger.should_log:
        _log.info(
            f"not logging: did_log={audit_logger.did_log}, should_log={audit_logger.should_log}"
        )
        return await _return_or_raise(response, cached_exc)

    # the way an ASGI application stack works is that each ASGI application gets a
    # "scope", which is a map of data, and a send and receive callback. Each application
    # then parses messages and sends responses. This is pretty inconvenient, so when
    # you're using Starlette or FastAPI, those frameworks wrap the scope and callbacks
    # into an object like Request, which capture a bunch of the data from the scope
    # and give it nice names, and add nice methods with nice caching logic.
    #
    # The problem is that they do this Request() wrapping process separately for each
    # ASGI application, and a middleware is a separate ASGI application from the
    # endpoint stack. That means that the Request() object we get in this middleware
    # is different from the Request() object that the endpoint function and its FastAPI
    # dependencies get, and that's an issue because the request body caching that
    # Request() offers is just done as an instance attribute of the Request object. So
    # if we try to get request.body() here, this Request doesn't have a cached body
    # and tries to get it from uvicorn... which doesn't do any request caching.
    #
    # To fix this, we stash the request object from the endpoint function ASGI application
    # on the audit logger object in the get_audit_logger dependency, and then use _that_
    # Request object instead of the one that was passed into the middleware. This is maybe
    # a little gross, since the applications are logically separate, but since this is
    # ASGI and the separation is "different asyncio task" it's fine.
    new_request = audit_logger.request
    request = new_request
    await _handle_autolog(audit_logger, request, response)

    try:
        _log.info("Sending audit log")
        await audit_logger.log()
    except BaseException as audit_exc:
        _log.exception("Failure in audit logging")
        if cached_exc:
            raise BaseExceptionGroup(
                "Failure in route and failure in audit log", [cached_exc, audit_exc]
            )
        else:
            raise
    if cached_exc:
        raise cached_exc
    assert response is not None, "Unexpected lack of response in audit logging"
    return response


class SkipLoggingSentinel:
    """If present as the audit_logger of a request causes logging to be skipped."""

    pass


def skip_audit_logger(request: Request) -> None:
    """Take this as a FastAPI dependency in a route to mark the route as not requiring logging."""
    request.state.audit_logger = SkipLoggingSentinel()


def get_audit_logger(
    action: str | None = None,
    *,
    auto_log_request_head: bool = True,
    auto_log_request_body: bool = True,
    auto_log_response_head: bool = True,
    auto_log_response_body: bool = True,
) -> Callable[..., Awaitable[AuditLogger]]:
    """A FastAPI dependency to log actions to the audit log.

    Note: if this dependency is used without the audit logging middleware,
    nothing will be logged automatically and every route handler must use
    the log() method of the audit logger returned by this dependency to log.

    Use like so:
    ```
    @router.post(
         "/foo",
         dependencies=[
             # this endpoint must be protected by authentication
             # since the auto logger pulls identity information from
             # auth tokens
             Depends(require_scopes(Scope.READ_FOO, Scope.WRITE_FOO)),
             # action and message may be omitted; if they are, then
             # - action will be METHOD route, aka POST /some/thing
             # - message will be a string format of the request's URL parameters
             #   (if any) and, from the body,
             #   - if the body is JSON, it will be serialized into the message
             #   - if the body is anything else, this will error
             Depends(get_audit_logger())]
    )
    ```

    The point of this dependency is to automatically pull in the things that are
    needed for audit logs and automatically build messages (ideally for only the
    least complex routes). The arguments to the dependency generator control
    what's automatic and what's not.

    If action is a string, that string is used; otherwise, the action is automatically
    generated from the route. If you write your own action, keep it short.

    The other arguments control automatic logging of other parts of the request.

    You usually can keep auto_log_request_head and auto_log_response_head on; these
    log headers, status codes, routes, paths, and anything that don't require bodies.

    You should turn off auto_log_request_body and do it yourself via append_message_chunk
    if the route handles large request bodies for which there are better summaries than
    the first 1K of the request body itself. You can leave it on if request bodies are
    small or if there's never a request body (for instance, DELETE routes).

    You should turn off auto_log_response_body and do it yourself via append_message_chunk
    if the route handles large response bodies for which there are better summaries than
    the first 1K.

    In any case, use append_request_chunk to add more logging to a route.
    """

    async def dependency(
        request: Request,
        user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
        audit_client: Annotated[Client, Depends(get_audit_client)],
        authentication: Annotated[
            RequireAuthenticationResult, Depends(require_authentication)
        ],
    ) -> AuditLogger:
        audit_logger = AuditLogger(
            audit_client=audit_client,
            auto_log_request_head=auto_log_request_head,
            auto_log_response_head=auto_log_response_head,
            auto_log_request_body=auto_log_request_body,
            auto_log_response_body=auto_log_response_body,
            request=request,
        )
        if action is not None:
            audit_logger.set_action(action)
        else:
            audit_logger.set_action_from_request(request)
        audit_logger.set_auth_details(authentication)
        audit_logger.set_user_note(user_notes)
        if action is not None:
            audit_logger.set_action(action)
        else:
            audit_logger.set_action_from_request(request)

        request.state.audit_logger = audit_logger
        return audit_logger

    return dependency
