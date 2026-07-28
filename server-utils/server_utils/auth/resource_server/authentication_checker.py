"""Interfaces that endpoints can use to check whether an HTTP client is authenticated as a user in the system.

This module should be framework-agnostic.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import override

from .auth_server import (
    Client as AuthServerClient,
)
from .types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    AuthenticationResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
    UnableToContactAuthServerResult,
)

_log = logging.getLogger(__name__)


class AuthenticationChecker(ABC):
    """An interface to check whether an HTTP client is authenticated as a user."""

    @abstractmethod
    async def check(self, token: str | None) -> AuthenticationResult:
        """Check whether an HTTP request is from an authenticated user.

        Params:
            token: The OAuth 2 access token carried by the request,
                or `None` if it didn't carry such a token.
        """
        pass

    @abstractmethod
    async def access_control_status(self) -> bool:
        """Check whether access control is currently enabled."""
        pass


class FailedClosedAuthenticationChecker(AuthenticationChecker):
    """An `AuthenticationChecker` that always denies access.

    This is useful as a fail-closed fallback if configuration is missing.
    """

    @override
    async def check(self, token: str | None) -> AuthenticationResult:
        return UnableToContactAuthServerResult()

    @override
    async def access_control_status(self) -> bool:
        return True


class AlwaysAllowedAuthenticationChecker(AuthenticationChecker):
    """An `AuthenticationChecker` that always allows access."""

    @override
    async def check(self, token: str | None) -> AuthenticationResult:
        return AuthenticationNotRequiredResult()

    @override
    async def access_control_status(self) -> bool:
        return True


class AuthServerAuthenticationChecker(AuthenticationChecker):
    """An `AuthenticationChecker` that queries auth-server to check authentication."""

    def __init__(self, client: AuthServerClient) -> None:
        self._client = client

    @override
    async def check(self, token: str | None) -> AuthenticationResult:
        """See base class for documentation."""
        if token is None:
            # The client is trying to access a protected resource without providing a token.
            # We allow this if and only if access control is disabled.
            access_control_enabled = await self.access_control_status()
            if access_control_enabled:
                return MissingTokenResult()
            return AuthenticationNotRequiredResult()
        else:
            token_info = await self._client.introspect_token(token)
            if token_info.active:
                if token_info.username is None:
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

                return AuthenticatedResult(
                    scope=token_info.scope,
                    username=token_info.username,
                    fullname=token_info.ot_fullname,
                )
            return NotAnActiveTokenResult()

    @override
    async def access_control_status(self) -> bool:
        """See base class for documentation."""
        return (await self._client.get_auth_settings()).data.accessControlEnabled
