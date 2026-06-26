"""Utilities for this server to enforce access control on its endpoints."""

import functools
import re
from typing import Callable

from aiohttp import web

from server_utils.auth.resource_server.authorization_checker import (
    AuthorizationChecker,
    AuthorizationNotRequiredResult,
    AuthorizedResult,
)
from server_utils.auth.resource_server.error_responses import build_response_for_error
from server_utils.auth.scopes import Scope

from .constants import APP_VARIABLE_PREFIX
from .handler_type import Handler

_AUTHORIZATION_CHECKER_APP_KEY = APP_VARIABLE_PREFIX + "authorization_checker"


def install_authorization_checker(
    app: web.Application, authorization_checker: AuthorizationChecker
) -> None:
    """Configure how the server will check authorization, behind the scenes.

    The `AuthorizationChecker` defines how authorization will work. This function
    installs it on global app state, where it will be used by `require_scopes()`.
    """
    app[_AUTHORIZATION_CHECKER_APP_KEY] = authorization_checker


def require_scopes(*required_scopes: Scope) -> Callable[[Handler], Handler]:
    """Enforce access control on an HTTP endpoint.

    Apply this to the aiohttp request handler. For example, this requires the client
    to be authorized with the FOO_READ and FOO_WRITE scopes to use the add_foo() endpoint:

        @require_scopes(Scope.FOO_READ, Scope.FOO_WRITE)
        async def add_foo(request: web.Request) -> web.Response:
            ...

    If the request is authorized, the endpoint function runs as normal.
    If it's not authorized, an appropriate HTTP error response is returned.
    """
    required_scopes_set = set(required_scopes)

    def decorator(handler: Handler) -> Handler:
        @functools.wraps(handler)
        async def wrapped(request: web.Request) -> web.StreamResponse:
            authorization_checker = request.app[_AUTHORIZATION_CHECKER_APP_KEY]
            assert isinstance(authorization_checker, AuthorizationChecker), (
                "The app is missing its AuthorizationChecker. Forgot to initialize it during server startup?"
            )
            token = _extract_bearer_token(request)
            result = await authorization_checker.check(
                token=token, required_scopes=required_scopes_set
            )
            if isinstance(result, (AuthorizationNotRequiredResult, AuthorizedResult)):
                # The request is authorized.
                return await handler(request)
            else:
                # The request is not authorized.
                status_code, headers, body = build_response_for_error(
                    result, required_scopes_set
                )
                return web.json_response(
                    status=status_code,
                    headers=headers,
                    text=body.model_dump_json(by_alias=True),
                )

        return wrapped

    return decorator


def _extract_bearer_token(request: web.Request) -> str | None:
    """Return a request's bearer token, if it has one.

    e.g. given a request with a header "Authorization: Bearer abc123", returns "abc123".
    """
    header_value = request.headers.get("Authorization")
    if header_value is None:
        return None
    # Syntax reference: https://datatracker.ietf.org/doc/html/rfc6750#section-2.1
    match = re.fullmatch(r"^bearer +(.+)$", header_value, re.IGNORECASE)
    if match is None:
        return None
    return match.group(1)
