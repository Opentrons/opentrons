"""FastAPI-specific helpers for enforcing authorization."""

# NOTE: Don't do `from __future__ import annotations` in this file.
# See comments in `require_scopes()`.

import logging
from contextlib import asynccontextmanager
from typing import (
    Annotated,
    AsyncGenerator,
    Awaitable,
    Callable,
    Final,
    TypeAlias,
)

import fastapi
import fastapi.responses
import fastapi.security

from .auth_server import TOKEN_ENDPOINT_PATH, LocalHTTPClient
from .authorization_checker import (
    AlwaysAllowedAuthorizationChecker,
    AuthorizationChecker,
    AuthorizationNotRequiredResult,
    AuthorizedResult,
    AuthServerAuthorizationChecker,
    InsufficientScopeResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
)
from .error_responses import build_response_for_error
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

_log = logging.getLogger(__name__)

# This is a FastAPI dependency that does two things:
# 1. It returns the request's bearer token, if it carried one.
# 2. It adds global information about our authorization scheme to the OpenAPI spec.
_oauth_2_scheme = fastapi.security.OAuth2PasswordBearer(
    tokenUrl=TOKEN_ENDPOINT_PATH,
    scopes={scope.api_name: scope.description for scope in Scope},
    scheme_name="oauth2",
    auto_error=False,
)

_authorization_checker_accessor = AppStateAccessor[AuthorizationChecker](
    "authorization_checker"
)


RequireScopesResult: TypeAlias = AuthorizationNotRequiredResult | AuthorizedResult


def require_scopes(
    *required_scopes: Scope,
) -> Callable[..., Awaitable[RequireScopesResult]]:
    """A FastAPI dependency to enforce access control.

    Use like so:

    ```
    @router.post(
        "/foo",
        # The client must have READ_FOO and WRITE_FOO permissions.
        dependencies=[Depends(require_scopes(Scope.READ_FOO, Scope.WRITE_FOO))],
    )
    def get_foo(...) -> None:
        ...
    ```

    Or, for more advanced cases where you need more authorization details:

    ```
    @router.post("/foo")
    def get_foo(
        # The client must have READ_FOO and WRITE_FOO permissions.
        authorization_details: Annotated[
            RequireScopesResult,
            Depends(require_scopes(Scope.READ_FOO, Scope.WRITE_FOO))
        ]
    ) -> None:
        # Here you can check authorization_details.
        ...
    ```

    In either case, this dependency checks to see if the request is authorized for
    all of the `required_scopes`. If so, it lets your endpoint function run.
    Otherwise, it rejects the request with an appropriate HTTP error.

    This also automatically adds documentation to the OpenAPI document to say
    that the endpoint requires these scopes.
    """
    required_scopes_set = set(required_scopes)

    async def dependency(
        # This retrieves the request's bearer token, by depending on `_oauth_2_scheme`;
        # and it adds OpenAPI docs to list which scopes the endpoint requires,
        # by supplying the `scopes` argument.
        #
        # This will break if this file has `from __future__ import annotations`. FastAPI
        # will not understand the lazily-evaluated type annotation. This may or may not
        # become a problem by the time we get to Python 3.14, which changes the way
        # annotations work to something similar (but different) to the `__future__`
        # thing.
        bearer_token: Annotated[
            str | None,
            fastapi.Security(
                _oauth_2_scheme,
                scopes=sorted(scope.api_name for scope in required_scopes_set),
            ),
        ],
        authorization_checker: Annotated[
            AuthorizationChecker, fastapi.Depends(get_authorization_checker)
        ],
    ) -> RequireScopesResult:
        authorization_result = await authorization_checker.check(
            token=bearer_token, required_scopes=required_scopes_set
        )
        if isinstance(
            authorization_result, (AuthorizationNotRequiredResult, AuthorizedResult)
        ):
            # The request is authorized, yay.
            return authorization_result
        else:
            # The request is not authorized.
            raise AuthorizationError(authorization_result, required_scopes_set)

    return dependency


def install_authorization_checker(
    app_state: AppState,
    authorization_checker: AuthorizationChecker,
) -> None:
    """Store a singleton `AuthorizationChecker` in global server state for later retrieval.

    This should be called once during server initialization.
    """
    _authorization_checker_accessor.set_on(app_state, authorization_checker)


@asynccontextmanager
async def build_authorization_checker(
    *, auth_server_uds: str | None = None, auth_server_url: str | None = None
) -> AsyncGenerator[AuthorizationChecker, None]:
    """Build an `AuthorizationChecker` appropriately configured for most servers.

    `auth_server_uds` (a path to a Unix domain socket) or `auth_server_url` (a URL like
    http://localhost:1234) describes how to connect to the auth-server. These should
    typically be taken from CLI options or environment variables. If neither are
    specified, a dummy `AuthorizationChecker` is returned that allows unauthenticated
    access to everything.
    """
    if auth_server_uds is None and auth_server_url is None:
        _log.info(
            "Not configured to talk to auth-server."
            " Access control will be disabled."
            " (This is normal in dev mode and on OT-2s.)"
        )
        yield AlwaysAllowedAuthorizationChecker()

    else:
        async with LocalHTTPClient(
            auth_server_uds=auth_server_uds, auth_server_url=auth_server_url
        ) as client:
            yield AuthServerAuthorizationChecker(client)


def get_authorization_checker(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> AuthorizationChecker:
    """A FastAPI dependency to retrieve the server's singleton `AuthorizationChecker`.

    Endpoints should not normally need to use this directly. Use `require_scopes()`,
    which is higher-level, instead. This is exposed for testing.
    """
    authorization_checker = _authorization_checker_accessor.get_from(app_state)
    assert authorization_checker is not None, (
        "Forgot to initialize authorization checker as part of server startup?"
    )
    return authorization_checker


class AuthorizationError(Exception):
    """Raised to signal that an HTTP authorization failure should be returned to the client.

    Endpoints should not deal with this directly. Instead, they should use the
    higher-level `require_scopes()` function.
    """

    def __init__(
        self,
        authorization_error: InsufficientScopeResult
        | MissingTokenResult
        | NotAnActiveTokenResult,
        required_scopes: set[Scope],
    ) -> None:
        self.authorization_error: Final = authorization_error
        self.required_scopes: Final = required_scopes


def handle_authorization_error(
    request: fastapi.Request, exc: AuthorizationError
) -> fastapi.responses.Response:
    """Turn `AuthorizationError` exceptions into HTTP responses.

    This should be installed as a global FastAPI exception handler.
    """
    status_code, headers, body = build_response_for_error(
        exc.authorization_error, exc.required_scopes
    )
    return fastapi.responses.Response(
        status_code=status_code,
        headers=headers,
        content=body.model_dump_json(by_alias=True),
        media_type="application/json",
    )
