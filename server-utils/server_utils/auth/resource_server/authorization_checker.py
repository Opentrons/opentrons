"""Logic to check whether an HTTP client is authorized to do something."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TypeAlias, override

from ..scopes import Scope, parse_scopes
from .auth_server import Client as AuthServerClient


class AuthorizationChecker(ABC):
    """An interface to check whether an HTTP client is authorized to do something."""

    @abstractmethod
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """Check whether an HTTP request is authorized.

        Params:
            token: The OAuth 2 access token carried by the request,
                or `None` if it didn't carry such a token.

            required_scopes: The authorization scopes to check against. The request
                passes if the token is authorized for all of these.
        """
        pass


class AlwaysAllowedAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that always allows access."""

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        return AuthorizedResult()


class AuthServerAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that queries auth-server to check authorization."""

    def __init__(self, client: AuthServerClient) -> None:
        self._client = client

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        if token is None:
            # The client is trying to access a protected resource without providing a token.
            # We allow this if and only if access control is disabled.
            access_control_enabled = (
                await self._client.get_auth_settings()
            ).data.accessControlEnabled
            if access_control_enabled:
                return MissingTokenResult()
            else:
                return AuthorizedResult()

        else:
            token_info = await self._client.introspect_token(token)
            provided_scopes = parse_scopes(token_info.scope)

            missing_scopes = required_scopes - provided_scopes

            if not token_info.active:
                return NotAnActiveTokenResult()
            elif missing_scopes:
                return InsufficientScopeResult(provided_scopes)
            else:
                return AuthorizedResult()


@dataclass
class AuthorizedResult:
    """The request is authorized, or no authorization is required."""

    pass


@dataclass
class InsufficientScopeResult:
    """The provided access token is valid, but it isn't authorized with all the required scopes."""

    provided_scopes: set[Scope]
    """The scopes carried by the access token."""


@dataclass
class MissingTokenResult:
    """No access token was provided."""

    pass


@dataclass
class NotAnActiveTokenResult:
    """The provided access token is expired, or was never valid to begin with."""

    pass


Result: TypeAlias = (
    AuthorizedResult
    | InsufficientScopeResult
    | MissingTokenResult
    | NotAnActiveTokenResult
)
