"""Interfaces that endpoints can use to check whether an HTTP client is authorized to do something.

This module should be framework-agnostic, not tied to FastAPI or whatever.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TypeAlias, override

from ..scopes import Scope, parse_scopes
from .auth_server import (
    Client as AuthServerClient,
)

_log = logging.getLogger(__name__)


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


class FailedClosedAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that always denies access.

    This is useful as a fail-closed fallback if configuration is missing.
    """

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """See base class for documentation."""
        return UnableToContactAuthServerResult()


class AlwaysAllowedAuthorizationChecker(AuthorizationChecker):
    """An `AuthorizationChecker` that always allows access."""

    @override
    async def check(self, token: str | None, required_scopes: set[Scope]) -> Result:
        """See base class for documentation."""
        return AuthorizationNotRequiredResult()


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
                return AuthorizationNotRequiredResult()

        else:
            token_info = await self._client.introspect_token(token)

            provided_scopes = parse_scopes(token_info.scope)
            missing_scopes = required_scopes - provided_scopes

            if not token_info.active:
                return NotAnActiveTokenResult()
            elif missing_scopes:
                return InsufficientScopeResult(provided_scopes)
            elif token_info.username is None:
                # This should never happen in practice. Although token_info.username is
                # optional according to the OAuth 2 specs, our implementation in
                # auth-server should always return it.
                raise RuntimeError(
                    "Username not present in token introspection response."
                    " This is a bug in auth-server."
                )
            elif token_info.ot_fullname is None:
                # Similarly, our custom fullname field should be returned always.
                raise RuntimeError(
                    "Fullname not present in token introspection response."
                    " This is a bug in auth-server."
                )
            else:
                return AuthorizedResult(
                    username=token_info.username, fullname=token_info.ot_fullname
                )


@dataclass
class AuthorizationNotRequiredResult:
    """Authorization was neither provided nor required--access control mode is disabled."""

    pass


@dataclass
class AuthorizedResult:
    """The request is authorized with a valid access token."""

    username: str
    fullname: str
    """The user who issued the request."""


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


@dataclass
class UnableToContactAuthServerResult:
    """The authorization server couldn't be contacted."""

    pass


Result: TypeAlias = (
    AuthorizationNotRequiredResult
    | AuthorizedResult
    | InsufficientScopeResult
    | MissingTokenResult
    | NotAnActiveTokenResult
    | UnableToContactAuthServerResult
)
