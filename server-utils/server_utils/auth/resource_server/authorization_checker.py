"""Interfaces that endpoints can use to check whether an HTTP client is authorized to do something.

This module should be framework-agnostic, not tied to FastAPI or whatever.
"""

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

    @abstractmethod
    async def get_username(self, token: str | None) -> str | None:
        """Return the user who issued a request, if known.

        This is intended for the rare cases where an endpoint needs to apply different
        access control depending on who issued the request. Most endpoints should not
        do this--they should pass a hard-coded list of scopes to `check()` instead.

        Params:
            token: The OAuth 2 access token carried by the request,
                or `None` if it didn't carry such a token.
        """
        pass


class AlwaysAllowedAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that always allows access."""

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """See base class for documentation."""
        return AuthorizedResult()

    @override
    async def get_username(self, token: str | None) -> str | None:
        """See base class for documentation."""
        return None


class AuthServerAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that queries auth-server to check authorization."""

    def __init__(self, client: AuthServerClient) -> None:
        self._client = client

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """See base class for documentation."""
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

    @override
    async def get_username(self, token: str | None) -> str | None:
        """See base class for documentation."""
        if token is None:
            return None
        else:
            token_info = await self._client.introspect_token(token)
            return token_info.username


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
