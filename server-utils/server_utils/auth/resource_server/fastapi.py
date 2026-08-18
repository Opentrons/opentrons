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
    Literal,
    Type,
    TypeAlias,
)

import fastapi
import fastapi.responses
import fastapi.security

from .auth_server import TOKEN_ENDPOINT_PATH, LocalHTTPClient
from .authentication_checker import (
    AlwaysAllowedAuthenticationChecker,
    AuthenticationChecker,
    AuthServerAuthenticationChecker,
)
from .authorization_checker import check as check_authorization
from .error_responses import build_response_for_error
from .types import (
    AdminCredentialsRequiredResult,
    AdminCredsSettingsData,
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    AuthorizationNotRequiredResult,
    AuthorizedResult,
    InsufficientScopeResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
    UnableToContactAuthServerResult,
)
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

_authentication_checker_accessor = AppStateAccessor[AuthenticationChecker](
    "authentication_checker"
)


def install_authentication_checker(
    app_state: AppState,
    authentication_checker: AuthenticationChecker,
) -> None:
    """Store a singleton `AuthenticationChecker` in global server state for later retrieval.

    This should be called once during server initialization.
    """
    _authentication_checker_accessor.set_on(app_state, authentication_checker)


@asynccontextmanager
async def build_authentication_checker(
    *,
    auth_server_uds: str | None = None,
    auth_server_url: str | None = None,
    fallback: Type[AuthenticationChecker] = AlwaysAllowedAuthenticationChecker,
) -> AsyncGenerator[AuthenticationChecker, None]:
    """Build an `AuthenticationChecker` appropriately configured for most servers.

    `auth_server_
    uds` (a path to a Unix domain socket) or `auth_server_url` (a URL like
    http://localhost:1234) describes how to connect to the auth-server. These should
    typically be taken from CLI options or environment variables. If neither are
    specified, a dummy `AuthenticationChecker` is returned that allows unauthenticated
    access to everything.
    """
    if auth_server_uds is None and auth_server_url is None:
        _log.info(
            "Not configured to talk to auth-server."
            " Access control will be disabled."
            " (This is normal in dev mode and on OT-2s.)"
        )
        yield fallback()

    else:
        async with LocalHTTPClient(
            auth_server_uds=auth_server_uds, auth_server_url=auth_server_url
        ) as client:
            yield AuthServerAuthenticationChecker(client)


def get_authentication_checker(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> AuthenticationChecker:
    """A FastAPI dependency to retrieve the server's singleton `AuthenticationChecker`.

    Endpoints should not normally need to use this directly. Use `require_authentication`,
    which is higher-level, instead. This is exposed for testing.
    """
    authentication_checker = _authentication_checker_accessor.get_from(app_state)
    assert authentication_checker is not None, (
        "Forgot to initialize authentication checker as part of server startup?"
    )
    return authentication_checker


RequireAuthenticationResult: TypeAlias = (
    AuthenticationNotRequiredResult | AuthenticatedResult
)
RequireScopesResult: TypeAlias = AuthorizationNotRequiredResult | AuthorizedResult

_ADMIN_ACCOUNT_TYPES: Final[frozenset[str]] = frozenset({"admin", "service"})

AdminCredsSetting: TypeAlias = Literal[
    "requireAdminCredsWhenUpdatingRobotSoftware",
    "requireAdminCredsWhenSendingProtocolToRobot",
    "requireAdminCredsForSignoffProtocol",
]


async def require_authentication(
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
            scopes=[],
        ),
    ],
    authentication_checker: Annotated[
        AuthenticationChecker, fastapi.Depends(get_authentication_checker)
    ],
) -> RequireAuthenticationResult:
    """A FastAPI dependency to enforce access control.

    This should never be used on its own, only in conjunction with `require_scopes()`
    to share the identification information with other code.
    """
    authentication_result = await authentication_checker.check(token=bearer_token)
    if isinstance(
        authentication_result,
        (AuthenticationNotRequiredResult, AuthenticatedResult),
    ):
        # The request is authenticated, yay.
        return authentication_result
    else:
        # The request is not authenticated.
        raise AuthorizationError(authentication_result, set())


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
        authentication: Annotated[
            RequireAuthenticationResult, fastapi.Depends(require_authentication)
        ],
        bearer_token: Annotated[
            str | None,
            fastapi.Security(
                _oauth_2_scheme,
                scopes=sorted(scope.api_name for scope in required_scopes_set),
            ),
        ],
    ) -> RequireScopesResult:
        authorized = check_authorization(authentication, required_scopes_set)
        if isinstance(authorized, (AuthorizationNotRequiredResult, AuthorizedResult)):
            return authorized
        raise AuthorizationError(authorized, required_scopes_set)

    return dependency


async def get_admin_creds_settings(
    authentication_checker: Annotated[
        AuthenticationChecker, fastapi.Depends(get_authentication_checker)
    ],
) -> AdminCredsSettingsData:
    """A FastAPI dependency to retrieve the live requireAdminCreds* flags."""
    return await authentication_checker.admin_creds_settings()


def require_admin_account(
    authentication: RequireAuthenticationResult,
) -> None:
    """Reject non-admin callers when access control is on.

    No-op when access control is disabled.
    """
    if isinstance(authentication, AuthenticationNotRequiredResult):
        return
    if authentication.account_type in _ADMIN_ACCOUNT_TYPES:
        return
    raise AuthorizationError(AdminCredentialsRequiredResult(), set())


def require_admin_creds(
    setting: AdminCredsSetting,
) -> Callable[..., Awaitable[None]]:
    """A FastAPI dependency that requires an admin account when a requireAdminCreds* flag is true.

    Use next to `require_scopes()` on protocol upload, software update, and similar
    actions. User tokens keep the matching write scopes (RQA-5855). This gate is what
    actually denies the user when the flag is on (RQA-5854).
    """

    async def dependency(
        authentication: Annotated[
            RequireAuthenticationResult, fastapi.Depends(require_authentication)
        ],
        admin_creds: Annotated[
            AdminCredsSettingsData, fastapi.Depends(get_admin_creds_settings)
        ],
    ) -> None:
        if not getattr(admin_creds, setting):
            return
        require_admin_account(authentication)

    return dependency


async def get_access_control_status(
    authentication_checker: Annotated[
        AuthenticationChecker, fastapi.Depends(get_authentication_checker)
    ],
) -> bool:
    """A FastAPI dependency to retrieve the access control mode status from the server's singleton `AuthenticationChecker`."""
    return await authentication_checker.access_control_status()


class AuthorizationError(Exception):
    """Raised to signal that an HTTP authorization failure should be returned to the client.

    Endpoints should not deal with this directly. Instead, they should use the
    higher-level `require_scopes()` function.
    """

    def __init__(
        self,
        authorization_error: (
            InsufficientScopeResult
            | AdminCredentialsRequiredResult
            | MissingTokenResult
            | NotAnActiveTokenResult
            | UnableToContactAuthServerResult
        ),
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
