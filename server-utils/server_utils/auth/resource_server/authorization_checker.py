"""Code to check authorization status."""

from typing import Set

from ..scopes import Scope, parse_scopes
from .types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    AuthenticationResult,
    AuthorizationNotRequiredResult,
    AuthorizationResult,
    AuthorizedResult,
    InsufficientScopeResult,
)


def check(
    authentication: AuthenticationResult, required_scopes: Set[Scope]
) -> AuthorizationResult:
    """Check that an authenticated user is authorized to perform an action."""
    if isinstance(authentication, AuthenticationNotRequiredResult):
        return AuthorizationNotRequiredResult(authentication)
    if not isinstance(authentication, AuthenticatedResult):
        return authentication

    provided_scopes = parse_scopes(authentication.scope)
    missing_scopes = required_scopes - provided_scopes

    if missing_scopes:
        return InsufficientScopeResult(provided_scopes)

    return AuthorizedResult(
        fullname=authentication.fullname, username=authentication.username
    )
