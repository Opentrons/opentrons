"""FastAPI-specific helpers for submitting audit log messages to audit-server."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import (
    Annotated,
    AsyncGenerator,
    Awaitable,
    Callable,
    cast,
)

from fastapi import Depends
from starlette.requests import Request
from starlette.responses import Response

from .audit_logger import AuditLogger, MessageStyle
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
        return (await call_next(request)), None
    except BaseException as exc:
        return None, exc


async def _return_or_raise(
    response: Response | None, exc: BaseException | None
) -> Response:
    if exc is not None:
        raise exc
    assert response is not None, "UNexpected lack of response in logging"
    return response


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
                f"Request {request.method} {request.url.path} should add an audit log but does not"
            )
        return await _return_or_raise(response, cached_exc)
    if request.method not in MUTATING_HTTP_METHODS:
        return await _return_or_raise(response, cached_exc)
    audit_logger = cast(AuditLogger, request.state.audit_logger)
    if audit_logger.did_log or not audit_logger.should_log:
        _log.info(
            f"not logging: did_log={audit_logger.did_log}, should_log={audit_logger.should_log}"
        )
        return await _return_or_raise(response, cached_exc)

    if audit_logger.message_style == "auto":
        await audit_logger.append_message_from_request_response(request, response)
    elif audit_logger.message_style == "auto-head":
        audit_logger.append_message_from_request_response_head(request, response)
    try:
        _log.debug("Sending audit log")
        await audit_logger.log()
    except BaseException as audit_exc:
        if cached_exc:
            raise BaseExceptionGroup(
                "Failure in route and failure in audit log", [cached_exc, audit_exc]
            )
        else:
            raise
    assert response is not None, "Unexpected lack of response in logging"
    return response


def get_audit_logger(
    *,
    action: str | None = None,
    message_style: MessageStyle = "auto",
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

    If message is 'auto', details of the route will be logged. This is probably the right
    choice for simple routes that do not have large request or response bodies - robot
    control endpoints, DELETE endpoints. If message is auto, the request handler does not
    need to do anything further to have an acceptable audit record preserved. Note that
    only the first 1MB of request and response body is logged; if you need more than this,
    use auto-head or manual.

    If message is 'auto-head', the head of the request and response (i.e. everything but
    the bodies) will be logged. This is probably the right choice for most routes that
    cannot use auto because their bodies are too big. The request handler should call
    set_request_body_message_chunk and set_response_body_message_chunk while it is running.
    Note that each of these functions will truncate input larger than 1MB.

    If message is 'manual', no element of the message will be automatically added. The
    route handler should call append_message_chunk() in the body of the request (or other
    AuditLogger methods).
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
            audit_client=audit_client, message_style=message_style
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
