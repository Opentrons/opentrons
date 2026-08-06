from server_utils.auth.resource_server.authorization_checker import check
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    AuthorizationNotRequiredResult,
    AuthorizedResult,
    InsufficientScopeResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
    UnableToContactAuthServerResult,
)
from server_utils.auth.scopes import Scope, serialize_scopes


def test_check_allows_authentication_not_required() -> None:
    """It should pass AuthenticationNotRequired."""
    assert check(
        authentication=AuthenticationNotRequiredResult(),
        required_scopes={Scope.USERS_WRITE},
    ) == AuthorizationNotRequiredResult(
        authentication=AuthenticationNotRequiredResult()
    )


def test_check_scopes_exact_match() -> None:
    """It should pass a token with the exact scopes required."""
    scopes_set = {Scope.USERS_WRITE, Scope.UPDATES_WRITE}
    assert check(
        authentication=AuthenticatedResult(
            username="somename",
            fullname="somefullname",
            scope=serialize_scopes(scopes_set),
        ),
        required_scopes=scopes_set,
    ) == AuthorizedResult(username="somename", fullname="somefullname")


def test_check_scopes_superset() -> None:
    """It should pass a token with more scopes than required."""
    scopes_set = {Scope.USERS_WRITE, Scope.UPDATES_WRITE}
    assert check(
        authentication=AuthenticatedResult(
            username="somename",
            fullname="somefullname",
            scope=serialize_scopes(scopes_set),
        ),
        required_scopes={Scope.UPDATES_WRITE},
    ) == AuthorizedResult(username="somename", fullname="somefullname")


def test_check_scopes_insufficient() -> None:
    """It should not pass a token with scopes that are required but not present."""
    scopes_set = {Scope.UPDATES_WRITE}
    assert check(
        authentication=AuthenticatedResult(
            username="somename",
            fullname="somefullname",
            scope=serialize_scopes(scopes_set),
        ),
        required_scopes={Scope.USERS_WRITE, Scope.UPDATES_WRITE},
    ) == InsufficientScopeResult(provided_scopes={Scope.UPDATES_WRITE})


def test_check_failed_authentication() -> None:
    """If authentication was not passed, authorization must not pass."""
    assert (
        check(authentication=MissingTokenResult(), required_scopes=set())
        == MissingTokenResult()
    )
    assert (
        check(authentication=NotAnActiveTokenResult(), required_scopes=set())
        == NotAnActiveTokenResult()
    )
    assert (
        check(authentication=UnableToContactAuthServerResult(), required_scopes=set())
        == UnableToContactAuthServerResult()
    )
